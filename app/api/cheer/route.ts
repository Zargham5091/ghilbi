import { NextResponse } from "next/server";
import { getDb, hasDb } from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!hasDb()) return NextResponse.json({ error: "No database" }, { status: 503 });
  try {
    const db = await getDb();
    const doc = await db
      .collection<{ _id: string; count: number }>("stats")
      .findOneAndUpdate({ _id: "cheers" }, { $inc: { count: 1 } }, { upsert: true, returnDocument: "after" });
    return NextResponse.json({ cheers: doc?.count ?? 1 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
