/** Server helpers for the per-chapter music clips stored in MongoDB. */

export function sniffAudio(b: Buffer): string | null {
    if (b.length < 12) return null;
    if (b.toString("ascii", 0, 3) === "ID3") return "audio/mpeg";
    if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return "audio/mpeg";
    if (b.toString("ascii", 4, 8) === "ftyp") return "audio/mp4"; // m4a / aac
    if (b.toString("ascii", 0, 4) === "OggS") return "audio/ogg";
    if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WAVE") return "audio/wav";
    if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "audio/webm";
    return null;
}

/**
 * Parse an HTTP Range header ("bytes=0-1023"). Browsers need range support
 * to seek inside audio (Safari won't play audio without it).
 * Returns null (no/ignored range), "invalid" (416), or the byte span.
 */
export function parseRange(header: string | null, total: number): { start: number; end: number } | "invalid" | null {
    if (!header) return null;
    const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
    if (!m || (m[1] === "" && m[2] === "")) return null;
    let start: number;
    let end: number;
    if (m[1] === "") {
        start = Math.max(0, total - parseInt(m[2], 10));
        end = total - 1;
    } else {
        start = parseInt(m[1], 10);
        end = m[2] === "" ? total - 1 : Math.min(parseInt(m[2], 10), total - 1);
    }
    if (start >= total || start > end) return "invalid";
    return {start, end};
}