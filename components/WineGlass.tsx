"use client";

import { motion } from "framer-motion";

function label(p: number) {
  if (p >= 1) return "Fine vintage 🍷";
  if (p > 0.6) return "Aging nicely";
  if (p > 0.25) return "Fermenting…";
  return "Fresh grapes 🍇";
}

/** A wine glass that fills as the journey progresses (0 → 1). */
export default function WineGlass({ progress, color }: { progress: number; color: string }) {
  const p = Math.min(1, Math.max(0, progress));
  const top = 4 + (1 - p) * 28;
  return (
    <div className="flex items-end gap-3" title="Vintage meter: how far along the journey you are">
      <svg width="34" height="56" viewBox="0 0 40 56" aria-hidden>
        <defs>
          <clipPath id="bowl">
            <path d="M8 4 H32 C32 22 28 32 20 32 C12 32 8 22 8 4 Z" />
          </clipPath>
        </defs>
        <g clipPath="url(#bowl)">
          <motion.rect x="0" width="40" height="40" fill={color} initial={false} animate={{ y: top }} transition={{ duration: 0.8, ease: "easeInOut" }} />
        </g>
        <path d="M8 4 H32 C32 22 28 32 20 32 C12 32 8 22 8 4 Z" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.6" />
        <path d="M20 32 V50 M12 52 H28" stroke="rgba(255,255,255,.7)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <div className="flex flex-col pb-1">
        <span className="text-[10px] tracking-widest text-stone-300/80">Vintage meter</span>
        <span className="text-xs tracking-widest" style={{ color }}>
          {label(p)}
        </span>
      </div>
    </div>
  );
}
