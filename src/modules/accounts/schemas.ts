import { z } from "zod";

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "VI"
] as const;

export const BUSINESS_TYPES = [
  { value: "RETAIL", label: "Retail / Grocery Store" },
  { value: "RESTAURANT", label: "Restaurant / Cafe" },
  { value: "DISTRIBUTOR", label: "Distributor / Wholesaler" },
  { value: "FOOD_SERVICE", label: "Food Service / Caterer" },
  { value: "OTHER", label: "Other Commercial Entity" },
] as const;

export const ESTIMATED_VOLUMES = [
  "Under 25 cases / month",
  "25 – 100 cases / month",
  "100 – 500 cases / month",
  "500+ cases / month (High volume / pallet)",
] as const;

export const wholesaleApplicationSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  businessName: z.string().trim().min(1, "Business name is required").max(100),
  email: z.string().trim().email("Please provide a valid business email").toLowerCase(),
  phone: z.string().trim().min(7, "Please provide a valid phone number").max(30),
  website: z
    .string()
    .trim()
    .transform((val) => (val && !/^https?:\/\//i.test(val) ? `https://${val}` : val))
    .pipe(z.string().url("Please provide a valid URL").or(z.literal("")))
    .optional(),
  businessType: z.enum(["RETAIL", "RESTAURANT", "DISTRIBUTOR", "FOOD_SERVICE", "OTHER"], {
    error: "Select a business type",
  }),
  street1: z.string().trim().min(1, "Street address is required").max(120),
  street2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(1, "City is required").max(60),
  state: z.string().trim().toUpperCase().refine(
    (s) => (US_STATES as readonly string[]).includes(s),
    "Select a valid 2-letter US state or territory",
  ),
  postalCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Provide a 5-digit US ZIP code"),
  businessNumber: z.string().trim().max(50).optional().default(""),
  estimatedMonthlyVolume: z.string().trim().max(80).optional().default(""),
  productsInterestedIn: z.array(z.string()).default([]),
  applicantNotes: z.string().trim().max(1000).optional().default(""),
  submissionKey: z.string().uuid().optional(),
});

export type WholesaleApplicationInput = z.infer<typeof wholesaleApplicationSchema>;

export const approveApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  pricingTierId: z.string().uuid("Choose a pricing tier"),
  internalNotes: z.string().trim().max(1000).optional(),
});

export type ApproveApplicationInput = z.infer<typeof approveApplicationSchema>;

export const rejectApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  internalNotes: z.string().trim().max(1000).optional(),
  customerMessage: z.string().trim().max(1000).optional(),
});

export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;
