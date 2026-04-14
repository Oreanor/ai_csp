import type { User, UserCreateInput, UserUpdateInput } from "@/types/user";

/** Persistence boundary for users. Swap JSON impl for Prisma/Postgres/etc. */
export interface UserRepository {
  list(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  create(input: UserCreateInput): Promise<User>;
  update(id: string, patch: UserUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
}
