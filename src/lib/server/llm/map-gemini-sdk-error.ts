export type MappedGeminiSdkError = {
  httpStatus: number;
  shortMessage: string;
  code?: string;
  retryAfterSeconds?: number;
};

function parseRetryAfterSeconds(raw: string): number | undefined {
  const m1 = raw.match(/Please retry in ([\d.]+)\s*s/i);
  if (m1) {
    const n = Math.ceil(Number.parseFloat(m1[1]));
    if (Number.isFinite(n)) return Math.min(3600, Math.max(1, n));
  }
  const m2 = raw.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  if (m2) {
    const n = Number.parseInt(m2[1], 10);
    if (Number.isFinite(n)) return Math.min(3600, Math.max(1, n));
  }
  return undefined;
}

/**
 * Turn noisy @google/generative-ai / REST error strings into a short message and HTTP metadata.
 */
export function mapGeminiSdkErrorMessage(raw: string): MappedGeminiSdkError {
  const msg = raw.trim();
  const lower = msg.toLowerCase();

  const retryAfterSeconds = parseRetryAfterSeconds(msg);

  const is429 =
    msg.includes("[429") ||
    msg.includes(" 429 ") ||
    lower.includes("too many requests") ||
    lower.includes("resource exhausted");

  const isQuota =
    lower.includes("quota exceeded") ||
    lower.includes("quota failure") ||
    lower.includes("generate_content_free_tier") ||
    (lower.includes("quota") && lower.includes("limit"));

  if (is429 || isQuota) {
    return {
      httpStatus: 429,
      code: "RATE_LIMIT",
      retryAfterSeconds,
      shortMessage: retryAfterSeconds
        ? `Gemini API rate limit — retry after ~${retryAfterSeconds}s`
        : "Gemini API rate limit",
    };
  }

  if (
    msg.includes("[401") ||
    msg.includes("[403") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid api key")
  ) {
    return {
      httpStatus: 502,
      code: "AUTH",
      shortMessage: "Gemini API rejected the key (check GEMINI_API_KEY)",
    };
  }

  if (msg.length > 240) {
    return {
      httpStatus: 502,
      shortMessage: `${msg.slice(0, 220).trim()}…`,
    };
  }

  return { httpStatus: 502, shortMessage: msg || "Gemini request failed" };
}
