"use client";

import {useState} from "react";
import type {ChangeEvent} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowDown, ArrowUp, Check, Plus, Save, Trash2, Upload, X} from "lucide-react";
import {
    MAX_CHAPTERS,
    SCENE_KINDS,
    THEMES,
    THEME_KEYS,
    blankChapter,
    sanitizeContent,
    type Chapter,
    type SiteContent,
} from "@/lib/content";
import {compressImage} from "@/lib/image";
import {Field, TextArea} from "./ui";

type Tab = "profile" | "chapter" | "extras" | "account";
const TABS: { key: Tab; label: string }[] = [
    {key: "chapter", label: "Chapter"},
    {key: "profile", label: "Profile"},
    {key: "extras", label: "Extras"},
    {key: "account", label: "Account"},
];

interface Props {
    open: boolean;
    onClose: () => void;
    content: SiteContent;
    idx: number;
    dirty: boolean;
    dbOk: boolean;
    accent: string;
    onChange: (c: SiteContent) => void;
    onSelect: (i: number) => void;
    onSaved: (c: SiteContent) => void;
}

export default function EditorPanel({
                                        open,
                                        onClose,
                                        content,
                                        idx,
                                        dirty,
                                        dbOk,
                                        accent,
                                        onChange,
                                        onSelect,
                                        onSaved
                                    }: Props) {
    const [tab, setTab] = useState<Tab>("chapter");
    const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [saveMsg, setSaveMsg] = useState("");
    const [uploading, setUploading] = useState(false);
    const [upErr, setUpErr] = useState("");
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [audioErr, setAudioErr] = useState("");
    const [pw, setPw] = useState({current: "", next: ""});
    const [pwMsg, setPwMsg] = useState("");

    const chapter = content.chapters[idx];
    const patch = (p: Partial<Chapter>) =>
        onChange({...content, chapters: content.chapters.map((c, i) => (i === idx ? {...c, ...p} : c))});

    const addChapter = () => {
        if (content.chapters.length >= MAX_CHAPTERS) return;
        const chapters = [...content.chapters];
        chapters.splice(idx + 1, 0, blankChapter(idx + 2));
        onChange({...content, chapters});
        onSelect(idx + 1);
    };
    const removeChapter = () => {
        if (content.chapters.length <= 1) return;
        if (!window.confirm(`Delete "${chapter.title}"?`)) return;
        onChange({...content, chapters: content.chapters.filter((_, i) => i !== idx)});
        onSelect(Math.max(0, idx - 1));
    };
    const move = (d: -1 | 1) => {
        const j = idx + d;
        if (j < 0 || j >= content.chapters.length) return;
        const chapters = [...content.chapters];
        [chapters[idx], chapters[j]] = [chapters[j], chapters[idx]];
        onChange({...content, chapters});
        onSelect(j);
    };

    const upload = async (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            setUpErr("Please choose an image file.");
            return;
        }
        setUploading(true);
        setUpErr("");
        try {
            const blob = await compressImage(f);
            const fd = new FormData();
            fd.append("file", blob, "chapter.jpg");
            const r = await fetch("/api/images", {method: "POST", body: fd});
            const d = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
            if (!r.ok || !d.id) throw new Error(d.error || "Upload failed.");
            patch({imageId: d.id, imageUrl: ""});
        } catch (err) {
            setUpErr(err instanceof Error ? err.message : "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const uploadAudio = async (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        if (f.size > 4 * 1024 * 1024) {
            setAudioErr("That file is over 4 MB. Use a shorter or lower-bitrate mp3.");
            return;
        }
        setUploadingAudio(true);
        setAudioErr("");
        try {
            const fd = new FormData();
            fd.append("file", f, f.name);
            const r = await fetch("/api/audio", {method: "POST", body: fd});
            const d = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
            if (!r.ok || !d.id) throw new Error(d.error || "Upload failed.");
            patch({audioId: d.id, audioUrl: ""});
        } catch (err) {
            setAudioErr(err instanceof Error ? err.message : "Upload failed.");
        } finally {
            setUploadingAudio(false);
        }
    };

    const save = async () => {
        setSaveState("saving");
        setSaveMsg("");
        try {
            const r = await fetch("/api/content", {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(content),
            });
            const d = (await r.json().catch(() => ({}))) as { error?: string; content?: unknown };
            if (!r.ok) throw new Error(d.error || "Save failed.");
            onSaved(sanitizeContent(d.content));
            setSaveState("saved");
        } catch (err) {
            setSaveState("error");
            setSaveMsg(err instanceof Error ? err.message : "Save failed.");
        }
    };

    const changePw = async () => {
        setPwMsg("");
        const r = await fetch("/api/password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(pw),
        }).catch(() => null);
        if (!r) return setPwMsg("Couldn't reach the server.");
        const d = (await r.json().catch(() => ({}))) as { error?: string };
        if (r.ok) {
            setPw({current: "", next: ""});
            setPwMsg("Password updated ✓");
        } else setPwMsg(d.error || "Couldn't update the password.");
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.aside
                    initial={{x: "100%"}}
                    animate={{x: 0}}
                    exit={{x: "100%"}}
                    transition={{duration: 0.35, ease: "easeInOut"}}
                    className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-white/10 bg-[#1b1530]/95 shadow-2xl backdrop-blur-xl sm:w-[26rem]"
                >
                    <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                        <div>
                            <h2 className="text-sm tracking-widest text-stone-100">Live editor</h2>
                            <p className={`text-[11px] tracking-wide ${dbOk ? "text-emerald-300" : "text-amber-300"}`}>
                                {dbOk ? "MongoDB connected" : "MongoDB not connected: edits can't be saved"}
                            </p>
                        </div>
                        <button onClick={onClose} aria-label="Close editor"
                                className="rounded-full p-2 text-stone-300 hover:bg-white/10">
                            <X size={18}/>
                        </button>
                    </header>

                    <nav className="flex gap-1 border-b border-white/10 px-3 py-2">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className="rounded-full px-3 py-1.5 text-xs tracking-widest transition"
                                style={tab === t.key ? {background: accent, color: "#1c1326"} : {color: "#d6d3d1"}}
                            >
                                {t.label}
                            </button>
                        ))}
                    </nav>

                    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                        {tab === "profile" && (
                            <>
                                <Field label="Name" value={content.profile.name} onChange={(v) => onChange({
                                    ...content,
                                    profile: {...content.profile, name: v}
                                })}/>
                                <Field label="Role / title" value={content.profile.role} onChange={(v) => onChange({
                                    ...content,
                                    profile: {...content.profile, role: v}
                                })}/>
                                <Field label="Company" value={content.profile.company} onChange={(v) => onChange({
                                    ...content,
                                    profile: {...content.profile, company: v}
                                })}/>
                                <Field label="Japanese badge text" value={content.profile.jpBadge}
                                       onChange={(v) => onChange({
                                           ...content,
                                           profile: {...content.profile, jpBadge: v}
                                       })}/>
                            </>
                        )}

                        {tab === "chapter" && chapter && (
                            <>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={idx}
                                        onChange={(e) => onSelect(Number(e.target.value))}
                                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#241a3a] px-3 py-2 text-sm text-stone-100"
                                    >
                                        {content.chapters.map((c, i) => (
                                            <option key={c.id} value={i}>
                                                {i + 1}. {c.title}
                                            </option>
                                        ))}
                                    </select>
                                    <button onClick={() => move(-1)} aria-label="Move earlier"
                                            className="rounded-lg border border-white/10 p-2 text-stone-200 hover:bg-white/10">
                                        <ArrowUp size={14}/></button>
                                    <button onClick={() => move(1)} aria-label="Move later"
                                            className="rounded-lg border border-white/10 p-2 text-stone-200 hover:bg-white/10">
                                        <ArrowDown size={14}/></button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={addChapter} disabled={content.chapters.length >= MAX_CHAPTERS}
                                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs tracking-widest text-stone-100 hover:bg-white/10 disabled:opacity-40">
                                        <Plus size={14}/> Add chapter after this
                                    </button>
                                    <button onClick={removeChapter} disabled={content.chapters.length <= 1}
                                            className="flex items-center gap-1.5 rounded-lg border border-rose-400/30 px-3 py-2 text-xs tracking-widest text-rose-200 hover:bg-rose-500/10 disabled:opacity-40">
                                        <Trash2 size={14}/> Delete
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Label" value={chapter.kicker} onChange={(v) => patch({kicker: v})}/>
                                    <Field label="Period" value={chapter.period} onChange={(v) => patch({period: v})}/>
                                </div>
                                <Field label="Title" value={chapter.title} onChange={(v) => patch({title: v})}/>
                                <Field label="Japanese title" value={chapter.jp} onChange={(v) => patch({jp: v})}/>
                                <TextArea label="Story" rows={4} value={chapter.story}
                                          onChange={(v) => patch({story: v})}/>
                                <TextArea label="🌧️ Struggle" value={chapter.struggle}
                                          onChange={(v) => patch({struggle: v})}/>
                                <TextArea label="🎯 Goal" value={chapter.goal} onChange={(v) => patch({goal: v})}/>
                                <TextArea label="🌱 Lesson" value={chapter.lesson} onChange={(v) => patch({lesson: v})}/>
                                <TextArea label="Code snippet" rows={4} value={chapter.code}
                                          onChange={(v) => patch({code: v})}/>
                                <Field label="Output when visitors press Run" value={chapter.output}
                                       onChange={(v) => patch({output: v})}/>

                                <div className="space-y-2">
                                    <span className="text-[11px] tracking-widest text-stone-300/80">Theme</span>
                                    <div className="flex flex-wrap gap-2">
                                        {THEME_KEYS.map((k) => (
                                            <button
                                                key={k}
                                                onClick={() => patch({theme: k})}
                                                aria-pressed={chapter.theme === k}
                                                className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] tracking-widest"
                                                style={{
                                                    borderColor: chapter.theme === k ? THEMES[k].accent : "rgba(255,255,255,0.15)",
                                                    color: chapter.theme === k ? THEMES[k].accent : "#e7e5e4",
                                                }}
                                            >
                                                <span className="h-3 w-3 rounded-full"
                                                      style={{background: THEMES[k].accent}}/>
                                                {THEMES[k].label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                    <span
                                        className="text-[11px] tracking-widest text-stone-300/80">Background image</span>
                                    <label
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/25 px-3 py-2 text-sm text-stone-200 hover:bg-white/10">
                                        <Upload size={14}/>
                                        {uploading ? "Uploading…" : chapter.imageId ? "Replace uploaded image" : "Upload an image"}
                                        <input type="file" accept="image/*" onChange={upload} disabled={uploading}
                                               className="sr-only"/>
                                    </label>
                                    <p className="text-[11px] text-stone-500">Photos are shrunk in your browser, then
                                        saved inside MongoDB.</p>
                                    {upErr && <p className="text-xs text-rose-300">{upErr}</p>}
                                    <Field label="…or an image URL" value={chapter.imageUrl} placeholder="https://"
                                           onChange={(v) => patch({imageUrl: v, imageId: v ? "" : chapter.imageId})}/>
                                    <label className="flex flex-col gap-1.5">
                                        <span className="text-[11px] tracking-widest text-stone-300/80">Illustrated scene (used when there is no image)</span>
                                        <select value={chapter.scene}
                                                onChange={(e) => patch({scene: e.target.value as Chapter["scene"]})}
                                                className="rounded-lg border border-white/10 bg-[#241a3a] px-3 py-2 text-sm text-stone-100">
                                            {SCENE_KINDS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </label>
                                    {(chapter.imageId || chapter.imageUrl) && (
                                        <button onClick={() => patch({imageId: "", imageUrl: ""})}
                                                className="text-[11px] tracking-widest text-stone-400 underline-offset-4 hover:underline">
                                            Remove image, use scene
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                    <span
                                        className="text-[11px] tracking-widest text-stone-300/80">🎵 Soundtrack clip</span>
                                    <label
                                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/25 px-3 py-2 text-sm text-stone-200 hover:bg-white/10">
                                        <Upload size={14}/>
                                        {uploadingAudio ? "Uploading…" : chapter.audioId ? "Replace uploaded song" : "Upload a song (mp3, max 4 MB)"}
                                        <input type="file" accept="audio/*" onChange={uploadAudio}
                                               disabled={uploadingAudio} className="sr-only"/>
                                    </label>
                                    <p className="text-[11px] text-stone-500">
                                        Only the part you pick plays: it starts at “Start” and loops for “Length”
                                        seconds. It plays as soon as this chapter is on screen, so you can hear your
                                        choice live.
                                    </p>
                                    {audioErr && <p className="text-xs text-rose-300">{audioErr}</p>}
                                    <Field label="…or an audio URL" value={chapter.audioUrl}
                                           placeholder="https://…/clip.mp3"
                                           onChange={(v) => patch({audioUrl: v, audioId: v ? "" : chapter.audioId})}/>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Start (seconds)" type="number" value={String(chapter.audioStart)}
                                               onChange={(v) => patch({audioStart: Math.max(0, Number(v) || 0)})}/>
                                        <Field label="Length (seconds)" type="number" value={String(chapter.audioLen)}
                                               onChange={(v) => patch({audioLen: Math.min(30, Math.max(1, Number(v) || 5))})}/>
                                    </div>
                                    {(chapter.audioId || chapter.audioUrl) && (
                                        <button onClick={() => patch({audioId: "", audioUrl: ""})}
                                                className="text-[11px] tracking-widest text-stone-400 underline-offset-4 hover:underline">
                                            Remove song, use ambient lofi
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {tab === "extras" && (
                            <>
                                <Field label="“Then” label" value={content.thenNow.oldLabel} onChange={(v) => onChange({
                                    ...content,
                                    thenNow: {...content.thenNow, oldLabel: v}
                                })}/>
                                <TextArea label="“Then” code" rows={3} value={content.thenNow.oldCode}
                                          onChange={(v) => onChange({
                                              ...content,
                                              thenNow: {...content.thenNow, oldCode: v}
                                          })}/>
                                <Field label="“Now” label" value={content.thenNow.newLabel} onChange={(v) => onChange({
                                    ...content,
                                    thenNow: {...content.thenNow, newLabel: v}
                                })}/>
                                <TextArea
                                    label="“Now” services / skills"
                                    rows={6}
                                    hint="One per line, up to 12."
                                    value={content.thenNow.services.join("\n")}
                                    onChange={(v) => onChange({
                                        ...content,
                                        thenNow: {...content.thenNow, services: v.split("\n").slice(0, 12)}
                                    })}
                                />
                                <TextArea
                                    label="Goals ahead"
                                    rows={5}
                                    hint="One per line, up to 8."
                                    value={content.goalsAhead.join("\n")}
                                    onChange={(v) => onChange({...content, goalsAhead: v.split("\n").slice(0, 8)})}
                                />
                            </>
                        )}

                        {tab === "account" && (
                            <>
                                <p className="text-xs leading-relaxed text-stone-400">
                                    Your password is stored hashed in MongoDB. Pick a new one (8+ characters).
                                </p>
                                <Field label="Current password" type="password" value={pw.current}
                                       onChange={(v) => setPw({...pw, current: v})}/>
                                <Field label="New password" type="password" value={pw.next}
                                       onChange={(v) => setPw({...pw, next: v})}/>
                                <button onClick={changePw} disabled={!pw.current || pw.next.length < 8}
                                        className="rounded-lg px-4 py-2 text-sm font-medium tracking-widest text-stone-900 disabled:opacity-40"
                                        style={{background: accent}}>
                                    Update password
                                </button>
                                {pwMsg && <p className="text-xs text-stone-300">{pwMsg}</p>}
                            </>
                        )}
                    </div>

                    <footer className="space-y-2 border-t border-white/10 px-5 py-4">
                        {saveMsg && <p className="text-xs text-rose-300">{saveMsg}</p>}
                        <button
                            onClick={save}
                            disabled={saveState === "saving" || !dirty}
                            className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium tracking-widest text-stone-900 transition disabled:opacity-50"
                            style={{background: accent}}
                        >
                            {saveState === "saving" ? "Saving…" : dirty ? (<><Save size={15}/> Save to
                                database</>) : (<><Check size={15}/> All changes saved</>)}
                        </button>
                    </footer>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}


// "use client";
//
// import { useState } from "react";
// import type { ChangeEvent } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import { ArrowDown, ArrowUp, Check, Plus, Save, Trash2, Upload, X } from "lucide-react";
// import {
//   MAX_CHAPTERS,
//   SCENE_KINDS,
//   THEMES,
//   THEME_KEYS,
//   blankChapter,
//   sanitizeContent,
//   type Chapter,
//   type SiteContent,
// } from "@/lib/content";
// import { compressImage } from "@/lib/image";
// import { Field, TextArea } from "./ui";
//
// type Tab = "profile" | "chapter" | "extras" | "account";
// const TABS: { key: Tab; label: string }[] = [
//   { key: "chapter", label: "Chapter" },
//   { key: "profile", label: "Profile" },
//   { key: "extras", label: "Extras" },
//   { key: "account", label: "Account" },
// ];
//
// interface Props {
//   open: boolean;
//   onClose: () => void;
//   content: SiteContent;
//   idx: number;
//   dirty: boolean;
//   dbOk: boolean;
//   accent: string;
//   onChange: (c: SiteContent) => void;
//   onSelect: (i: number) => void;
//   onSaved: (c: SiteContent) => void;
// }
//
// export default function EditorPanel({ open, onClose, content, idx, dirty, dbOk, accent, onChange, onSelect, onSaved }: Props) {
//   const [tab, setTab] = useState<Tab>("chapter");
//   const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
//   const [saveMsg, setSaveMsg] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const [upErr, setUpErr] = useState("");
//   const [pw, setPw] = useState({ current: "", next: "" });
//   const [pwMsg, setPwMsg] = useState("");
//
//   const chapter = content.chapters[idx];
//   const patch = (p: Partial<Chapter>) =>
//     onChange({ ...content, chapters: content.chapters.map((c, i) => (i === idx ? { ...c, ...p } : c)) });
//
//   const addChapter = () => {
//     if (content.chapters.length >= MAX_CHAPTERS) return;
//     const chapters = [...content.chapters];
//     chapters.splice(idx + 1, 0, blankChapter(idx + 2));
//     onChange({ ...content, chapters });
//     onSelect(idx + 1);
//   };
//   const removeChapter = () => {
//     if (content.chapters.length <= 1) return;
//     if (!window.confirm(`Delete "${chapter.title}"?`)) return;
//     onChange({ ...content, chapters: content.chapters.filter((_, i) => i !== idx) });
//     onSelect(Math.max(0, idx - 1));
//   };
//   const move = (d: -1 | 1) => {
//     const j = idx + d;
//     if (j < 0 || j >= content.chapters.length) return;
//     const chapters = [...content.chapters];
//     [chapters[idx], chapters[j]] = [chapters[j], chapters[idx]];
//     onChange({ ...content, chapters });
//     onSelect(j);
//   };
//
//   const upload = async (e: ChangeEvent<HTMLInputElement>) => {
//     const f = e.target.files?.[0];
//     e.target.value = "";
//     if (!f) return;
//     if (!f.type.startsWith("image/")) {
//       setUpErr("Please choose an image file.");
//       return;
//     }
//     setUploading(true);
//     setUpErr("");
//     try {
//       const blob = await compressImage(f);
//       const fd = new FormData();
//       fd.append("file", blob, "chapter.jpg");
//       const r = await fetch("/api/images", { method: "POST", body: fd });
//       const d = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
//       if (!r.ok || !d.id) throw new Error(d.error || "Upload failed.");
//       patch({ imageId: d.id, imageUrl: "" });
//     } catch (err) {
//       setUpErr(err instanceof Error ? err.message : "Upload failed.");
//     } finally {
//       setUploading(false);
//     }
//   };
//
//   const save = async () => {
//     setSaveState("saving");
//     setSaveMsg("");
//     try {
//       const r = await fetch("/api/content", {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(content),
//       });
//       const d = (await r.json().catch(() => ({}))) as { error?: string; content?: unknown };
//       if (!r.ok) throw new Error(d.error || "Save failed.");
//       onSaved(sanitizeContent(d.content));
//       setSaveState("saved");
//     } catch (err) {
//       setSaveState("error");
//       setSaveMsg(err instanceof Error ? err.message : "Save failed.");
//     }
//   };
//
//   const changePw = async () => {
//     setPwMsg("");
//     const r = await fetch("/api/password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(pw),
//     }).catch(() => null);
//     if (!r) return setPwMsg("Couldn't reach the server.");
//     const d = (await r.json().catch(() => ({}))) as { error?: string };
//     if (r.ok) {
//       setPw({ current: "", next: "" });
//       setPwMsg("Password updated ✓");
//     } else setPwMsg(d.error || "Couldn't update the password.");
//   };
//
//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.aside
//           initial={{ x: "100%" }}
//           animate={{ x: 0 }}
//           exit={{ x: "100%" }}
//           transition={{ duration: 0.35, ease: "easeInOut" }}
//           className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-white/10 bg-[#1b1530]/95 shadow-2xl backdrop-blur-xl sm:w-[26rem]"
//         >
//           <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
//             <div>
//               <h2 className="text-sm tracking-widest text-stone-100">Live editor</h2>
//               <p className={`text-[11px] tracking-wide ${dbOk ? "text-emerald-300" : "text-amber-300"}`}>
//                 {dbOk ? "MongoDB connected" : "MongoDB not connected: edits can't be saved"}
//               </p>
//             </div>
//             <button onClick={onClose} aria-label="Close editor" className="rounded-full p-2 text-stone-300 hover:bg-white/10">
//               <X size={18} />
//             </button>
//           </header>
//
//           <nav className="flex gap-1 border-b border-white/10 px-3 py-2">
//             {TABS.map((t) => (
//               <button
//                 key={t.key}
//                 onClick={() => setTab(t.key)}
//                 className="rounded-full px-3 py-1.5 text-xs tracking-widest transition"
//                 style={tab === t.key ? { background: accent, color: "#1c1326" } : { color: "#d6d3d1" }}
//               >
//                 {t.label}
//               </button>
//             ))}
//           </nav>
//
//           <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
//             {tab === "profile" && (
//               <>
//                 <Field label="Name" value={content.profile.name} onChange={(v) => onChange({ ...content, profile: { ...content.profile, name: v } })} />
//                 <Field label="Role / title" value={content.profile.role} onChange={(v) => onChange({ ...content, profile: { ...content.profile, role: v } })} />
//                 <Field label="Company" value={content.profile.company} onChange={(v) => onChange({ ...content, profile: { ...content.profile, company: v } })} />
//                 <Field label="Japanese badge text" value={content.profile.jpBadge} onChange={(v) => onChange({ ...content, profile: { ...content.profile, jpBadge: v } })} />
//               </>
//             )}
//
//             {tab === "chapter" && chapter && (
//               <>
//                 <div className="flex items-center gap-2">
//                   <select
//                     value={idx}
//                     onChange={(e) => onSelect(Number(e.target.value))}
//                     className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#241a3a] px-3 py-2 text-sm text-stone-100"
//                   >
//                     {content.chapters.map((c, i) => (
//                       <option key={c.id} value={i}>
//                         {i + 1}. {c.title}
//                       </option>
//                     ))}
//                   </select>
//                   <button onClick={() => move(-1)} aria-label="Move earlier" className="rounded-lg border border-white/10 p-2 text-stone-200 hover:bg-white/10"><ArrowUp size={14} /></button>
//                   <button onClick={() => move(1)} aria-label="Move later" className="rounded-lg border border-white/10 p-2 text-stone-200 hover:bg-white/10"><ArrowDown size={14} /></button>
//                 </div>
//                 <div className="flex gap-2">
//                   <button onClick={addChapter} disabled={content.chapters.length >= MAX_CHAPTERS} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs tracking-widest text-stone-100 hover:bg-white/10 disabled:opacity-40">
//                     <Plus size={14} /> Add chapter after this
//                   </button>
//                   <button onClick={removeChapter} disabled={content.chapters.length <= 1} className="flex items-center gap-1.5 rounded-lg border border-rose-400/30 px-3 py-2 text-xs tracking-widest text-rose-200 hover:bg-rose-500/10 disabled:opacity-40">
//                     <Trash2 size={14} /> Delete
//                   </button>
//                 </div>
//
//                 <div className="grid grid-cols-2 gap-3">
//                   <Field label="Label" value={chapter.kicker} onChange={(v) => patch({ kicker: v })} />
//                   <Field label="Period" value={chapter.period} onChange={(v) => patch({ period: v })} />
//                 </div>
//                 <Field label="Title" value={chapter.title} onChange={(v) => patch({ title: v })} />
//                 <Field label="Japanese title" value={chapter.jp} onChange={(v) => patch({ jp: v })} />
//                 <TextArea label="Story" rows={4} value={chapter.story} onChange={(v) => patch({ story: v })} />
//                 <TextArea label="🌧️ Struggle" value={chapter.struggle} onChange={(v) => patch({ struggle: v })} />
//                 <TextArea label="🎯 Goal" value={chapter.goal} onChange={(v) => patch({ goal: v })} />
//                 <TextArea label="🌱 Lesson" value={chapter.lesson} onChange={(v) => patch({ lesson: v })} />
//                 <TextArea label="Code snippet" rows={4} value={chapter.code} onChange={(v) => patch({ code: v })} />
//                 <Field label="Output when visitors press Run" value={chapter.output} onChange={(v) => patch({ output: v })} />
//
//                 <div className="space-y-2">
//                   <span className="text-[11px] tracking-widest text-stone-300/80">Theme</span>
//                   <div className="flex flex-wrap gap-2">
//                     {THEME_KEYS.map((k) => (
//                       <button
//                         key={k}
//                         onClick={() => patch({ theme: k })}
//                         aria-pressed={chapter.theme === k}
//                         className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] tracking-widest"
//                         style={{
//                           borderColor: chapter.theme === k ? THEMES[k].accent : "rgba(255,255,255,0.15)",
//                           color: chapter.theme === k ? THEMES[k].accent : "#e7e5e4",
//                         }}
//                       >
//                         <span className="h-3 w-3 rounded-full" style={{ background: THEMES[k].accent }} />
//                         {THEMES[k].label}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//
//                 <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
//                   <span className="text-[11px] tracking-widest text-stone-300/80">Background image</span>
//                   <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/25 px-3 py-2 text-sm text-stone-200 hover:bg-white/10">
//                     <Upload size={14} />
//                     {uploading ? "Uploading…" : chapter.imageId ? "Replace uploaded image" : "Upload an image"}
//                     <input type="file" accept="image/*" onChange={upload} disabled={uploading} className="sr-only" />
//                   </label>
//                   <p className="text-[11px] text-stone-500">Photos are shrunk in your browser, then saved inside MongoDB.</p>
//                   {upErr && <p className="text-xs text-rose-300">{upErr}</p>}
//                   <Field label="…or an image URL" value={chapter.imageUrl} placeholder="https://" onChange={(v) => patch({ imageUrl: v, imageId: v ? "" : chapter.imageId })} />
//                   <label className="flex flex-col gap-1.5">
//                     <span className="text-[11px] tracking-widest text-stone-300/80">Illustrated scene (used when there is no image)</span>
//                     <select value={chapter.scene} onChange={(e) => patch({ scene: e.target.value as Chapter["scene"] })} className="rounded-lg border border-white/10 bg-[#241a3a] px-3 py-2 text-sm text-stone-100">
//                       {SCENE_KINDS.map((s) => (
//                         <option key={s} value={s}>{s}</option>
//                       ))}
//                     </select>
//                   </label>
//                   {(chapter.imageId || chapter.imageUrl) && (
//                     <button onClick={() => patch({ imageId: "", imageUrl: "" })} className="text-[11px] tracking-widest text-stone-400 underline-offset-4 hover:underline">
//                       Remove image, use scene
//                     </button>
//                   )}
//                 </div>
//               </>
//             )}
//
//             {tab === "extras" && (
//               <>
//                 <Field label="“Then” label" value={content.thenNow.oldLabel} onChange={(v) => onChange({ ...content, thenNow: { ...content.thenNow, oldLabel: v } })} />
//                 <TextArea label="“Then” code" rows={3} value={content.thenNow.oldCode} onChange={(v) => onChange({ ...content, thenNow: { ...content.thenNow, oldCode: v } })} />
//                 <Field label="“Now” label" value={content.thenNow.newLabel} onChange={(v) => onChange({ ...content, thenNow: { ...content.thenNow, newLabel: v } })} />
//                 <TextArea
//                   label="“Now” services / skills"
//                   rows={6}
//                   hint="One per line, up to 12."
//                   value={content.thenNow.services.join("\n")}
//                   onChange={(v) => onChange({ ...content, thenNow: { ...content.thenNow, services: v.split("\n").slice(0, 12) } })}
//                 />
//                 <TextArea
//                   label="Goals ahead"
//                   rows={5}
//                   hint="One per line, up to 8."
//                   value={content.goalsAhead.join("\n")}
//                   onChange={(v) => onChange({ ...content, goalsAhead: v.split("\n").slice(0, 8) })}
//                 />
//               </>
//             )}
//
//             {tab === "account" && (
//               <>
//                 <p className="text-xs leading-relaxed text-stone-400">
//                   Your password is stored hashed in MongoDB. Pick a new one (8+ characters).
//                 </p>
//                 <Field label="Current password" type="password" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} />
//                 <Field label="New password" type="password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} />
//                 <button onClick={changePw} disabled={!pw.current || pw.next.length < 8} className="rounded-lg px-4 py-2 text-sm font-medium tracking-widest text-stone-900 disabled:opacity-40" style={{ background: accent }}>
//                   Update password
//                 </button>
//                 {pwMsg && <p className="text-xs text-stone-300">{pwMsg}</p>}
//               </>
//             )}
//           </div>
//
//           <footer className="space-y-2 border-t border-white/10 px-5 py-4">
//             {saveMsg && <p className="text-xs text-rose-300">{saveMsg}</p>}
//             <button
//               onClick={save}
//               disabled={saveState === "saving" || !dirty}
//               className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium tracking-widest text-stone-900 transition disabled:opacity-50"
//               style={{ background: accent }}
//             >
//               {saveState === "saving" ? "Saving…" : dirty ? (<><Save size={15} /> Save to database</>) : (<><Check size={15} /> All changes saved</>)}
//             </button>
//           </footer>
//         </motion.aside>
//       )}
//     </AnimatePresence>
//   );
// }
