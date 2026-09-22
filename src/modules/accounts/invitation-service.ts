import { createSessionClient } from "@/lib/supabase/server";
import { STATIC_PREVIEW } from "@/lib/env";
import { hashToken } from "./crypto";

export type InvitationDetails = {
  invitationId: string;
  companyId: string;
  companyName: string;
  email: string;
  role: string;
  isExpired: boolean;
  isAccepted: boolean;
  isRevoked: boolean;
};

/**
 * Validates an invitation token and returns non-sensitive company and invite context.
 */
export async function getInvitationByToken(token: string): Promise<InvitationDetails | null> {
  if (!token || token.trim().length === 0) return null;

  if (STATIC_PREVIEW) {
    return {
      invitationId: "mock-inv-123",
      companyId: "mock-company-456",
      companyName: "Acme Gourmet Markets",
      email: "buyer@acmegourmet.test",
      role: "OWNER",
      isExpired: false,
      isAccepted: false,
      isRevoked: false,
    };
  }

  const tokenHash = hashToken(token);
  const supabase = await createSessionClient();

  const { data, error } = await supabase.rpc("get_invitation_details", {
    p_token_hash: tokenHash,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];
  if (!row) {
    return null;
  }

  return {
    invitationId: row.invitation_id,
    companyId: row.company_id,
    companyName: row.company_name,
    email: row.email,
    role: row.role,
    isExpired: row.is_expired ?? false,
    isAccepted: row.is_accepted ?? false,
    isRevoked: row.is_revoked ?? false,
  };
}

/**
 * Accepts an invitation for the currently signed-in user.
 * The signed-in user's email must match the invitation's email.
 */
export async function acceptInvitation(token: string): Promise<{ ok: boolean; companyId?: string; error?: string }> {
  if (!token || token.trim().length === 0) {
    return { ok: false, error: "Invalid invitation token" };
  }

  if (STATIC_PREVIEW) {
    return { ok: true, companyId: "mock-company-456" };
  }

  const tokenHash = hashToken(token);
  const supabase = await createSessionClient();

  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token_hash: tokenHash,
  });

  if (error) {
    console.error("accept_invitation error:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true, companyId: data };
}
