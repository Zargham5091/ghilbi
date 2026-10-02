// components/EnterGate.tsx
"use client";

import {AnimatePresence, motion} from "framer-motion";
import {Play} from "lucide-react";
import Motes from "./Motes";

/**
 * Full-screen "tap to begin" card. The visitor's tap is a real user gesture,
 * which is what lets the browser play sound with no second press.
 */
export default function EnterGate({
                                      open,
                                      accent,
                                      name,
                                      chapters,
                                      onEnter,
                                  }: {
    open: boolean;
    accent: string;
    name: string;
    chapters: number;
    onEnter: () => void;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="gate"
                    exit={{opacity: 0, scale: 1.04}}
                    transition={{duration: 0.9, ease: "easeInOut"}}
                    className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-[#14101f] px-6 text-center"
                >
                    <div
                        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,90,180,0.35),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(246,183,86,0.2),transparent_55%)]"/>
                    <Motes color={accent} count={34}/>

                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 1, delay: 0.2, ease: "easeOut"}}
                        className="relative flex max-w-md flex-col items-center"
                    >
            <span
                className="rounded-full border border-white/20 bg-black/30 px-4 py-1 text-xs tracking-widest text-stone-200">
              2周年記念
            </span>
                        <h1 className="mt-5 text-3xl font-light tracking-widest text-[#fbf1dc] sm:text-5xl">{name}</h1>
                        <p className="mt-3 text-sm tracking-widest text-stone-300">
                            Two years of code, told in {chapters} chapters
                        </p>

                        <div className="relative mt-10">
                            <motion.span
                                className="absolute inset-0 rounded-full"
                                style={{background: accent}}
                                animate={{scale: [1, 1.5], opacity: [0.45, 0]}}
                                transition={{duration: 1.8, repeat: Infinity, ease: "easeOut"}}
                                aria-hidden
                            />
                            <button
                                autoFocus
                                onClick={onEnter}
                                className="relative flex items-center gap-3 rounded-full px-8 py-4 text-sm font-medium tracking-widest text-stone-900 shadow-xl transition hover:scale-105 active:scale-95"
                                style={{background: accent}}
                            >
                                <Play size={16} fill="currentColor"/> Tap to begin
                                <span className="tracking-[0.3em]">始める</span>
                            </button>
                        </div>

                        <p className="mt-6 text-xs tracking-widest text-stone-500">🔊 Sound on · best with headphones</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}