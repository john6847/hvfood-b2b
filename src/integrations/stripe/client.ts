import "server-only";
import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/env";

let client: Stripe | null = null;

/**
 * Shared Stripe client, created on first use so a missing key never fails
 * a build. Returns null when Stripe is not configured.
 */
export function getStripe(): Stripe | null {
  if (client) return client;
  const key = stripeSecretKey();
  if (!key) return null;
  client = new Stripe(key);
  return client;
}
