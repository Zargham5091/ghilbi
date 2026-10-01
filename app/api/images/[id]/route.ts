import { NextResponse } from "next/server";
import { Binary, ObjectId } from "mongodb";
import { getDb, hasDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!hasDb() || !ObjectId.isValid(params.id)) return new NextResponse("Not found", { status: 404 });
  try {
    const db = await getDb();
    const doc = await db
      .collection<{ _id: ObjectId; contentType: string; data: Binary }>("images")
      .findOne({ _id: new ObjectId(params.id) });
    if (!doc) return new NextResponse("Not found", { status: 404 });
    const bytes = doc.data.buffer.subarray(0, doc.data.length());
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.contentType,
        // ids never change content, so browsers/CDN can cache forever
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
