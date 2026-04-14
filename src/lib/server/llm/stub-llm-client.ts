import type { LlmClient } from "@/lib/server/llm/llm-client";
import type { LlmCompletionInput, LlmCompletionOutput } from "@/lib/server/llm/types";

/** Default until `LLM_PROVIDER` (or similar) selects a real implementation. */
export class StubLlmClient implements LlmClient {
  async complete(input: LlmCompletionInput): Promise<LlmCompletionOutput> {
    const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
    const preview = lastUser?.content?.slice(0, 120) ?? "";
    return {
      text: `[llm-stub] Provider not configured. Echo (user): ${preview}`,
      finishReason: "stub",
    };
  }
}
