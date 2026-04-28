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
  void main() {
    vec2 uv = vUv * 6.0;
    float ripple = sin(uv.x * 4.0 + uTime * 1.6) * cos(uv.y * 4.0 - uTime * 1.2);
    vec3 base = vec3(0.05, 0.06, 0.08);
    vec3 sheen = vec3(0.2, 0.25, 0.4) * (0.4 + 0.6 * smoothstep(0.6, 1.0, fract(uv.y + uTime*0.05)));
    vec3 rip = vec3(0.05, 0.07, 0.1) * ripple * 0.3;
    gl_FragColor = vec4(base + sheen * 0.3 + rip, 1.0);
  }
`;

export default function WetAsphalt() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (mat.current) (mat.current.uniforms as { uTime: { value: number } }).uTime.value += dt;
  });
  return (
    <shaderMaterial
      ref={mat}
      vertexShader={VERT}
      fragmentShader={FRAG}
      uniforms={uniforms}
    />
  );
}
