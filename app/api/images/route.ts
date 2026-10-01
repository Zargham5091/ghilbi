import { NextResponse } from "next/server";
import { Binary, ObjectId } from "mongodb";
import { isAuthed } from "@/lib/auth";
import { getDb, hasDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024;

function sniff(b: Buffer): string | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Upload one image (multipart field "file"). Stored inside MongoDB. */
export async function POST(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!hasDb()) return NextResponse.json({ error: "MongoDB isn't connected, so images can't be stored." }, { status: 503 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return NextResponse.json({ error: "No file received." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is too large (max 3 MB)." }, { status: 413 });

    const buf = Buffer.from(await file.arrayBuffer());
    const type = sniff(buf);
    if (!type) return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 415 });

    const db = await getDb();
    const r = await db.collection<{ _id: ObjectId; contentType: string; data: Binary; size: number; createdAt: Date }>("images").insertOne({
      _id: new ObjectId(),
      contentType: type,
      data: new Binary(buf),
      size: buf.length,
      createdAt: new Date(),
    });
    return NextResponse.json({ id: r.insertedId.toHexString() });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
