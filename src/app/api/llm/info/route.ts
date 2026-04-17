import { NextResponse } from "next/server";

/** Public runtime facts for the Session tab (no secrets). */
export async function GET() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  if (key) {
    return NextResponse.json({ mode: "gemini" as const, modelId: model });
  }
  return NextResponse.json({ mode: "stub" as const, modelId: null });
}
