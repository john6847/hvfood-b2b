import "server-only";
import { redirect } from "next/navigation";
import { isAppError } from "@/lib/errors";
import type { Permission } from "./permissions";
import {
  requireApprovedMembership,
  requirePermission,
  requireStaff,
  type StaffContext,
} from "./service";

/**
 * Page-level guards. Layouts and pages render in parallel, so a page cannot
 * rely on its layout having redirected first. These wrap the throwing
 * `require*` functions and turn authorization failures into redirects.
 */

function redirectFor(error: unknown): never {
  if (isAppError(error)) {
    switch (error.code) {
      case "UNAUTHENTICATED":
        redirect("/login");
      case "MFA_REQUIRED":
        redirect("/mfa");
      case "FORBIDDEN":
        redirect("/wholesale/dashboard");
      default:
        break;
    }
  }
  throw error;
}

export async function guardStaff(): Promise<StaffContext> {
  try {
    return await requireStaff();
  } catch (error) {
    redirectFor(error);
  }
}

export async function guardPermission(permission: Permission): Promise<StaffContext> {
  try {
    return await requirePermission(permission);
  } catch (error) {
    redirectFor(error);
  }
}

export async function guardApprovedMembership() {
  try {
    return await requireApprovedMembership();
  } catch (error) {
    redirectFor(error);
  }
}
