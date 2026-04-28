"use client";

import { useMemo } from "react";
import * as THREE from "three";

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
  uniform vec3 uColor;
  uniform vec3 uOrigin;
  void main() {
    float dist = length(vWorldPos.xz - uOrigin.xz);
    float h = clamp(1.0 - vWorldPos.y / 5.0, 0.0, 1.0);
    float fall = pow(smoothstep(2.2, 0.0, dist), 2.0);
    float a = fall * h * 0.32;
    gl_FragColor = vec4(uColor, a);
  }
`;

interface Props {
  position: [number, number, number];
  color: string;
}

export default function VolumetricLamp({ position, color }: Props) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOrigin: { value: new THREE.Vector3(...position) },
    }),
    [color, position],
  );

  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 4, 6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} />
      </mesh>
      <pointLight color={color} intensity={1.2} distance={6} decay={2} />
      <mesh position={[0, -1.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.9, 4, 24, 1, true]} />
        <shaderMaterial
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
