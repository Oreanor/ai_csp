import { NextResponse } from "next/server";

import { getInterviewSettingsStore } from "@/lib/server/interview-settings/json-interview-settings-store";
import type { InterviewWorkspaceSettings } from "@/lib/server/interview-settings/types";

const MAX_PROMPT_LENGTH = 32_000;

function parseBody(body: unknown): { baseSystemPrompt: string } | null {
  if (body === null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.baseSystemPrompt !== "string") return null;
  return { baseSystemPrompt: o.baseSystemPrompt };
}

/** GET — load workspace interview settings (PoC JSON “DB”). */
export async function GET() {
  try {
    const s = await getInterviewSettingsStore().read();
    return NextResponse.json(s);
  } catch (e) {
    console.error("[api/interview/settings GET]", e);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

/** PUT — save base system prompt (PoC JSON “DB”). */
export async function PUT(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = parseBody(body);
    if (!parsed) {
      return NextResponse.json(
        { error: "body.baseSystemPrompt must be a string" },
        { status: 400 },
      );
    }
    if (parsed.baseSystemPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `baseSystemPrompt exceeds ${MAX_PROMPT_LENGTH} characters` },
        { status: 400 },
      );
    }
    const store = getInterviewSettingsStore();
    const next: InterviewWorkspaceSettings = {
      baseSystemPrompt: parsed.baseSystemPrompt,
      updatedAt: new Date().toISOString(),
    };
    await store.write(next);
    return NextResponse.json(next);
  } catch (e) {
    console.error("[api/interview/settings PUT]", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
