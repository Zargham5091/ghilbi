// app/api/audio/[id]/route.ts
import {NextResponse} from "next/server";
import {Binary, ObjectId} from "mongodb";
import {parseRange} from "@/lib/audio";
import {getDb, hasDb} from "@/lib/mongo";

export const dynamic = "force-dynamic";

export async function GET(req: Request, {params}: { params: { id: string } }) {
    if (!hasDb() || !ObjectId.isValid(params.id)) return new NextResponse("Not found", {status: 404});
    try {
        const db = await getDb();
        const doc = await db
            .collection<{ _id: ObjectId; contentType: string; data: Binary }>("audio")
            .findOne({_id: new ObjectId(params.id)});
        if (!doc) return new NextResponse("Not found", {status: 404});

        const bytes = doc.data.buffer.subarray(0, doc.data.length());
        const total = bytes.length;
        const common = {
            "Content-Type": doc.contentType,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        };

        const range = parseRange(req.headers.get("range"), total);
        if (range === "invalid") {
            return new NextResponse(null, {status: 416, headers: {...common, "Content-Range": `bytes */${total}`}});
        }
        if (range) {
            const chunk = bytes.subarray(range.start, range.end + 1);
            return new NextResponse(new Uint8Array(chunk), {
                status: 206,
                headers: {
                    ...common,
                    "Content-Range": `bytes ${range.start}-${range.end}/${total}`,
                    "Content-Length": String(chunk.length),
                },
            });
        }
        return new NextResponse(new Uint8Array(bytes), {headers: {...common, "Content-Length": String(total)}});
    } catch {
        return new NextResponse("Error", {status: 500});
    }
}