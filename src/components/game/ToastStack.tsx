"use client";

import { useGame } from "@/game/store";

export default function ToastStack() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute right-4 top-24 z-20 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded border border-noir-paper/15 bg-black/80 px-3 py-2 text-[12px] text-noir-paper shadow-lg backdrop-blur"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
