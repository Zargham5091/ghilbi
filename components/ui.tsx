"use client";

const base =
  "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm tracking-wide text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-white/40 focus:bg-white/10";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] tracking-widest text-stone-300/80">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={base} />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] tracking-widest text-stone-300/80">{label}</span>
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className={`${base} resize-y`} />
      {hint && <span className="text-[11px] text-stone-500">{hint}</span>}
    </label>
  );
}
