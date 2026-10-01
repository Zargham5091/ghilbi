"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Mote {
  id: number;
  x: number;
  y: number;
  size: number;
  drift: number;
  duration: number;
  delay: number;
  opacity: number;
}

const seeded = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export default function Motes({ color, count = 26 }: { color: string; count?: number }) {
  const reduce = useReducedMotion();
  const [motes, setMotes] = useState<Mote[]>([]);

  useEffect(() => {
    setMotes(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: seeded(i + 1) * 100,
        y: seeded(i + 101) * 100,
        size: 2 + seeded(i + 201) * 4,
        drift: 20 + seeded(i + 301) * 40,
        duration: 9 + seeded(i + 401) * 10,
        delay: seeded(i + 501) * 6,
        opacity: 0.25 + seeded(i + 601) * 0.5,
      }))
    );
  }, [count]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {motes.map((m) => (
        <motion.span
          key={m.id}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            background: color,
            boxShadow: `0 0 ${m.size * 4}px ${color}`,
            transition: "background 0.5s ease-in-out, box-shadow 0.5s ease-in-out",
          }}
          animate={{ y: [0, -m.drift, 0], x: [0, m.drift / 2, -m.drift / 3, 0], opacity: [0, m.opacity, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
