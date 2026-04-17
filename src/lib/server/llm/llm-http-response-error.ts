/** Thrown by LLM adapters when the HTTP layer should return a specific status and JSON body. */
export class LlmHttpResponseError extends Error {
  readonly httpStatus: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    httpStatus: number,
    options?: { code?: string; retryAfterSeconds?: number },
  ) {
    super(message);
    this.name = "LlmHttpResponseError";
    this.httpStatus = httpStatus;
    this.code = options?.code;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}
