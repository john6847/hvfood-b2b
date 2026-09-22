"use server";

import { submitApplication } from "@/modules/accounts/application-service";
import { wholesaleApplicationSchema, type WholesaleApplicationInput } from "@/modules/accounts/schemas";

export type ApplicationActionResult = {
  success: boolean;
  applicationId?: string;
  error?: string;
};

export async function submitWholesaleApplicationAction(
  input: WholesaleApplicationInput,
): Promise<ApplicationActionResult> {
  try {
    const parsed = wholesaleApplicationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid form data";
      return { success: false, error: firstError };
    }

    const res = await submitApplication(parsed.data);
    return { success: true, applicationId: res.id };
  } catch (err: unknown) {
    console.error("submitWholesaleApplicationAction failed:", err);
    return {
      success: false,
      error: (err as Error).message || "We could not submit your application. Please try again.",
    };
  }
}
