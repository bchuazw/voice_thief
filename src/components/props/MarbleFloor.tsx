"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

interface Props {
  position: [number, number, number];
  size: [number, number];
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

const VERT = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a*noise(p); p*=2.0; a*=0.5; }
    return v;
  }

  void main() {
    vec2 uv = vWorldPos.xz;
    // 1.5-unit tiles, alternating dark/light pattern
    vec2 tile = floor(uv / 1.5);
    float check = mod(tile.x + tile.y, 2.0);
    vec3 darkMarble = vec3(0.32, 0.24, 0.18);
    vec3 lightMarble = vec3(0.58, 0.46, 0.30);
    vec3 base = mix(darkMarble, lightMarble, check);
    // Veining
    float vein = fbm(uv * 1.4);
    base = mix(base, base * 1.45, smoothstep(0.5, 0.7, vein));
    // Tile gap lines
    vec2 cellUv = fract(uv / 1.5);
    float gapX = smoothstep(0.0, 0.02, cellUv.x) * smoothstep(1.0, 0.98, cellUv.x);
    float gapY = smoothstep(0.0, 0.02, cellUv.y) * smoothstep(1.0, 0.98, cellUv.y);
    base *= 0.4 + 0.6 * gapX * gapY;
    gl_FragColor = vec4(base, 1.0);
  }
`;

export default function MarbleFloor({ position, size, onClick }: Props) {
  const uniforms = useMemo(() => ({}), []);
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={onClick}
    >
      <planeGeometry args={size} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
