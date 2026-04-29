"use client";

import NoirAsset from "@/components/assets/NoirAsset";

interface Props {
  position: [number, number, number];
}

export default function BankFacade({ position }: Props) {
  return (
    <group position={position}>
      <NoirAsset name="bankFacade" />
      <pointLight position={[-1.4, 2.6, 0.4]} intensity={0.55} color="#ffb060" distance={3} />
      <pointLight position={[1.4, 2.6, 0.4]} intensity={0.55} color="#ffb060" distance={3} />
    </group>
  );
}
