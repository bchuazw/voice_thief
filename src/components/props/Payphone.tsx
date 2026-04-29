"use client";

import NoirAsset from "@/components/assets/NoirAsset";

interface Props {
  position: [number, number, number];
}

export default function Payphone({ position }: Props) {
  return (
    <group position={position}>
      <NoirAsset name="payphone" />
      <pointLight position={[0, 2.0, 0.3]} intensity={0.45} color="#ff5050" distance={2.5} />
    </group>
  );
}
