import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { isAuthed } from "@/lib/auth";
import { DEFAULT_CONTENT, sanitizeContent } from "@/lib/content";
import { getDb, hasDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

interface SiteDoc {
  _id: string;
  content: unknown;
  updatedAt: Date;
}

export async function GET() {
  if (!hasDb()) {
    return NextResponse.json({ content: DEFAULT_CONTENT, dbConnected: false, cheers: 0 });
  }
  try {
    const db = await getDb();
    const doc = await db.collection<SiteDoc>("site").findOne({ _id: "main" });
    const stat = await db.collection<{ _id: string; count: number }>("stats").findOne({ _id: "cheers" });
    return NextResponse.json(
      { content: sanitizeContent(doc?.content), dbConnected: true, cheers: stat?.count ?? 0 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ content: DEFAULT_CONTENT, dbConnected: false, cheers: 0 });
  }
}

export async function PUT(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!hasDb()) return NextResponse.json({ error: "MongoDB isn't connected (MONGODB_URI is missing)." }, { status: 503 });

  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { chapters?: unknown }).chapters)) {
    return NextResponse.json({ error: "Invalid content." }, { status: 400 });
  }
  const content = sanitizeContent(raw);

  try {
    const db = await getDb();
    await db
      .collection<SiteDoc>("site")
      .replaceOne({ _id: "main" }, { content, updatedAt: new Date() }, { upsert: true });

    // remove uploaded images that no chapter uses any more
    const used = content.chapters.filter((c) => c.imageId).map((c) => new ObjectId(c.imageId));
    await db.collection<{ _id: ObjectId }>("images").deleteMany({ _id: { $nin: used } });

    return NextResponse.json({ ok: true, content });
  } catch {
    return NextResponse.json({ error: "Couldn't save to MongoDB." }, { status: 500 });
  }
}
