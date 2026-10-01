import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getDb, hasDb } from "./mongo";

export const COOKIE_NAME = "ghibli_session";
export const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

interface UserDoc {
  _id: string; // username
  hash: string; // salt:hash (scrypt)
  createdAt: Date;
}

const isProd = () => process.env.NODE_ENV === "production";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (isProd()) throw new Error("SESSION_SECRET is not set");
  return "dev-only-secret";
}

const sha = (v: string) => createHash("sha256").update(v).digest();
export const safeEqual = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

/* ---------- password hashing (scrypt, built into Node) ---------- */

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pw, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

/* ---------- session token (signed cookie) ---------- */

export function createToken(username: string): string {
  const payload = `${username}|${Date.now() + SESSION_MS}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}|${sig}`;
}

export function verifyToken(token?: string | null): boolean {
  if (!token) return false;
  try {
    const i = token.lastIndexOf("|");
    if (i < 0) return false;
    const payload = token.slice(0, i);
    const expected = createHmac("sha256", secret()).update(payload).digest("hex");
    if (!safeEqual(token.slice(i + 1), expected)) return false;
    const exp = Number(payload.slice(payload.lastIndexOf("|") + 1));
    return Number.isFinite(exp) && exp > Date.now();
  } catch {
    return false;
  }
}

export function isAuthed(): boolean {
  return verifyToken(cookies().get(COOKIE_NAME)?.value);
}

/* ---------- credentials ---------- */

function envCreds(): { u: string; p: string } | null {
  const u = process.env.ADMIN_USERNAME || (isProd() ? "" : "admin");
  const p = process.env.ADMIN_PASSWORD || (isProd() ? "" : "ghibli2026");
  return u && p ? { u, p } : null;
}

/**
 * Users live in MongoDB with scrypt-hashed passwords.
 * The very first login is bootstrapped from ADMIN_USERNAME / ADMIN_PASSWORD;
 * after that the database is the source of truth (change it in the editor).
 */
export async function authenticate(username: string, password: string): Promise<boolean> {
  const env = envCreds();

  if (!hasDb()) {
    // No database: dev convenience only, env credentials.
    return Boolean(env) && safeEqual(username, env!.u) && safeEqual(password, env!.p);
  }

  const users = (await getDb()).collection<UserDoc>("users");
  if ((await users.estimatedDocumentCount()) === 0) {
    if (!env) return false;
    const ok = safeEqual(username, env.u) && safeEqual(password, env.p);
    if (ok) await users.insertOne({ _id: env.u, hash: hashPassword(env.p), createdAt: new Date() });
    return ok;
  }

  const user = await users.findOne({ _id: username });
  if (!user) {
    verifyPassword(password, hashPassword("dummy")); // keep timing similar
    return false;
  }
  return verifyPassword(password, user.hash);
}

export async function changePassword(current: string, next: string): Promise<"ok" | "wrong" | "nodb"> {
  if (!hasDb()) return "nodb";
  const users = (await getDb()).collection<UserDoc>("users");
  const user = await users.findOne({});
  if (!user || !verifyPassword(current, user.hash)) return "wrong";
  await users.updateOne({ _id: user._id }, { $set: { hash: hashPassword(next) } });
  return "ok";
}
