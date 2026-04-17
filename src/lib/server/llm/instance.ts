import { GeminiLlmClient } from "@/lib/server/llm/gemini-llm-client";
import type { LlmClient } from "@/lib/server/llm/llm-client";
import { StubLlmClient } from "@/lib/server/llm/stub-llm-client";

let singleton: LlmClient | null = null;

function createLlmClient(): LlmClient {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (key) {
    return new GeminiLlmClient(key, {
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    });
  }
  return new StubLlmClient();
}

/**
 * Single entry point for server-side LLM calls.
 * Set GEMINI_API_KEY (Google AI Studio) for real completions; otherwise {@link StubLlmClient}.
 */
export function getLlmClient(): LlmClient {
  singleton ??= createLlmClient();
  return singleton;
}

export function resetLlmClientForTests() {
  singleton = null;
}
