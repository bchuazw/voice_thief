"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;
    uv.x *= 1.5;
    uv.y -= uTime * 0.7;
    vec2 cell = floor(uv * vec2(120.0, 60.0));
    float r = rand(cell);
    float streak = step(0.985, r);
    float fade = smoothstep(0.0, 0.5, fract(uv.y * 60.0));
    vec3 col = vec3(0.7, 0.78, 0.95) * streak * fade;
    float alpha = streak * fade * 0.55;
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function RainShader() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    if (mat.current) (mat.current.uniforms as { uTime: { value: number } }).uTime.value += dt;
  });

  return (
    <mesh position={[0, 6, 4]} rotation={[0, 0, 0]}>
      <planeGeometry args={[60, 18]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
