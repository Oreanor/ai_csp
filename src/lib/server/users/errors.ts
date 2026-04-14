export class UserRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserRepositoryError";
  }
}

export class UserRepositoryNotFoundError extends UserRepositoryError {
  constructor(id: string) {
    super(`User not found: ${id}`);
    this.name = "UserRepositoryNotFoundError";
  }
}

export class UserRepositoryConflictError extends UserRepositoryError {
  constructor(message = "Email already in use") {
    super(message);
    this.name = "UserRepositoryConflictError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
