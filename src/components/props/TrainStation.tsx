"use client";

import NoirAsset from "@/components/assets/NoirAsset";

interface Props {
  position: [number, number, number];
  active: boolean;
}

export default function TrainStation({ position, active }: Props) {
  return (
    <group position={position}>
      <NoirAsset name="trainStation" />
      <pointLight
        position={[0, 1.4, 0.35]}
        intensity={active ? 1.0 : 0.35}
        color={active ? "#3affa6" : "#f5a623"}
        distance={active ? 5 : 3}
      />
    </group>
  );
}
