/** Application user (auth/workspace identity). Replace persistence via `UserRepository` impl. */
export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type UserCreateInput = {
  email: string;
  name: string;
};

export type UserUpdateInput = Partial<Pick<User, "email" | "name">>;
