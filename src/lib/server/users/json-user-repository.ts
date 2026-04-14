import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

import type { User, UserCreateInput, UserUpdateInput } from "@/types/user";

import {
  UserRepositoryConflictError,
  UserRepositoryNotFoundError,
} from "@/lib/server/users/errors";
import type { UserRepository } from "@/lib/server/users/repository";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUserRecord(x: unknown): x is User {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.email === "string" &&
    typeof o.name === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.updatedAt === "string"
  );
}

function nowIso() {
  return new Date().toISOString();
}

/**
 * PoC store: single JSON file under project root.
 * Not safe for concurrent writes or serverless read-only FS — replace with a real DB for production.
 */
export class JsonUserRepository implements UserRepository {
  constructor(private readonly filePath: string) {}

  private async ensureDir() {
    await mkdir(dirname(this.filePath), { recursive: true });
  }

  private async readAll(): Promise<User[]> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      const data = JSON.parse(raw) as unknown;
      if (!Array.isArray(data)) {
        return [];
      }
      return data.filter(isUserRecord);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "ENOENT") {
        return [];
      }
      throw e;
    }
  }

  private async writeAll(users: User[]) {
    await this.ensureDir();
    await writeFile(this.filePath, `${JSON.stringify(users, null, 2)}\n`, "utf-8");
  }

  async list(): Promise<User[]> {
    const users = await this.readAll();
    return [...users].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async getById(id: string): Promise<User | null> {
    const users = await this.readAll();
    return users.find((u) => u.id === id) ?? null;
  }

  async create(input: UserCreateInput): Promise<User> {
    const users = await this.readAll();
    const emailNorm = normalizeEmail(input.email);
    if (users.some((u) => normalizeEmail(u.email) === emailNorm)) {
      throw new UserRepositoryConflictError();
    }
    const ts = nowIso();
    const user: User = {
      id: crypto.randomUUID(),
      email: input.email.trim(),
      name: input.name.trim(),
      createdAt: ts,
      updatedAt: ts,
    };
    users.push(user);
    await this.writeAll(users);
    return user;
  }

  async update(id: string, patch: UserUpdateInput): Promise<User> {
    const users = await this.readAll();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new UserRepositoryNotFoundError(id);
    }
    const current = users[idx]!;
    if (patch.email !== undefined) {
      const emailNorm = normalizeEmail(patch.email);
      if (
        users.some(
          (u, i) => i !== idx && normalizeEmail(u.email) === emailNorm,
        )
      ) {
        throw new UserRepositoryConflictError();
      }
    }
    const next: User = {
      ...current,
      ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      updatedAt: nowIso(),
    };
    users[idx] = next;
    await this.writeAll(users);
    return next;
  }

  async delete(id: string): Promise<void> {
    const users = await this.readAll();
    const next = users.filter((u) => u.id !== id);
    if (next.length === users.length) {
      throw new UserRepositoryNotFoundError(id);
    }
    await this.writeAll(next);
  }
}
