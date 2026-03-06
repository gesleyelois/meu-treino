import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_EXTENSIONS = [".gif", ".mp4", ".webm", ".webp", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/upload — upload a media file to Vercel Blob Storage
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
        }

        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
                { status: 400 }
            );
        }

        const filename = `${randomUUID()}${ext}`;

        // Upload to Vercel Blob Storage (works in both dev and production)
        const blob = await put(`uploads/${filename}`, file, {
            access: "public",
        });

        return NextResponse.json({ url: blob.url });
    } catch (error) {
        console.error("Upload failed:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
