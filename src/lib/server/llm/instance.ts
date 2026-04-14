import type { LlmClient } from "@/lib/server/llm/llm-client";
import { StubLlmClient } from "@/lib/server/llm/stub-llm-client";

let singleton: LlmClient | null = null;

/**
 * Single entry point for server-side LLM calls.
 * Later: branch on env and return OpenAiLlmClient, etc.
 */
export function getLlmClient(): LlmClient {
  singleton ??= new StubLlmClient();
  return singleton;
}

export function resetLlmClientForTests() {
  singleton = null;
}
