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
    uv.x *= 1.4;
    // Fast vertical scroll at 1.4x speed
    uv.y -= uTime * 1.4;
    // Dense cell grid → many tiny drops
    vec2 cellCount = vec2(220.0, 90.0);
    vec2 cell = floor(uv * cellCount);
    float r = rand(cell);
    // Only ~2.5% of cells are streaks
    float seed = step(0.975, r);
    // Vertical tail inside the cell — gives each drop length, not a square
    vec2 cellUv = fract(uv * cellCount);
    float tail = smoothstep(0.0, 0.08, cellUv.y) * smoothstep(1.0, 0.4, cellUv.y);
    // Subtle horizontal taper so the streak is a needle, not a stick
    float horiz = smoothstep(0.55, 0.5, abs(cellUv.x - 0.5));
    float streak = seed * tail * horiz;
    // Cool gray-blue tint
    vec3 col = vec3(0.78, 0.84, 1.0) * streak;
    float alpha = streak * 0.32;
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function RainShader() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  useFrame((_, dt) => {
    if (mat.current) (mat.current.uniforms as { uTime: { value: number } }).uTime.value += dt;
  });

  // Two staggered curtains tilted toward camera so streaks read as falling
  // lines rather than a flat layer of stickers.
  return (
    <group>
      <mesh position={[0, 5, 6]} rotation={[-0.5, 0, 0]}>
        <planeGeometry args={[80, 22]} />
        <shaderMaterial
          ref={mat}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 5, -2]} rotation={[-0.4, 0, 0]}>
        <planeGeometry args={[80, 22]} />
        <shaderMaterial
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
