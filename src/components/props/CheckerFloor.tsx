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
  void main() {
    vec2 uv = vWorldPos.xz;
    vec2 cell = floor(uv * 1.6);
    float check = mod(cell.x + cell.y, 2.0);
    vec3 black = vec3(0.16, 0.12, 0.08);
    vec3 cream = vec3(0.82, 0.74, 0.58);
    vec3 base = mix(black, cream, check);
    // Slight grime in cracks
    vec2 cellUv = fract(uv * 1.6);
    float gap = smoothstep(0.0, 0.04, cellUv.x) * smoothstep(1.0, 0.96, cellUv.x) *
                smoothstep(0.0, 0.04, cellUv.y) * smoothstep(1.0, 0.96, cellUv.y);
    base *= 0.7 + 0.3 * gap;
    gl_FragColor = vec4(base, 1.0);
  }
`;

export default function CheckerFloor({ size, onClick }: Props) {
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
