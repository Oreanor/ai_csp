import type { UserCreateInput, UserUpdateInput } from "@/types/user";

import { ValidationError } from "@/lib/server/users/errors";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseUserCreate(body: unknown): UserCreateInput {
  if (body === null || typeof body !== "object") {
    throw new ValidationError("Invalid JSON body");
  }
  const o = body as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!email) {
    throw new ValidationError("email is required");
  }
  if (!emailRe.test(email)) {
    throw new ValidationError("invalid email");
  }
  if (!name) {
    throw new ValidationError("name is required");
  }
  return { email, name };
}

export function parseUserUpdate(body: unknown): UserUpdateInput {
  if (body === null || typeof body !== "object") {
    throw new ValidationError("Invalid JSON body");
  }
  const o = body as Record<string, unknown>;
  const patch: UserUpdateInput = {};
  if ("email" in o) {
    if (typeof o.email !== "string") {
      throw new ValidationError("email must be a string");
    }
    const email = o.email.trim();
    if (!email) {
      throw new ValidationError("email cannot be empty");
    }
    if (!emailRe.test(email)) {
      throw new ValidationError("invalid email");
    }
    patch.email = email;
  }
  if ("name" in o) {
    if (typeof o.name !== "string") {
      throw new ValidationError("name must be a string");
    }
    const name = o.name.trim();
    if (!name) {
      throw new ValidationError("name cannot be empty");
    }
    patch.name = name;
  }
  if (Object.keys(patch).length === 0) {
    throw new ValidationError("no fields to update");
  }
  return patch;
}
