"use server";

import { revalidatePath } from "next/cache";
import { guardPermission } from "@/modules/identity/guards";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Staff action to reconcile incoming wire transfer payments.
 * Marks the order as PAID and transitions status to PROCESSING for fulfillment.
 */
export async function confirmWirePaymentAction(
  orderId: string,
  internalNotes?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await guardPermission("orders.manage");
    const supabase = await createSessionClient();
    const { error } = await supabase.rpc("admin_confirm_wire_payment", {
      p_order_id: orderId,
      p_internal_notes: internalNotes ?? undefined,
    });
    if (error) {
      return { error: error.message };
    }
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to confirm wire payment.";
    return { error: msg };
  }
}
