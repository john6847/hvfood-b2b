"use server";

import { revalidatePath } from "next/cache";
import { approveApplication, rejectApplication } from "@/modules/accounts/application-service";
import { approveApplicationSchema, rejectApplicationSchema } from "@/modules/accounts/schemas";

export async function approveApplicationAction(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "");
  const pricingTierId = String(formData.get("pricingTierId") || "");
  const internalNotes = String(formData.get("internalNotes") || "").trim() || undefined;

  const parsed = approveApplicationSchema.safeParse({ applicationId, pricingTierId, internalNotes });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid approval options" };
  }

  try {
    const res = await approveApplication(parsed.data);
    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath("/admin/applications");
    revalidatePath("/admin/customers");
    return {
      ok: true,
      companyId: res.companyId,
      invitationToken: res.invitationToken,
    };
  } catch (err: unknown) {
    console.error("approveApplicationAction failed:", err);
    return { ok: false, error: (err as Error).message || "Failed to approve application" };
  }
}

export async function rejectApplicationAction(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "");
  const internalNotes = String(formData.get("internalNotes") || "").trim() || undefined;
  const customerMessage = String(formData.get("customerMessage") || "").trim() || undefined;

  const parsed = rejectApplicationSchema.safeParse({ applicationId, internalNotes, customerMessage });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  try {
    await rejectApplication(parsed.data);
    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath("/admin/applications");
    return { ok: true };
  } catch (err: unknown) {
    console.error("rejectApplicationAction failed:", err);
    return { ok: false, error: (err as Error).message || "Failed to reject application" };
  }
}
