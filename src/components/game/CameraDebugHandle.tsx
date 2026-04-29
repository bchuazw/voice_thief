"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Tiny dev helper: writes the camera reference to window.__vtCamera so
 * Playwright tests can rotate it without trying to enable pointer-lock
 * (which is unreliable in headless browsers). Harmless in prod.
 */
export default function CameraDebugHandle() {
  const { camera } = useThree();
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __vtCamera?: unknown }).__vtCamera = camera;
  }, [camera]);
  return null;
}
