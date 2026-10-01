"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MoveHorizontal } from "lucide-react";
import type { ThenNow as ThenNowData } from "@/lib/content";

/** Drag-to-reveal comparison: "Hello, World" vs. a full enterprise platform. */
export default function ThenNow({ data, accent }: { data: ThenNowData; accent: string }) {
  const [pos, setPos] = useState(50);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm sm:p-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-light tracking-widest text-[#fbf1dc] sm:text-2xl">Then vs. now</h2>
          <p className="mt-1 text-xs tracking-widest text-stone-400">Drag the slider: from one tiny line to a whole platform</p>
        </div>
        <span className="text-xs tracking-[0.4em]" style={{ color: accent }}>
          成長
        </span>
      </div>

      <div className="relative h-80 select-none overflow-hidden rounded-3xl border border-white/10 bg-[#0e0a1a] sm:h-72">
        {/* NEW (base layer) */}
        <div className="absolute inset-0 p-5 sm:p-7">
          <p className="mb-3 text-right text-xs tracking-widest" style={{ color: accent }}>
            {data.newLabel}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.services.map((s, i) => (
              <motion.div
                key={s + i}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.4 + (i % 3) * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] tracking-wide text-stone-200"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
                {s}
              </motion.div>
            ))}
          </div>
        </div>

        {/* OLD (clipped top layer) */}
        <div
          className="absolute inset-0 bg-[#1a1330] p-5 sm:p-7"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          aria-hidden={pos < 8}
        >
          <p className="mb-3 text-xs tracking-widest text-stone-300">{data.oldLabel}</p>
          <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-stone-100 sm:text-sm">
            {data.oldCode}
          </pre>
          <p className="mt-3 text-[11px] tracking-widest text-stone-500">1 file · 1 line · 1 very proud developer</p>
        </div>

        {/* handle */}
        <div className="pointer-events-none absolute inset-y-0 w-0.5" style={{ left: `${pos}%`, background: accent }}>
          <span
            className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-stone-900 shadow-lg"
            style={{ background: accent }}
          >
            <MoveHorizontal size={18} />
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Compare Hello World with the enterprise platform"
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </section>
  );
}
