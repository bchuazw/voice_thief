"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

interface Props {
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
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 uv = vWorldPos.xz;
    // Plank size: 0.18 wide × ~1.6 long
    float plankRow = floor(uv.y / 1.6);
    // Stagger — every other row offset
    float offset = mod(plankRow, 2.0) * 0.8;
    vec2 plankUv = vec2(uv.x + offset, uv.y);
    vec2 cell = floor(plankUv * vec2(1.0/0.18, 1.0/1.6));
    float h = hash(cell);
    vec3 base = mix(vec3(0.38, 0.22, 0.12), vec3(0.58, 0.35, 0.18), h);
    // Subtle wood grain via long-axis noise
    float grain = sin(uv.x * 25.0 + h * 6.28);
    base *= 0.95 + 0.05 * grain;
    // Plank gaps
    vec2 plankFrac = fract(plankUv * vec2(1.0/0.18, 1.0/1.6));
    float gapX = smoothstep(0.0, 0.04, plankFrac.x) * smoothstep(1.0, 0.96, plankFrac.x);
    float gapY = smoothstep(0.0, 0.02, plankFrac.y) * smoothstep(1.0, 0.98, plankFrac.y);
    base *= 0.5 + 0.5 * gapX * gapY;
    gl_FragColor = vec4(base, 1.0);
  }
`;

export default function HardwoodFloor({ size, onClick }: Props) {
  const uniforms = useMemo(() => ({}), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
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
