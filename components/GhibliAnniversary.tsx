"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, LogOut, Pencil, Repeat } from "lucide-react";
import { DEFAULT_CONTENT, THEMES, sanitizeContent, type Chapter, type SiteContent } from "@/lib/content";
import { sceneDataUri } from "@/lib/scenes";
import AudioPill from "./LofiPlayer";
import Burst from "./Burst";
import EditorPanel from "./EditorPanel";
import LoginDialog from "./LoginDialog";
import Motes from "./Motes";
import Terminal from "./Terminal";
import ThenNow from "./ThenNow";
import WineGlass from "./WineGlass";

const AUTOPLAY_MS = 6000;
const FADE = { duration: 0.5, ease: "easeInOut" } as const;
const CREAM = "#fbf1dc";

const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
)}")`;

type Tab = "struggle" | "goal" | "lesson";
const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "struggle", label: "Struggle", emoji: "🌧️" },
  { key: "goal", label: "Goal", emoji: "🎯" },
  { key: "lesson", label: "Lesson", emoji: "🌱" },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: FADE } };

function imageFor(c: Chapter, failed: boolean): string {
  if (!failed) {
    if (c.imageId) return `/api/images/${c.imageId}`;
    if (c.imageUrl) return c.imageUrl;
  }
  return sceneDataUri(c.scene, c.theme);
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  ch: string;
}

export default function GhibliAnniversary() {
  const reduce = useReducedMotion();
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT);
  const [dirty, setDirty] = useState(false);
  const [dbOk, setDbOk] = useState(false);
  const [cheers, setCheers] = useState(0);
  const [cheered, setCheered] = useState(false);
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState<Tab>("struggle");
  const [autoPlay, setAutoPlay] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const total = content.chapters.length;
  const safeIdx = Math.min(idx, total - 1);
  const chapter = content.chapters[safeIdx];
  const theme = THEMES[chapter.theme];
  const accent = theme.accent;
  const totalRef = useRef(total);
  totalRef.current = total;

  /* ---------- load from MongoDB (falls back to built-in defaults) ---------- */
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/content", { cache: "no-store" });
      const d = (await r.json()) as { content: unknown; dbConnected: boolean; cheers: number };
      setContent(sanitizeContent(d.content));
      setDbOk(Boolean(d.dbConnected));
      setCheers(d.cheers ?? 0);
      setDirty(false);
    } catch {
      setDbOk(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch("/api/session")
      .then((r) => r.json())
      .then((d: { authenticated?: boolean }) => setAuthed(Boolean(d.authenticated)))
      .catch(() => setAuthed(false));
    try {
      setCheered(localStorage.getItem("anniversary-cheered") === "1");
    } catch {
      /* storage blocked */
    }
  }, [load]);

  /* ---------- navigation ---------- */
  const go = useCallback((n: number) => setIdx(((n % totalRef.current) + totalRef.current) % totalRef.current), []);

  useEffect(() => setTab("struggle"), [safeIdx]);

  useEffect(() => {
    if (!autoPlay) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % totalRef.current), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [autoPlay]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.key === "ArrowRight") go(safeIdx + 1);
      if (e.key === "ArrowLeft") go(safeIdx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, safeIdx]);

  // confetti when the journey reaches its final chapter
  useEffect(() => {
    if (safeIdx > 0 && safeIdx === totalRef.current - 1) setBurst((b) => b + 1);
  }, [safeIdx]);

  /* ---------- playful bits ---------- */
  const spark = (e: ReactPointerEvent<HTMLElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    const ch = ["✨", "🌸", "⭐", "🍃"][Math.floor(Math.random() * 4)];
    setSparkles((s) => [...s.slice(-8), { id, x: e.clientX - rect.left, y: e.clientY - rect.top, ch }]);
    window.setTimeout(() => setSparkles((s) => s.filter((p) => p.id !== id)), 1000);
  };

  const cheer = async () => {
    setBurst((b) => b + 1);
    if (cheered) return;
    setCheered(true);
    setCheers((c) => c + 1);
    try {
      localStorage.setItem("anniversary-cheered", "1");
    } catch {
      /* ignore */
    }
    try {
      const r = await fetch("/api/cheer", { method: "POST" });
      const d = (await r.json()) as { cheers?: number };
      if (r.ok && typeof d.cheers === "number") setCheers(d.cheers);
    } catch {
      /* keep optimistic count */
    }
  };

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => undefined);
    setAuthed(false);
    setEditorOpen(false);
    if (dirty) load();
  };

  const edit = (c: SiteContent) => {
    setContent(c);
    setDirty(true);
  };

  const { profile } = content;
  const subtitle = [profile.role.trim(), profile.company.trim()].filter(Boolean).join(" @ ");
  const gradient = `linear-gradient(160deg, ${theme.from}d9, ${theme.via}73 55%, ${theme.to}59)`;

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#14101f] px-3 pb-24 pt-16 font-sans text-stone-100 sm:px-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,90,180,0.25),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(246,183,86,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        {/* ====================== JOURNEY STAGE ====================== */}
        <motion.section
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          onPointerDown={spark}
          className="relative flex min-h-[820px] flex-col overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)] md:min-h-[680px]"
        >
          {/* background image (cross-fades, slow zoom) */}
          <AnimatePresence mode="sync">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              key={`img-${chapter.id}`}
              src={imageFor(chapter, Boolean(failed[chapter.id]))}
              alt=""
              onError={() => setFailed((f) => ({ ...f, [chapter.id]: true }))}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: FADE, scale: { duration: 8, ease: "easeOut" } }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </AnimatePresence>
          <AnimatePresence mode="sync">
            <motion.div
              key={`tint-${chapter.id}-${chapter.theme}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              className="absolute inset-0"
              style={{ background: gradient }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(8,5,16,0.75)_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
          <Motes color={accent} />

          {/* header: identity + chapter chip */}
          <motion.header
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } } }}
            className="relative z-10 flex items-start justify-between gap-3 p-5 sm:p-8"
          >
            <div>
              <motion.span variants={fadeUp} className="inline-block rounded-md border border-white/20 bg-white/5 px-2.5 py-0.5 text-[11px] tracking-widest text-stone-200/90 backdrop-blur-sm">
                開発者
              </motion.span>
              <motion.h1 variants={fadeUp} className="mt-2 text-2xl font-light tracking-widest drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-4xl" style={{ color: CREAM }}>
                {profile.name || "Your Name"}
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-1 text-xs font-light tracking-widest text-stone-100/90 sm:text-sm">
                {subtitle}
                {profile.jpBadge && (
                  <span className="ml-3 tracking-[0.4em]" style={{ color: accent, transition: "color .5s ease-in-out" }}>
                    {profile.jpBadge}
                  </span>
                )}
              </motion.p>
            </div>
            <motion.div variants={fadeUp} className="flex flex-col items-end gap-2">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`chip-${chapter.id}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={FADE}
                  className="rounded-full border px-3.5 py-1.5 text-[11px] font-medium tracking-widest backdrop-blur-md sm:text-xs"
                  style={{ borderColor: `${accent}88`, color: accent, background: "rgba(15,10,25,0.45)" }}
                >
                  {chapter.kicker.toUpperCase()} • {chapter.period.toUpperCase()}
                </motion.span>
              </AnimatePresence>
              <span className="rounded-full border border-white/20 bg-black/30 px-3.5 py-1 text-[11px] tracking-widest text-stone-200 backdrop-blur-md sm:text-xs">
                2周年記念
              </span>
            </motion.div>
          </motion.header>

          {/* chapter content (swipe left/right on touch screens) */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -90) go(safeIdx + 1);
              else if (info.offset.x > 90) go(safeIdx - 1);
            }}
            className="relative z-10 flex flex-1 items-center px-5 py-4 sm:px-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={chapter.id}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -16, transition: FADE }}
                variants={{ show: { transition: { staggerChildren: 0.12 } } }}
                className="grid w-full items-center gap-6 md:grid-cols-5 md:gap-10"
              >
                <div className="md:col-span-3">
                  <motion.p variants={fadeUp} className="text-xs tracking-[0.4em]" style={{ color: accent }}>
                    {chapter.jp}
                  </motion.p>
                  <motion.h2 variants={fadeUp} className="mt-2 text-3xl font-light tracking-widest drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:text-5xl" style={{ color: CREAM }}>
                    {chapter.title}
                  </motion.h2>
                  <motion.p variants={fadeUp} className="mt-4 max-w-prose text-sm leading-relaxed tracking-wide text-stone-100/90 sm:text-base">
                    {chapter.story}
                  </motion.p>

                  <motion.div variants={fadeUp} className="mt-5">
                    <div className="flex flex-wrap gap-2" role="tablist">
                      {TABS.map((t) => (
                        <motion.button
                          key={t.key}
                          role="tab"
                          aria-selected={tab === t.key}
                          onClick={() => setTab(t.key)}
                          whileHover={{ rotate: [0, -3, 3, 0], transition: { duration: 0.4 } }}
                          whileTap={{ scale: 0.94 }}
                          className="rounded-full border px-4 py-1.5 text-xs tracking-widest backdrop-blur-md transition"
                          style={
                            tab === t.key
                              ? { background: accent, borderColor: accent, color: "#1c1326" }
                              : { borderColor: "rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.3)", color: "#f5f5f4" }
                          }
                        >
                          <span className="mr-1.5">{t.emoji}</span>
                          {t.label}
                        </motion.button>
                      ))}
                    </div>
                    <div className="mt-3 min-h-[72px] rounded-2xl border border-white/15 bg-black/40 p-4 backdrop-blur-md">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={tab}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="text-sm leading-relaxed tracking-wide text-stone-100"
                        >
                          {chapter[tab]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={fadeUp} className="md:col-span-2">
                  <Terminal code={chapter.code} output={chapter.output} accent={accent} />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* footer: timeline + wine glass + music */}
          <footer className="relative z-10 space-y-4 p-5 sm:p-8">
            <div className="flex items-center gap-3">
              <button onClick={() => go(safeIdx - 1)} aria-label="Previous chapter" className="rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur-md transition hover:bg-black/60">
                <ChevronLeft size={18} />
              </button>
              <ol className="flex flex-1 items-center gap-1.5" aria-label="Journey chapters">
                {content.chapters.map((c, i) => (
                  <li key={c.id} className="flex-1">
                    <button
                      onClick={() => {
                        setAutoPlay(false);
                        go(i);
                      }}
                      aria-label={`Chapter ${i + 1}: ${c.title}`}
                      aria-current={i === safeIdx}
                      title={c.title}
                      className="group block w-full py-2"
                    >
                      <span
                        className="block h-1.5 rounded-full transition-all duration-500 group-hover:h-2.5"
                        style={{
                          background: i <= safeIdx ? accent : "rgba(255,255,255,0.28)",
                          opacity: i === safeIdx ? 1 : i < safeIdx ? 0.6 : 1,
                        }}
                      />
                    </button>
                  </li>
                ))}
              </ol>
              <button onClick={() => go(safeIdx + 1)} aria-label="Next chapter" className="rounded-full border border-white/20 bg-black/40 p-2 backdrop-blur-md transition hover:bg-black/60">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex items-end justify-between gap-3">
              <WineGlass progress={total > 1 ? safeIdx / (total - 1) : 1} color={accent} />
              <div className="flex items-center gap-3">
                <span className="hidden text-xs tracking-widest text-stone-300/80 sm:block">
                  {safeIdx + 1} / {total}
                </span>
                <AudioPill
                    accent={accent}
                    src={chapter.audioId ? `/api/audio?id=${chapter.audioId}` : chapter.audioUrl}
                    start={chapter.audioStart}
                    length={chapter.audioLen}
                />
              </div>
            </div>
          </footer>

          {/* click sparkles */}
          {sparkles.map((s) => (
            <motion.span
              key={s.id}
              initial={{ opacity: 1, y: 0, scale: 0.6 }}
              animate={{ opacity: 0, y: -50, scale: 1.4 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="pointer-events-none absolute z-20 text-xl"
              style={{ left: s.x - 10, top: s.y - 10 }}
              aria-hidden
            >
              {s.ch}
            </motion.span>
          ))}
        </motion.section>

        {/* ====================== THEN vs NOW ====================== */}
        <ThenNow data={content.thenNow} accent={accent} />

        {/* ====================== GOALS + CHEERS ====================== */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-8">
            <h2 className="text-xl font-light tracking-widest sm:text-2xl" style={{ color: CREAM }}>
              Next vintages <span className="ml-2 text-xs tracking-[0.4em]" style={{ color: accent }}>次の年</span>
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {content.goalsAhead.map((g, i) => (
                <motion.li
                  key={g + i}
                  whileHover={{ y: -4, rotate: i % 2 ? 1.5 : -1.5 }}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs tracking-wide text-stone-100 sm:text-sm"
                >
                  🍇 {g}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-sm sm:p-8">
            <h2 className="text-xl font-light tracking-widest sm:text-2xl" style={{ color: CREAM }}>
              Raise a glass
            </h2>
            <p className="mt-2 text-xs tracking-widest text-stone-400">Leave a cheer for the next two years</p>
            <motion.button
              onClick={cheer}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92, rotate: -6 }}
              className="mt-5 rounded-full px-7 py-3 text-sm font-medium tracking-widest text-stone-900 shadow-lg"
              style={{ background: accent, transition: "background .5s ease-in-out" }}
            >
              🥂 {cheered ? "Cheers, thank you!" : "Cheers!"}
            </motion.button>
            <p className="mt-3 text-xs tracking-widest text-stone-400">
              {cheers} {cheers === 1 ? "cheer" : "cheers"} so far
            </p>
          </div>
        </section>

        <p className="pb-4 text-center text-xs tracking-widest text-stone-500">Aging like fine wine · 熟成 · better with every release</p>
      </div>

      {/* ====================== FIXED CONTROLS ====================== */}
      <button
        onClick={() => setAutoPlay((a) => !a)}
        aria-pressed={autoPlay}
        className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs tracking-widest text-stone-100 backdrop-blur-md transition hover:bg-black/70"
        style={autoPlay ? { borderColor: accent, color: accent } : undefined}
      >
        <Repeat size={14} className={autoPlay ? "animate-spin [animation-duration:4s]" : ""} />
        {autoPlay ? "Auto-Play: On" : "Auto-Play Journey"}
      </button>

      {authed ? (
        <>
          <button onClick={logout} className="fixed left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs tracking-widest text-stone-100 backdrop-blur-md transition hover:bg-black/70">
            <LogOut size={14} /> Log out
          </button>
          <button
            onClick={() => setEditorOpen((o) => !o)}
            className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full px-5 py-3 text-xs font-medium tracking-widest text-stone-900 shadow-xl transition hover:scale-105"
            style={{ background: accent }}
          >
            <Pencil size={14} /> {dirty ? "Edit • unsaved" : "Edit"}
          </button>
        </>
      ) : (
        <button onClick={() => setLoginOpen(true)} aria-label="Admin login" className="fixed bottom-4 left-4 z-30 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-2 text-[11px] tracking-widest text-stone-400 backdrop-blur-md transition hover:text-stone-100">
          <Lock size={12} /> Admin
        </button>
      )}

      <EditorPanel
        open={authed && editorOpen}
        onClose={() => setEditorOpen(false)}
        content={content}
        idx={safeIdx}
        dirty={dirty}
        dbOk={dbOk}
        accent={accent}
        onChange={edit}
        onSelect={go}
        onSaved={(c) => {
          setContent(c);
          setDirty(false);
          setDbOk(true);
        }}
      />

      <AnimatePresence>
        {loginOpen && (
          <LoginDialog
            accent={accent}
            onClose={() => setLoginOpen(false)}
            onSuccess={() => {
              setAuthed(true);
              setLoginOpen(false);
              setEditorOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <Burst trigger={burst} />
    </main>
  );
}
