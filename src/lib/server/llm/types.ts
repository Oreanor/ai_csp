export type LlmRole = "system" | "user" | "assistant";

export type LlmMessage = {
  role: LlmRole;
  content: string;
};

/** Input to a chat/completions-style call (provider-agnostic). */
export type LlmCompletionInput = {
  messages: LlmMessage[];
  temperature?: number;
  maxOutputTokens?: number;
};

export type LlmCompletionOutput = {
  text: string;
  finishReason?: string;
};
