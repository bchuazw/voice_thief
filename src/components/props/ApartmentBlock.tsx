"use client";

import NoirAsset from "@/components/assets/NoirAsset";

interface Props {
  position: [number, number, number];
}

export default function ApartmentBlock({ position }: Props) {
  return (
    <group position={position}>
      <NoirAsset name="apartmentBlock" />
      <pointLight position={[0, 2.6, 0.3]} intensity={0.4} color="#ffb060" distance={3} />
    </group>
  );
}
