// components/LofiPlayer.tsx
"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import {motion} from "framer-motion";
import {Play, Volume2, VolumeX} from "lucide-react";

const CHORDS: number[][] = [
    [220.0, 261.63, 329.63, 392.0],
    [174.61, 220.0, 261.63, 329.63],
    [130.81, 196.0, 261.63, 329.63],
    [196.0, 246.94, 293.66, 329.63],
];

const CLIP_VOLUME = 0.7;
const FADE_MS = 600;

/** Smoothly move an audio element's volume. */
function fade(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
    const from = el.volume;
    const t0 = performance.now();
    const id = window.setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
        if (k >= 1) {
            window.clearInterval(id);
            done?.();
        }
    }, 40);
}

function Equalizer({active, color}: { active: boolean; color: string }) {
    return (
        <div className="flex h-6 items-end gap-[3px]" aria-hidden>
            {[0.5, 1, 0.7, 0.9, 0.4].map((peak, i) => (
                <motion.span
                    key={i}
                    className="w-[3px] origin-bottom rounded-full"
                    style={{height: "100%", background: color}}
                    animate={active ? {scaleY: [0.2, peak, 0.3, peak * 0.8, 0.2]} : {scaleY: 0.2}}
                    transition={active ? {
                        duration: 1.1 + i * 0.13,
                        repeat: Infinity,
                        ease: "easeInOut"
                    } : {duration: 0.3}}
                />
            ))}
        </div>
    );
}

interface Props {
    accent: string;
    /** Chapter clip URL; empty = built-in ambient lofi pad. */
    src: string;
    /** Second where the played part begins. */
    start: number;
    /** Seconds of the track that play before looping back to `start`. */
    length: number;
}

/**
 * Plays the current chapter's clip (only the chosen part, looped) and
 * cross-fades when the chapter changes. Sound is ON by default. Browsers block
 * sound until the visitor touches the page once, so it starts on the first
 * click / tap / key press if the automatic start is refused.
 */
export default function ChapterAudio({accent, src, start, length}: Props) {
    const [enabled, setEnabled] = useState(true);
    const [blocked, setBlocked] = useState(false);
    const [clipFailed, setClipFailed] = useState(false);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const clipRef = useRef<HTMLAudioElement | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);
    const masterRef = useRef<GainNode | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const useClip = Boolean(src) && !clipFailed;

    useEffect(() => setClipFailed(false), [src]);

    /** Start whatever is waiting for permission (must run inside a user gesture). */
    const retry = useCallback(() => {
        const el = clipRef.current;
        if (el && el.paused) {
            el.play()
                .then(() => {
                    setBlocked(false);
                    fade(el, CLIP_VOLUME, FADE_MS);
                })
                .catch(() => undefined);
        }
        ctxRef.current?.resume().catch(() => undefined);
    }, []);

    /* the first click / tap / key press anywhere on the page unlocks sound.
       Presses on the sound button itself are handled by the button (so they never mute). */
    useEffect(() => {
        const onGesture = (e: Event) => {
            if (rootRef.current && e.target instanceof Node && rootRef.current.contains(e.target)) return;
            retry();
        };
        const events = ["pointerdown", "touchend", "click", "keydown"] as const;
        events.forEach((ev) => window.addEventListener(ev, onGesture, {passive: true}));
        return () => events.forEach((ev) => window.removeEventListener(ev, onGesture));
    }, [retry]);

    /* ---------------- ambient synth (fallback when a chapter has no clip) ---------------- */
    const stopSynth = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        const ctx = ctxRef.current;
        const master = masterRef.current;
        if (ctx && master) {
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
            window.setTimeout(() => ctx.close().catch(() => undefined), 700);
        }
        ctxRef.current = null;
        masterRef.current = null;
    }, []);

    const startSynth = useCallback(() => {
        const AC =
            window.AudioContext || (window as unknown as {
                webkitAudioContext?: typeof AudioContext
            }).webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const master = ctx.createGain();
        master.gain.value = 0;
        master.gain.setTargetAtTime(0.18, ctx.currentTime, 0.4);
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 900;
        filter.connect(master);
        master.connect(ctx.destination);
        ctxRef.current = ctx;
        masterRef.current = master;

        setBlocked(ctx.state === "suspended");
        ctx.onstatechange = () => setBlocked(ctx.state === "suspended");

        let step = 0;
        const playChord = () => {
            const now = ctx.currentTime;
            const chord = CHORDS[step % CHORDS.length];
            chord.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = i === 0 ? "sine" : "triangle";
                osc.frequency.value = freq;
                osc.detune.value = (i - 1.5) * 4;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.22, now + 0.8);
                g.gain.linearRampToValueAtTime(0, now + 3.9);
                osc.connect(g).connect(filter);
                osc.start(now);
                osc.stop(now + 4);
            });
            [1, 2.2, 3].forEach((t, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = chord[(i + 1) % chord.length] * 2;
                g.gain.setValueAtTime(0, now + t);
                g.gain.linearRampToValueAtTime(0.1, now + t + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.9);
                osc.connect(g).connect(filter);
                osc.start(now + t);
                osc.stop(now + t + 1);
            });
            step += 1;
        };
        playChord();
        timerRef.current = setInterval(playChord, 3800);
    }, []);

    useEffect(() => {
        const wantSynth = enabled && !useClip;
        if (wantSynth && !ctxRef.current) startSynth();
        if (!wantSynth && ctxRef.current) stopSynth();
    }, [enabled, useClip, startSynth, stopSynth]);

    /* ---------------- chapter clip: play only [start, start+length], loop, cross-fade ---------------- */
    useEffect(() => {
        // fade the previous chapter's clip out
        const prev = clipRef.current;
        if (prev) {
            clipRef.current = null;
            fade(prev, 0, FADE_MS, () => {
                prev.pause();
                prev.removeAttribute("src");
                prev.load();
            });
        }
        if (!enabled || !useClip) return;

        const el = new Audio(src);
        el.preload = "auto";
        el.volume = 0;
        clipRef.current = el;

        const seekToStart = () => {
            try {
                el.currentTime = start;
            } catch {
                /* not seekable yet */
            }
        };
        el.addEventListener("loadedmetadata", seekToStart);
        el.addEventListener("error", () => setClipFailed(true));

        // loop just the chosen part
        const loop = window.setInterval(() => {
            if (el.paused && !el.ended) return;
            if (el.ended || el.currentTime >= start + length) {
                seekToStart();
                if (el.paused) el.play().catch(() => undefined);
            }
        }, 80);

        el.play()
            .then(() => {
                setBlocked(false);
                fade(el, CLIP_VOLUME, FADE_MS);
            })
            .catch(() => setBlocked(true)); // autoplay refused: retried on first gesture

        return () => window.clearInterval(loop);
    }, [src, start, length, enabled, useClip]);

    /* cleanup on unmount */
    useEffect(
        () => () => {
            clipRef.current?.pause();
            stopSynth();
        },
        [stopSynth]
    );

    const waiting = enabled && blocked; // sound is "on" but the browser is holding it back
    const status = !enabled ? "muted" : waiting ? "tap to play sound" : useClip ? "chapter clip" : "ambient lofi";

    return (
        <div
            ref={rootRef}
            data-keep-autoplay
            className="flex items-center gap-3 rounded-full border border-white/15 bg-black/40 py-2 pl-2 pr-4 backdrop-blur-md"
        >
            <button
                // while the browser is holding the sound back, the first press STARTS it (it never mutes)
                onClick={() => (waiting ? retry() : setEnabled((v) => !v))}
                aria-pressed={enabled && !blocked}
                aria-label={waiting ? "Start soundtrack" : enabled ? "Mute soundtrack" : "Turn soundtrack on"}
                className={`grid h-9 w-9 place-items-center rounded-full text-stone-900 transition hover:scale-105 ${waiting ? "animate-pulse" : ""}`}
                style={{background: accent}}
            >
                {waiting ? <Play size={16} fill="currentColor" className="ml-0.5"/> : enabled ? <Volume2 size={16}/> :
                    <VolumeX size={16}/>}
            </button>
            <div className={`${waiting ? "flex" : "hidden sm:flex"} flex-col`}>
                <span className="text-[11px] tracking-widest text-stone-100">Soundtrack</span>
                <span className="text-[10px] tracking-widest text-stone-400">{status}</span>
            </div>
            <Equalizer active={enabled && !blocked} color={accent}/>
        </div>
    );
}