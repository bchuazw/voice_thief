"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { GroupProps } from "@react-three/fiber";
import type * as THREE from "three";

const ASSETS = {
  apartmentBlock: "/models/noir-kit/apartment-block.glb",
  bankFacade: "/models/noir-kit/bank-facade.glb",
  cafeInterior: "/models/noir-kit/cafe-interior.glb",
  cafeFacade: "/models/noir-kit/cafe-facade.glb",
  livingRoom: "/models/noir-kit/living-room.glb",
  payphone: "/models/noir-kit/payphone.glb",
  recordsCabinet: "/models/noir-kit/records-cabinet.glb",
  recordsPlaque: "/models/noir-kit/records-plaque.glb",
  tellerCounter: "/models/noir-kit/teller-counter.glb",
  trainStation: "/models/noir-kit/train-station.glb",
  vaultAuditPanel: "/models/noir-kit/vault-audit-panel.glb",
} as const;

export type NoirAssetName = keyof typeof ASSETS;

interface Props extends GroupProps {
  name: NoirAssetName;
}

export default function NoirAsset({ name, ...props }: Props) {
  const gltf = useGLTF(ASSETS[name]) as { scene: THREE.Group };
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return <primitive object={scene} {...props} />;
}

Object.values(ASSETS).forEach((asset) => useGLTF.preload(asset));
