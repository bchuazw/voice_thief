import type { Vec3 } from "./types";

export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function moveToward(from: Vec3, to: Vec3, maxStep: number): Vec3 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist <= maxStep) return { x: to.x, y: from.y, z: to.z };
  return {
    x: from.x + (dx / dist) * maxStep,
    y: from.y,
    z: from.z + (dz / dist) * maxStep,
  };
}

interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const STREET_OBSTACLES: AABB[] = [
  { minX: -14, maxX: -6, minZ: -10, maxZ: 2 },
  { minX: 6, maxX: 14, minZ: -10, maxZ: 2 },
];

export function isBlocked(p: Vec3, location: string): boolean {
  if (location !== "street") return false;
  return STREET_OBSTACLES.some(
    (b) => p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ,
  );
}

export function clampToWalkable(target: Vec3, location: string): Vec3 {
  if (!isBlocked(target, location)) return target;
  return { x: target.x, y: target.y, z: Math.max(target.z, 2.5) };
}
