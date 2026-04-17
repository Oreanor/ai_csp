import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  Content,
  EnhancedGenerateContentResponse,
  GenerateContentResponse,
} from "@google/generative-ai";

import type { LlmClient } from "@/lib/server/llm/llm-client";
import type { LlmCompletionInput, LlmCompletionOutput, LlmMessage } from "@/lib/server/llm/types";

/** Concatenate plain text parts when the SDK helper cannot (e.g. safety block). */
function collectTextFromParts(parts: unknown): string {
  if (!Array.isArray(parts)) return "";
  const chunks: string[] = [];
  for (const p of parts) {
    if (p && typeof p === "object" && "text" in p) {
      const t = (p as { text?: unknown }).text;
      if (typeof t === "string" && t.trim()) chunks.push(t);
    }
  }
  return chunks.join("\n\n").trim();
}

function describeGeminiFailure(response: GenerateContentResponse): string | null {
  const pf = response.promptFeedback;
  const blockReason = pf?.blockReason;
  if (blockReason) {
    const msg = pf?.blockReasonMessage?.trim();
    return msg ? `Prompt blocked (${blockReason}): ${msg}` : `Prompt blocked (${blockReason})`;
  }
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    return "Model returned no candidates (empty or filtered response)";
  }
  const c0 = candidates[0];
  const fr = c0?.finishReason;
  if (fr && fr !== "STOP") {
    const fm = c0.finishMessage?.trim();
    return fm || `Generation stopped (${fr})`;
  }
  return null;
}

function extractGeminiOutputText(response: EnhancedGenerateContentResponse): string {
  let text = "";
  try {
    text = response.text().trim();
  } catch {
    text = collectTextFromParts(response.candidates?.[0]?.content?.parts);
  }
  if (!text) {
    const hint = describeGeminiFailure(response);
    throw new Error(hint ?? "Model returned no usable text");
  }
  return text;
}

function llmMessagesToGemini(input: LlmMessage[]): {
  systemInstruction?: string;
  contents: Content[];
} {
  const systemParts = input
    .filter((m) => m.role === "system")
    .map((m) => m.content.trim())
    .filter(Boolean);
  const systemInstruction =
    systemParts.length > 0 ? systemParts.join("\n\n") : undefined;

  const nonSystem = input.filter((m) => m.role !== "system");
  const contents: Content[] = [];

  for (const m of nonSystem) {
    const geminiRole = m.role === "assistant" ? "model" : "user";
    const text = m.content;
    if (!text.trim()) {
      continue;
    }

    const last = contents[contents.length - 1];
    const lastPart = last?.parts[0];
    if (
      last &&
      last.role === geminiRole &&
      lastPart &&
      "text" in lastPart &&
      typeof lastPart.text === "string"
    ) {
      lastPart.text += `\n\n${text}`;
    } else {
      contents.push({
        role: geminiRole,
        parts: [{ text }],
      });
    }
  }

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "." }] });
  }

  if (contents[0]?.role === "model") {
    contents.unshift({ role: "user", parts: [{ text: "Continue." }] });
  }

  return { systemInstruction, contents };
}

export type GeminiLlmClientOptions = {
  /** e.g. gemini-2.5-flash (free tier friendly). */
  model?: string;
};

/**
 * Google Gemini via AI Studio API key — generous free tier, long context for CV + chat history.
 * @see https://ai.google.dev/gemini-api/docs
 */
export class GeminiLlmClient implements LlmClient {
  private readonly model;

  constructor(apiKey: string, options?: GeminiLlmClientOptions) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = options?.model ?? "gemini-2.5-flash";
    this.model = genAI.getGenerativeModel({ model: modelName });
  }

  async complete(input: LlmCompletionInput): Promise<LlmCompletionOutput> {
    const { systemInstruction, contents } = llmMessagesToGemini(input.messages);

    try {
      const result = await this.model.generateContent({
        systemInstruction,
        contents,
        generationConfig: {
          temperature: input.temperature ?? 0.7,
          maxOutputTokens: input.maxOutputTokens ?? 2048,
        },
      });

      const response = result.response;
      const text = extractGeminiOutputText(response);
      const candidate = response.candidates?.[0];
      const finishReason = candidate?.finishReason;

      return {
        text,
        finishReason: finishReason ?? undefined,
      };
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Gemini request failed";
      throw new Error(message);
    }
  }
}
