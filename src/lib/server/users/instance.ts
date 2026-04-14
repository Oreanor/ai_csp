import { join } from "path";

import { JsonUserRepository } from "@/lib/server/users/json-user-repository";
import type { UserRepository } from "@/lib/server/users/repository";

let singleton: UserRepository | null = null;

/** Default JSON path: `<cwd>/data/users.json`. Override with `USERS_STORE_PATH`. */
export function getUserRepository(): UserRepository {
  if (!singleton) {
    const path =
      process.env.USERS_STORE_PATH ?? join(process.cwd(), "data", "users.json");
    singleton = new JsonUserRepository(path);
  }
  return singleton;
}

/** Tests or scripts can reset the singleton. */
export function resetUserRepositoryForTests() {
  singleton = null;
}
