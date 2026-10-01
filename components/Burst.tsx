"use client";

import { motion, useReducedMotion } from "framer-motion";

const EMOJI = ["🥂", "✨", "🍇", "🌸", "⭐"];

/** Playful emoji confetti. Bump `trigger` to fire it. */
export default function Burst({ trigger }: { trigger: number }) {
  const reduce = useReducedMotion();
  if (!trigger || reduce) return null;
  const n = 22;
  return (
    <div key={trigger} className="pointer-events-none fixed inset-0 z-[60] grid place-items-center overflow-hidden" aria-hidden>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const d = 150 + (i % 5) * 45;
        return (
          <motion.span
            key={i}
            className="absolute text-2xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d - 90, opacity: 0, scale: 1.4, rotate: (i % 2 ? 1 : -1) * 120 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          >
            {EMOJI[i % EMOJI.length]}
          </motion.span>
        );
      })}
    </div>
  );
}
