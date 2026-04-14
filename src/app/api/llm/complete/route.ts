import { NextResponse } from "next/server";

import { getLlmClient } from "@/lib/server/llm";
import { parseLlmCompletionBody } from "@/lib/server/llm/parse-completion-body";
import { ValidationError } from "@/lib/server/users/errors";

export async function POST(req: Request) {
  try {
    const input = parseLlmCompletionBody(await req.json());
    const out = await getLlmClient().complete(input);
    return NextResponse.json(out);
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
