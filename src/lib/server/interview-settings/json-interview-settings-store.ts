import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";

import type { InterviewWorkspaceSettings } from "@/lib/server/interview-settings/types";

const DEFAULT: InterviewWorkspaceSettings = {
  baseSystemPrompt: "",
  updatedAt: new Date(0).toISOString(),
};

function isSettings(x: unknown): x is InterviewWorkspaceSettings {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.baseSystemPrompt === "string" && typeof o.updatedAt === "string";
}

/**
 * Single JSON document for interview workspace settings (PoC).
 * Replace with a real DB for production; same caveats as `JsonUserRepository`.
 */
export class JsonInterviewSettingsStore {
  constructor(private readonly filePath: string) {}

  private async ensureDir() {
    await mkdir(dirname(this.filePath), { recursive: true });
  }

  async read(): Promise<InterviewWorkspaceSettings> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const data = JSON.parse(raw) as unknown;
      if (!isSettings(data)) {
        return { ...DEFAULT };
      }
      return {
        baseSystemPrompt: data.baseSystemPrompt,
        updatedAt: data.updatedAt,
      };
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "ENOENT") {
        return { ...DEFAULT };
      }
      throw e;
    }
  }

  async write(next: InterviewWorkspaceSettings): Promise<void> {
    await this.ensureDir();
    await writeFile(this.filePath, `${JSON.stringify(next, null, 2)}\n`, "utf-8");
  }
}

let singleton: JsonInterviewSettingsStore | null = null;

export function getInterviewSettingsStore(): JsonInterviewSettingsStore {
  singleton ??= new JsonInterviewSettingsStore(
    process.env.INTERVIEW_SETTINGS_PATH?.trim() ||
      join(process.cwd(), "data", "interview-settings.json"),
  );
  return singleton;
}

export function resetInterviewSettingsStoreForTests() {
  singleton = null;
}
