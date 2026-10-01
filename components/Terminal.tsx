"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";

/** Typewriter code card with a playful "Run" button. */
export default function Terminal({ code, output, accent }: { code: string; output: string; accent: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    setRan(false);
    if (reduce) {
      setN(code.length);
      return;
    }
    setN(0);
    const id = setInterval(() => {
      setN((v) => {
        if (v >= code.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, 28);
    return () => clearInterval(id);
  }, [code, reduce]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-black/55 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <button
          onClick={() => setRan(true)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium tracking-widest text-stone-900 transition hover:scale-105 active:scale-95"
          style={{ background: accent }}
        >
          <Play size={11} fill="currentColor" /> Run
        </button>
      </div>
      <pre className="min-h-[96px] whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-stone-100 sm:text-sm">
        {code.slice(0, n)}
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ color: accent }}>
          ▌
        </motion.span>
      </pre>
      <AnimatePresence>
        {ran && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-black/40"
          >
            <p className="px-4 py-3 font-mono text-xs sm:text-sm" style={{ color: accent }}>
              <span className="text-stone-400">$ </span>
              {output || "(no output)"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
