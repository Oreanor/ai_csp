import type { LlmCompletionInput, LlmMessage, LlmRole } from "@/lib/server/llm/types";

import { ValidationError } from "@/lib/server/users/errors";

const roles: LlmRole[] = ["system", "user", "assistant"];

function isRole(x: unknown): x is LlmRole {
  return typeof x === "string" && (roles as readonly string[]).includes(x);
}

export function parseLlmCompletionBody(body: unknown): LlmCompletionInput {
  if (body === null || typeof body !== "object") {
    throw new ValidationError("Invalid JSON body");
  }
  const o = body as Record<string, unknown>;
  if (!Array.isArray(o.messages) || o.messages.length === 0) {
    throw new ValidationError("messages must be a non-empty array");
  }
  const messages: LlmMessage[] = o.messages.map((raw, i) => {
    if (raw === null || typeof raw !== "object") {
      throw new ValidationError(`messages[${i}] must be an object`);
    }
    const m = raw as Record<string, unknown>;
    if (!isRole(m.role)) {
      throw new ValidationError(`messages[${i}].role invalid`);
    }
    if (typeof m.content !== "string") {
      throw new ValidationError(`messages[${i}].content must be a string`);
    }
    return { role: m.role, content: m.content };
  });
  const input: LlmCompletionInput = { messages };
  if ("temperature" in o && o.temperature !== undefined) {
    if (typeof o.temperature !== "number") {
      throw new ValidationError("temperature must be a number");
    }
    input.temperature = o.temperature;
  }
  if ("maxOutputTokens" in o && o.maxOutputTokens !== undefined) {
    if (typeof o.maxOutputTokens !== "number") {
      throw new ValidationError("maxOutputTokens must be a number");
    }
    input.maxOutputTokens = o.maxOutputTokens;
  }
  return input;
}
