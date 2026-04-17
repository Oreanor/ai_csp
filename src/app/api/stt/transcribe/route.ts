import { NextResponse } from "next/server";

import { isSttLanguageMode } from "@/types/interview";

const DEFAULT_STT_URL = "http://127.0.0.1:8001";
const STT_SERVICE_URL = (process.env.STT_SERVICE_URL || DEFAULT_STT_URL).replace(/\/$/, "");
const STT_TRANSCRIBE_URL = `${STT_SERVICE_URL}/transcribe`;

function parseErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string" && error.trim()) return error;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return null;
}

export async function POST(req: Request) {
  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const languageInput = form.get("language");
  const language =
    typeof languageInput === "string" && isSttLanguageMode(languageInput)
      ? languageInput
      : "auto";

  const upstreamBody = new FormData();
  upstreamBody.append("audio", audio, audio.name || "speech.webm");
  upstreamBody.append("language", language);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(STT_TRANSCRIBE_URL, {
      method: "POST",
      body: upstreamBody,
    });
  } catch (err) {
    console.error("[STT proxy] fetch failed:", STT_TRANSCRIBE_URL, err);
    return NextResponse.json(
      {
        error:
          "STT service is unavailable. Start local Whisper service (STT_SERVICE_URL).",
      },
      { status: 503 },
    );
  }

  let payload: unknown = null;
  try {
    payload = await upstreamResponse.json();
  } catch {
    payload = null;
  }

  if (!upstreamResponse.ok) {
    console.error(
      "[STT proxy] upstream error:",
      upstreamResponse.status,
      STT_TRANSCRIBE_URL,
      payload,
    );
    return NextResponse.json(
      { error: parseErrorMessage(payload) || "Transcription failed" },
      { status: 502 },
    );
  }

  const text = typeof (payload as { text?: unknown })?.text === "string"
    ? (payload as { text: string }).text.trim()
    : "";

  return NextResponse.json({ text });
}
