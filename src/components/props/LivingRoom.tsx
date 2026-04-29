"use client";

import NoirAsset from "@/components/assets/NoirAsset";

export default function LivingRoom() {
  return (
    <group>
      <NoirAsset name="livingRoom" />
      <pointLight position={[3.2, 1.08, -2.8]} intensity={0.65} color="#ffb060" distance={2.8} />
    </group>
  );
}
