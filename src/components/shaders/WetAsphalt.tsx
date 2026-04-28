"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  uniform float uTime;
  uniform vec3 uLamp0;
  uniform vec3 uLamp1;
  uniform vec3 uLamp2;
  uniform vec3 uLampColor0;
  uniform vec3 uLampColor1;
  uniform vec3 uLampColor2;
  uniform vec3 uCamPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  // Smear a lamp's reflection toward the camera along the wet ground.
  // Returns warm color contribution.
  vec3 lampReflection(vec3 lampPos, vec3 lampColor, vec2 worldXZ, vec2 dirToCam) {
    vec2 lampXZ = lampPos.xz;
    vec2 toLamp = worldXZ - lampXZ;
    float dist = length(toLamp);
    // Project displacement from the lamp onto the (camera-direction)
    // and (perpendicular-to-camera) axes. Wet pavement smears the
    // reflection along the line between viewer and source.
    vec2 dirNorm = normalize(toLamp + 0.0001);
    float along = dot(dirNorm, dirToCam);
    vec2 perpAxis = vec2(-dirToCam.y, dirToCam.x);
    float lateral = abs(dot(toLamp, perpAxis));
    // Streak width 1.0 unit, length proportional to distance.
    float widthFalloff = smoothstep(1.4, 0.0, lateral);
    float lengthFalloff = exp(-dist * 0.12);
    // Weight forward of lamp toward camera, not behind.
    float forwardBias = smoothstep(-0.2, 0.4, along);
    return lampColor * widthFalloff * lengthFalloff * forwardBias;
  }

  void main() {
    vec2 worldXZ = vWorldPos.xz;
    // Low-frequency puddle map: bright wet patches vs. drier asphalt
    float puddle = fbm(worldXZ * 0.15);
    float puddleMask = smoothstep(0.4, 0.7, puddle);

    // Base asphalt — slightly warmer near puddles
    vec3 base = mix(vec3(0.07, 0.08, 0.10), vec3(0.12, 0.14, 0.20), puddleMask);

    // Diagonal sheen sweep so the ground always has SOMETHING moving
    float sheen = smoothstep(0.6, 1.0, fract(worldXZ.x * 0.04 + worldXZ.y * 0.06 + uTime * 0.04));
    base += vec3(0.04, 0.05, 0.08) * sheen * 0.6;

    // Ripple animation, brighter inside puddles
    float ripple = sin(worldXZ.x * 4.0 + uTime * 1.6) * cos(worldXZ.y * 4.0 - uTime * 1.2);
    base += vec3(0.04) * ripple * (0.35 + 0.65 * puddleMask);

    // Direction toward camera on the ground plane (for smear axis)
    vec2 dirToCam = normalize(uCamPos.xz - worldXZ + vec2(0.0001));

    vec3 reflections = vec3(0.0);
    reflections += lampReflection(uLamp0, uLampColor0, worldXZ, dirToCam);
    reflections += lampReflection(uLamp1, uLampColor1, worldXZ, dirToCam);
    reflections += lampReflection(uLamp2, uLampColor2, worldXZ, dirToCam);
    // Boost: reflection is the noir money shot
    reflections *= 4.5 * (0.5 + 0.5 * puddleMask);

    vec3 col = base + reflections;
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface Props {
  lampPositions?: [number, number, number][];
  lampColors?: string[];
}

export default function WetAsphalt({
  lampPositions = [
    [-12, 4, 4],
    [12, 4, 4],
    [0, 4, -8],
  ],
  lampColors = ["#f5a623", "#ffe9b0", "#f5a623"],
}: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => {
    const c = (h: string) => new THREE.Color(h);
    return {
      uTime: { value: 0 },
      uLamp0: { value: new THREE.Vector3(...lampPositions[0]) },
      uLamp1: { value: new THREE.Vector3(...lampPositions[1]) },
      uLamp2: { value: new THREE.Vector3(...lampPositions[2]) },
      uLampColor0: { value: c(lampColors[0]) },
      uLampColor1: { value: c(lampColors[1]) },
      uLampColor2: { value: c(lampColors[2]) },
      uCamPos: { value: new THREE.Vector3(0, 14, 18) },
    };
  }, [lampPositions, lampColors]);

  useFrame((s, dt) => {
    if (!mat.current) return;
    const u = mat.current.uniforms as {
      uTime: { value: number };
      uCamPos: { value: THREE.Vector3 };
    };
    u.uTime.value += dt;
    u.uCamPos.value.copy(s.camera.position);
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
