"use client";

import NoirAsset from "@/components/assets/NoirAsset";

interface Props {
  position: [number, number, number];
}

export default function CafeFacade({ position }: Props) {
  return (
    <group position={position}>
      <NoirAsset name="cafeFacade" />
      <pointLight position={[1.6, 3.2, 0.4]} intensity={0.5} color="#ffb060" distance={3} />
    </group>
  );
}
