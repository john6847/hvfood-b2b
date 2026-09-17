/**
 * Shapes the account screens render. Both the Supabase queries and the
 * static fixtures map into these, so pages never branch on the data source.
 */

export type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type CompanyRole = "OWNER" | "BUYER" | "VIEWER";

export type CompanySummary = {
  id: string;
  legalName: string;
  displayName: string;
  email: string;
  phone: string | null;
  website: string | null;
  status: CompanyStatus;
  pricingTierCode: string | null;
  pricingTierName: string | null;
  memberCount: number;
  createdAt: string;
  version: number;
};

export type CompanyMember = {
  id: string;
  role: CompanyRole;
  active: boolean;
  firstName: string;
  lastName: string;
  email: string;
};

export type CompanyAddress = {
  id: string;
  label: string;
  contactName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  isBilling: boolean;
  isDefaultShipping: boolean;
};

export type CompanyLocation = {
  id: string;
  addressId: string;
  name: string;
  isResidential: boolean;
  hasDock: boolean;
  liftgateRequired: boolean;
  appointmentRequired: boolean;
  receivingInstructions: string | null;
};

export type CommercePolicy = {
  paymentTermsDays: number;
  creditLimitMinor: number;
  orderMinimumMinor: number | null;
  allowCard: boolean;
  allowAch: boolean;
  allowManual: boolean;
  allowTerms: boolean;
  releasePolicy: string;
};

export type CompanyPrivateDetails = {
  businessNumber: string | null;
  taxNumber: string | null;
  internalNotes: string | null;
};

export type CompanyRecord = {
  summary: CompanySummary;
  members: CompanyMember[];
  addresses: CompanyAddress[];
  locations: CompanyLocation[];
  policy: CommercePolicy | null;
  privateDetails: CompanyPrivateDetails | null;
};

export type StaffMember = {
  staffUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  active: boolean;
  createdAt: string;
};

export type WholesaleApplication = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  city: string;
  region: string;
  businessType: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};
