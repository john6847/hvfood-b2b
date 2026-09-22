import { createHash, randomBytes } from "node:crypto";

/**
 * Generates a high-entropy secret token (32 bytes = 64 hex characters)
 * and its deterministic SHA-256 hash.
 * The plain token is sent only in the invitation URL;
 * only the hash is persisted in the database.
 */
export function generateInvitationToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

/**
 * Computes the SHA-256 hash of a token.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}
