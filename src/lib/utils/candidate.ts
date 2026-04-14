/** First token of a display name (for compact log labels). */
export function candidateShortName(fullName: string) {
  const [first] = fullName.trim().split(/\s+/);
  return first ?? fullName;
}

/** Two-letter initials from a display name. */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const a = parts[0][0];
  const b = parts[parts.length - 1][0];
  return `${a}${b}`.toUpperCase();
}

export function newPersonaId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `persona-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Split comma- or semicolon-separated tags. */
export function parseCommaTags(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
