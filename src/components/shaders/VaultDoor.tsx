"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;
  uniform float uOpen;
  void main() {
    float r = length(vUv - 0.5);
    float ring = smoothstep(0.05, 0.0, abs(fract(r * 8.0 - uTime * 0.05) - 0.5));
    vec3 brass = vec3(0.55, 0.42, 0.18) + ring * 0.2;
    float lock = smoothstep(0.49, 0.5, r) * (1.0 - uOpen);
    vec3 col = brass + vec3(lock * 0.4, 0.0, 0.0);
    float lit = clamp(dot(vNormal, normalize(vec3(0.4, 0.5, 1.0))), 0.0, 1.0);
    col *= 0.4 + lit * 0.8;
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  open: boolean;
  position: [number, number, number];
}

export default function VaultDoor({ open, position }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpen: { value: 0 } }),
    [],
  );
  useFrame((_, dt) => {
    if (!mat.current) return;
    const u = mat.current.uniforms as {
      uTime: { value: number };
      uOpen: { value: number };
    };
    u.uTime.value += dt;
    u.uOpen.value = THREE.MathUtils.damp(u.uOpen.value, open ? 1 : 0, 4, dt);
  });

  return (
    <group position={position} rotation={[0, 0, open ? -1.4 : 0]}>
      <mesh>
        <cylinderGeometry args={[2.4, 2.4, 0.4, 32]} />
        <shaderMaterial
          ref={mat}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
        />
      </mesh>
      <mesh position={[0, 0, 0.25]}>
        <torusGeometry args={[1.4, 0.08, 16, 32]} />
        <meshStandardMaterial color="#a07020" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  );
}
