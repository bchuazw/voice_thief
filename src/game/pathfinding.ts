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

export interface CollisionGates {
  bankHallwayUnlocked?: boolean;
  vaultOpen?: boolean;
}

const STREET_OBSTACLES: AABB[] = [
  { minX: -14, maxX: -6, minZ: -10, maxZ: 2 },
  { minX: 6, maxX: 14, minZ: -10, maxZ: 2 },
];

function inBox(p: Vec3, b: AABB): boolean {
  return p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ;
}

function isBankBlocked(p: Vec3, gates: CollisionGates): boolean {
  if (p.x < -11.4 || p.x > 11.4 || p.z > 5.4 || p.z < -15.9) return true;
  if (!gates.bankHallwayUnlocked && p.z < -7.25) return true;
  if (gates.bankHallwayUnlocked && !gates.vaultOpen && p.z < -10.85) return true;
  if (p.z < -7.45 && Math.abs(p.x) > 3.7) return true;
  return false;
}

export function isBlocked(p: Vec3, location: string, gates: CollisionGates = {}): boolean {
  if (location === "street") return STREET_OBSTACLES.some((b) => inBox(p, b));
  if (location === "bankLobby" || location === "bankHallway" || location === "vault") {
    return isBankBlocked(p, gates);
  }
  return false;
}

export function clampToWalkable(target: Vec3, location: string, gates: CollisionGates = {}): Vec3 {
  if (!isBlocked(target, location, gates)) return target;
  if (location === "street") return { x: target.x, y: target.y, z: Math.max(target.z, 2.5) };
  if (location === "bankLobby" || location === "bankHallway" || location === "vault") {
    const next = {
      x: Math.max(-11.3, Math.min(11.3, target.x)),
      y: target.y,
      z: Math.max(-15.8, Math.min(5.3, target.z)),
    };
    if (!gates.bankHallwayUnlocked && next.z < -7.2) next.z = -7.2;
    if (gates.bankHallwayUnlocked && !gates.vaultOpen && next.z < -10.8) next.z = -10.8;
    if (next.z < -7.45) next.x = Math.max(-3.6, Math.min(3.6, next.x));
    return next;
  }
  return target;
}
