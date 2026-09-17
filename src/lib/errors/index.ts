/**
 * Typed application errors. Services throw these; transport adapters
 * (server actions, route handlers) translate them into responses.
 */

export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "MFA_REQUIRED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "You need to sign in.") {
    super("UNAUTHENTICATED", message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class MfaRequiredError extends AppError {
  constructor(message = "Two-step verification is required for staff.") {
    super("MFA_REQUIRED", message);
    this.name = "MfaRequiredError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
