"use client";

import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";
import { isBlocked } from "@/game/pathfinding";
import type { LocationId } from "@/game/types";

const EYE_HEIGHT = 1.62;
const WALK_SPEED = 4.2;
const RUN_SPEED = 6.6;

interface Props {
  scene: LocationId;
}

export default function FirstPersonController({ scene }: Props) {
  const { camera, gl } = useThree();
  const setPlayerPosition = useGame((s) => s.setPlayerPosition);
  const setPointerLocked = useGame((s) => s.setPointerLocked);
  const modalOpen = useGame(
    (s) => s.notebookOpen || s.phoneOpen || s.menuOpen || s.activeAuth !== null || s.phase === "won" || s.phase === "lost",
  );
  const keys = useRef<Record<string, boolean>>({});
  const controlsRef = useRef<{
    isLocked: boolean;
    lock: () => void;
    unlock: () => void;
  } | null>(null);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      keys.current[e.code] = true;
    }
    function up(e: KeyboardEvent) {
      keys.current[e.code] = false;
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    function onLock() {
      setPointerLocked(true);
    }
    function onUnlock() {
      setPointerLocked(false);
    }
    const dom = gl.domElement;
    dom.addEventListener("pointerlockchange", () => {
      if (document.pointerLockElement === dom) onLock();
      else onUnlock();
    });
    return () => undefined;
  }, [gl, setPointerLocked]);

  useFrame((_, dt) => {
    const player = useGame.getState().player;

    // Sync camera position to player + eye height (X/Z; mouselook handles look angle)
    camera.position.set(player.position.x, EYE_HEIGHT, player.position.z);

    // Pause movement when modal open
    const s = useGame.getState();
    if (s.notebookOpen || s.phoneOpen || s.menuOpen || s.activeAuth !== null) return;

    // Build a forward vector from camera yaw (ignore pitch — no flying)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));

    const move = new THREE.Vector3();
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) move.add(forward);
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) move.sub(forward);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) move.sub(right);
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) move.add(right);
    if (move.lengthSq() < 1e-6) return;

    const speed = keys.current["ShiftLeft"] || keys.current["ShiftRight"] ? RUN_SPEED : WALK_SPEED;
    move.normalize().multiplyScalar(speed * dt);

    let nx = player.position.x + move.x;
    let nz = player.position.z + move.z;

    // Step-by-axis collision: if X moved into a blocked zone, only allow Z, and vice versa
    const gates = {
      bankHallwayUnlocked: s.bankHallwayUnlocked,
      vaultOpen: s.vaultOpen,
    };
    if (isBlocked({ x: nx, y: 0, z: nz }, scene, gates)) {
      if (!isBlocked({ x: nx, y: 0, z: player.position.z }, scene, gates)) {
        nz = player.position.z;
      } else if (!isBlocked({ x: player.position.x, y: 0, z: nz }, scene, gates)) {
        nx = player.position.x;
      } else {
        return;
      }
    }

    setPlayerPosition({ x: nx, y: 0, z: nz });
  });

  if (modalOpen) return null;

  return (
    <PointerLockControls
      ref={controlsRef as never}
      makeDefault
      onLock={() => setPointerLocked(true)}
      onUnlock={() => setPointerLocked(false)}
    />
  );
}
