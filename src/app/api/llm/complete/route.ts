import { NextResponse } from "next/server";

import { getLlmClient } from "@/lib/server/llm";
import { parseLlmCompletionBody } from "@/lib/server/llm/parse-completion-body";
import { ValidationError } from "@/lib/server/users/errors";

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "LLM request failed";
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const input = parseLlmCompletionBody(body);
    const out = await getLlmClient().complete(input);
    if (typeof out.text !== "string") {
      return NextResponse.json({ error: "Invalid model response shape" }, { status: 502 });
    }
    const trimmed = out.text.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Model returned an empty reply" }, { status: 502 });
    }
    return NextResponse.json({
      text: trimmed,
      finishReason: out.finishReason,
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    const message = errorMessage(e);
    console.error("[api/llm/complete]", e);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
