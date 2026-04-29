"use client";

import NoirAsset from "@/components/assets/NoirAsset";

interface Props {
  position: [number, number, number];
}

export default function TellerCounter({ position }: Props) {
  return (
    <group position={position}>
      <NoirAsset name="tellerCounter" />
      <pointLight position={[3.5, 1.6, 0.1]} intensity={0.45} color="#ffb060" distance={2.5} />
    </group>
  );
}
