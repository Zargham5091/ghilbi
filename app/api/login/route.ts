import { NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_MS, authenticate, createToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* invalid */
  }
  const username = typeof body.username === "string" ? body.username.slice(0, 100) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";

  try {
    if (!(await authenticate(username, password))) {
      await new Promise((r) => setTimeout(r, 500)); // slow down guessing
      return NextResponse.json({ ok: false, error: "Wrong username or password." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, createToken(username), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MS / 1000,
    });
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Login isn't configured on the server. Check MONGODB_URI, SESSION_SECRET and ADMIN_* variables." },
      { status: 500 }
    );
  }
}
