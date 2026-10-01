import {NextResponse} from "next/server";
import {Binary, ObjectId} from "mongodb";
import {isAuthed} from "@/lib/auth";
import {sniffAudio} from "@/lib/audio";
import {getDb, hasDb} from "@/lib/mongo";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024;

/** Upload one audio file (multipart field "file"). Stored inside MongoDB. */
export async function POST(req: Request) {
    if (!isAuthed()) return NextResponse.json({error: "Please log in first."}, {status: 401});
    if (!hasDb()) return NextResponse.json({error: "MongoDB isn't connected, so audio can't be stored."}, {status: 503});

    try {
        const form = await req.formData();
        const file = form.get("file");
        if (!file || typeof file === "string") return NextResponse.json({error: "No file received."}, {status: 400});
        if (file.size > MAX_BYTES) return NextResponse.json({error: "Audio is too large (max 4 MB)."}, {status: 413});

        const buf = Buffer.from(await file.arrayBuffer());
        const type = sniffAudio(buf);
        if (!type) return NextResponse.json({error: "Use an mp3, m4a, ogg, wav or webm audio file."}, {status: 415});

        const db = await getDb();
        const r = await db.collection<{
            _id: ObjectId;
            contentType: string;
            data: Binary;
            size: number;
            createdAt: Date
        }>("audio").insertOne({
            _id: new ObjectId(),
            contentType: type,
            data: new Binary(buf),
            size: buf.length,
            createdAt: new Date(),
        });
        return NextResponse.json({id: r.insertedId.toHexString()});
    } catch {
        return NextResponse.json({error: "Upload failed."}, {status: 500});
    }
}