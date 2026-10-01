"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Field } from "./ui";

export default function LoginDialog({
  accent,
  onClose,
  onSuccess,
}: {
  accent: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) onSuccess();
      else {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || "Login failed. Try again.");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.form
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#1b1530] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-2 text-sm tracking-widest text-stone-100">
          <Lock size={16} style={{ color: accent }} /> Admin login
        </div>
        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="Password" value={password} onChange={setPassword} type="password" />
        {error && <p className="text-xs tracking-wide text-rose-300">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy || !username || !password}
            className="flex-1 rounded-lg py-2 text-sm font-medium tracking-widest text-stone-900 transition disabled:opacity-50"
            style={{ background: accent }}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm tracking-widest text-stone-200 transition hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
