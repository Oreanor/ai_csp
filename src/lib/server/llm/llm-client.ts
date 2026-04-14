import type { LlmCompletionInput, LlmCompletionOutput } from "@/lib/server/llm/types";

/** Pluggable LLM backend (OpenAI, Anthropic, local, …). */
export interface LlmClient {
  complete(input: LlmCompletionInput): Promise<LlmCompletionOutput>;
}
