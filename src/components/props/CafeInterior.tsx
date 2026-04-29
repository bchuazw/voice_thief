"use client";

import NoirAsset from "@/components/assets/NoirAsset";

export default function CafeInterior() {
  return (
    <group>
      <NoirAsset name="cafeInterior" />
      {[-3, 0, 3].map((x, i) => (
        <pointLight key={i} position={[x, 3.4, -1.8]} intensity={0.4} color="#ffb060" distance={3} />
      ))}
      <pointLight position={[5.5, 1.0, -2.0]} intensity={0.45} color="#ffb060" distance={2.5} />
    </group>
  );
}
