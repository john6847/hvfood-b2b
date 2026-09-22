/**
 * STATIC PREVIEW FIXTURES.
 *
 * Used only when no Supabase project is configured (see STATIC_PREVIEW in
 * `lib/env`). They let the design be reviewed and deployed before the
 * database exists. Every company, person, order and application here is
 * invented; the product photographs are the real retail images.
 *
 * Nothing in this file is reachable when Supabase is configured.
 */

import type {
  CompanyRecord,
  CompanySummary,
  StaffMember,
  WholesaleApplication,
} from "@/modules/accounts/types";
import type { Membership } from "@/modules/identity/company-access";
import { casePriceForQuantity, findProductBySlug } from "@/modules/catalog/fixtures";

/** Stable user ids for the static preview test accounts (see ./accounts). */
export const DEMO_USER_IDS = {
  buyer: "00000000-0000-4000-8000-000000000001",
  admin: "00000000-0000-4000-8000-000000000002",
} as const;

const COMPANY_IDS = {
  jeans: "10000000-0000-4000-8000-000000000001",
  caribbean: "10000000-0000-4000-8000-000000000002",
  palm: "10000000-0000-4000-8000-000000000003",
  island: "10000000-0000-4000-8000-000000000004",
} as const;

/** The company the preview acts as in the buyer portal. */
export const DEMO_ACTIVE_COMPANY_ID = COMPANY_IDS.jeans;

export const DEMO_MEMBERSHIPS: Membership[] = [
  {
    membershipId: "20000000-0000-4000-8000-000000000001",
    companyId: COMPANY_IDS.jeans,
    companyDisplayName: "Jean's Market",
    companyStatus: "APPROVED",
    role: "OWNER",
  },
];

export const DEMO_STAFF = {
  staffUserId: "30000000-0000-4000-8000-000000000001",
  roleCode: "ADMINISTRATOR",
  roleName: "Administrator",
} as const;

const summaries: CompanySummary[] = [
  {
    id: COMPANY_IDS.jeans,
    legalName: "Jean's Market LLC",
    displayName: "Jean's Market",
    email: "orders@jeansmarket.example",
    phone: "305-555-0142",
    website: "https://jeansmarket.example",
    status: "APPROVED",
    pricingTierCode: "SILVER",
    pricingTierName: "Silver",
    memberCount: 2,
    createdAt: "2026-03-04T15:12:00.000Z",
    version: 4,
  },
  {
    id: COMPANY_IDS.caribbean,
    legalName: "Caribbean Table Inc.",
    displayName: "Caribbean Table",
    email: "purchasing@caribbeantable.example",
    phone: "407-555-0177",
    website: null,
    status: "APPROVED",
    pricingTierCode: "STANDARD",
    pricingTierName: "Standard",
    memberCount: 1,
    createdAt: "2026-05-19T13:40:00.000Z",
    version: 2,
  },
  {
    id: COMPANY_IDS.palm,
    legalName: "Palm Grove Market LLC",
    displayName: "Palm Grove Market",
    email: "hello@palmgrove.example",
    phone: "407-555-0110",
    website: null,
    status: "PENDING",
    pricingTierCode: null,
    pricingTierName: null,
    memberCount: 1,
    createdAt: "2026-09-12T18:05:00.000Z",
    version: 1,
  },
  {
    id: COMPANY_IDS.island,
    legalName: "Island Provisions Co.",
    displayName: "Island Provisions",
    email: "buyer@islandprovisions.example",
    phone: "404-555-0163",
    website: null,
    status: "SUSPENDED",
    pricingTierCode: "STANDARD",
    pricingTierName: "Standard",
    memberCount: 1,
    createdAt: "2026-01-22T11:30:00.000Z",
    version: 7,
  },
];

const records: Record<string, CompanyRecord> = {
  [COMPANY_IDS.jeans]: {
    summary: summaries[0]!,
    members: [
      {
        id: "20000000-0000-4000-8000-000000000001",
        role: "OWNER",
        active: true,
        firstName: "Jean",
        lastName: "Martin",
        email: "jean@jeansmarket.example",
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        role: "BUYER",
        active: true,
        firstName: "Marie",
        lastName: "Louis",
        email: "marie@jeansmarket.example",
      },
    ],
    addresses: [
      {
        id: "40000000-0000-4000-8000-000000000001",
        label: "Head office",
        contactName: "Jean Martin",
        phone: "305-555-0142",
        line1: "1200 NW 7th Ave",
        line2: null,
        city: "Miami",
        region: "FL",
        postalCode: "33136",
        isBilling: true,
        isDefaultShipping: false,
      },
      {
        id: "40000000-0000-4000-8000-000000000002",
        label: "Warehouse",
        contactName: "Marie Louis",
        phone: "305-555-0199",
        line1: "4800 NW 37th Ave",
        line2: "Dock 3",
        city: "Miami",
        region: "FL",
        postalCode: "33142",
        isBilling: false,
        isDefaultShipping: true,
      },
    ],
    locations: [
      {
        id: "50000000-0000-4000-8000-000000000001",
        addressId: "40000000-0000-4000-8000-000000000002",
        name: "Miami warehouse",
        isResidential: false,
        hasDock: true,
        liftgateRequired: false,
        appointmentRequired: false,
        receivingInstructions: "Receiving Mon-Fri 7am-2pm. Dock 3.",
      },
    ],
    policy: {
      paymentTermsDays: 0,
      creditLimitMinor: 0,
      orderMinimumMinor: 25000,
      allowCard: true,
      allowAch: true,
      allowManual: false,
      allowTerms: false,
      releasePolicy: "PAYMENT_SUCCEEDED",
    },
    privateDetails: {
      businessNumber: "FL-SAMPLE-0001",
      taxNumber: null,
      internalNotes: "Sample account. Steady reorders on rice and beans.",
    },
  },
  [COMPANY_IDS.caribbean]: {
    summary: summaries[1]!,
    members: [
      {
        id: "20000000-0000-4000-8000-000000000003",
        role: "OWNER",
        active: true,
        firstName: "Nadia",
        lastName: "Pierre",
        email: "nadia@caribbeantable.example",
      },
    ],
    addresses: [
      {
        id: "40000000-0000-4000-8000-000000000003",
        label: "Restaurant",
        contactName: "Nadia Pierre",
        phone: "407-555-0177",
        line1: "55 W Church St",
        line2: null,
        city: "Orlando",
        region: "FL",
        postalCode: "32801",
        isBilling: true,
        isDefaultShipping: true,
      },
    ],
    locations: [
      {
        id: "50000000-0000-4000-8000-000000000002",
        addressId: "40000000-0000-4000-8000-000000000003",
        name: "Downtown restaurant",
        isResidential: false,
        hasDock: false,
        liftgateRequired: true,
        appointmentRequired: true,
        receivingInstructions: "Rear entrance on Pine St. Call ahead.",
      },
    ],
    policy: {
      paymentTermsDays: 0,
      creditLimitMinor: 0,
      orderMinimumMinor: 25000,
      allowCard: true,
      allowAch: false,
      allowManual: false,
      allowTerms: false,
      releasePolicy: "PAYMENT_SUCCEEDED",
    },
    privateDetails: {
      businessNumber: "FL-SAMPLE-0002",
      taxNumber: null,
      internalNotes: "Sample account.",
    },
  },
  [COMPANY_IDS.palm]: {
    summary: summaries[2]!,
    members: [
      {
        id: "20000000-0000-4000-8000-000000000004",
        role: "OWNER",
        active: true,
        firstName: "Rose",
        lastName: "Baptiste",
        email: "rose@palmgrove.example",
      },
    ],
    addresses: [],
    locations: [],
    policy: null,
    privateDetails: {
      businessNumber: null,
      taxNumber: null,
      internalNotes: "Application received. Awaiting review.",
    },
  },
  [COMPANY_IDS.island]: {
    summary: summaries[3]!,
    members: [
      {
        id: "20000000-0000-4000-8000-000000000005",
        role: "OWNER",
        active: true,
        firstName: "Marc",
        lastName: "Charles",
        email: "marc@islandprovisions.example",
      },
    ],
    addresses: [
      {
        id: "40000000-0000-4000-8000-000000000004",
        label: "Store",
        contactName: "Marc Charles",
        phone: "404-555-0163",
        line1: "980 Peachtree St NE",
        line2: null,
        city: "Atlanta",
        region: "GA",
        postalCode: "30309",
        isBilling: true,
        isDefaultShipping: true,
      },
    ],
    locations: [],
    policy: {
      paymentTermsDays: 0,
      creditLimitMinor: 0,
      orderMinimumMinor: 25000,
      allowCard: true,
      allowAch: false,
      allowManual: false,
      allowTerms: false,
      releasePolicy: "PAYMENT_SUCCEEDED",
    },
    privateDetails: {
      businessNumber: "GA-SAMPLE-0003",
      taxNumber: null,
      internalNotes: "Suspended pending a payment review.",
    },
  },
};

export const DEMO_COMPANY_SUMMARIES = summaries;
export const DEMO_COMPANY_RECORDS = records;

export const DEMO_STAFF_DIRECTORY: StaffMember[] = [
  {
    staffUserId: DEMO_STAFF.staffUserId,
    firstName: "Horizon Vert",
    lastName: "Admin",
    email: "admin@horizonvertb2b.com",
    roleName: "Administrator",
    active: true,
    createdAt: "2026-01-08T09:00:00.000Z",
  },
  {
    staffUserId: "30000000-0000-4000-8000-000000000002",
    firstName: "Sam",
    lastName: "Rivera",
    email: "sam.rivera@horizonvertfoods.example",
    roleName: "Operations",
    active: true,
    createdAt: "2026-02-17T09:00:00.000Z",
  },
  {
    staffUserId: "30000000-0000-4000-8000-000000000003",
    firstName: "Dana",
    lastName: "Okafor",
    email: "dana.okafor@horizonvertfoods.example",
    roleName: "Finance",
    active: true,
    createdAt: "2026-04-02T09:00:00.000Z",
  },
];

export const DEMO_APPLICATIONS: WholesaleApplication[] = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    businessName: "Palm Grove Market",
    contactName: "Rose Baptiste",
    email: "hello@palmgrove.example",
    city: "Orlando",
    region: "FL",
    businessType: "Grocery retail",
    submittedAt: "2026-09-12T18:05:00.000Z",
    status: "PENDING",
  },
  {
    id: "60000000-0000-4000-8000-000000000002",
    businessName: "Maison Kitchen",
    contactName: "Yves Deslandes",
    email: "chef@maisonkitchen.example",
    city: "Tampa",
    region: "FL",
    businessType: "Restaurant",
    submittedAt: "2026-09-15T14:22:00.000Z",
    status: "PENDING",
  },
  {
    id: "60000000-0000-4000-8000-000000000003",
    businessName: "Bayside Distributors",
    contactName: "Toni Alvarez",
    email: "buying@baysidedist.example",
    city: "Savannah",
    region: "GA",
    businessType: "Distributor",
    submittedAt: "2026-09-16T10:48:00.000Z",
    status: "PENDING",
  },
];

/* Orders ------------------------------------------------------------------ */

export type DemoOrderLine = {
  productSlug: string;
  cases: number;
};

export type DemoOrder = {
  orderNumber: string;
  companyId: string;
  companyName: string;
  placedBy: string;
  placedAt: string;
  status: "CONFIRMED" | "PROCESSING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "ON_HOLD";
  paymentStatus: "PAID" | "PROCESSING" | "UNPAID";
  fulfillmentStatus: "UNFULFILLED" | "PARTIALLY_FULFILLED" | "FULFILLED";
  poNumber: string | null;
  lines: DemoOrderLine[];
};

const orders: DemoOrder[] = [
  {
    orderNumber: "HV-10482",
    companyId: COMPANY_IDS.jeans,
    companyName: "Jean's Market",
    placedBy: "Jean Martin",
    placedAt: "2026-09-14T16:20:00.000Z",
    status: "SHIPPED",
    paymentStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    poNumber: "PO-2026-0914",
    lines: [
      { productSlug: "jasmine-rice", cases: 12 },
      { productSlug: "madame-sarah-black-eye-peas", cases: 10 },
      { productSlug: "cornmeal", cases: 10 },
    ],
  },
  {
    orderNumber: "HV-10476",
    companyId: COMPANY_IDS.caribbean,
    companyName: "Caribbean Table",
    placedBy: "Nadia Pierre",
    placedAt: "2026-09-12T11:05:00.000Z",
    status: "ON_HOLD",
    paymentStatus: "PROCESSING",
    fulfillmentStatus: "UNFULFILLED",
    poNumber: null,
    lines: [
      { productSlug: "fresh-epis-seasoning-medium-spicy", cases: 10 },
      { productSlug: "haitian-coffee", cases: 5 },
    ],
  },
  {
    orderNumber: "HV-10461",
    companyId: COMPANY_IDS.jeans,
    companyName: "Jean's Market",
    placedBy: "Marie Louis",
    placedAt: "2026-09-09T09:41:00.000Z",
    status: "PROCESSING",
    paymentStatus: "PAID",
    fulfillmentStatus: "UNFULFILLED",
    poNumber: "PO-2026-0909",
    lines: [
      { productSlug: "diri-shella-haitian-rice", cases: 24 },
      { productSlug: "breadfruit-flour", cases: 20 },
    ],
  },
  {
    orderNumber: "HV-10429",
    companyId: COMPANY_IDS.jeans,
    companyName: "Jean's Market",
    placedBy: "Jean Martin",
    placedAt: "2026-09-02T14:02:00.000Z",
    status: "DELIVERED",
    paymentStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    poNumber: null,
    lines: [
      { productSlug: "jasmine-rice", cases: 12 },
      { productSlug: "caribbean-pikliz", cases: 5 },
    ],
  },
  {
    orderNumber: "HV-10408",
    companyId: COMPANY_IDS.island,
    companyName: "Island Provisions",
    placedBy: "Marc Charles",
    placedAt: "2026-08-26T10:15:00.000Z",
    status: "DELIVERED",
    paymentStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    poNumber: null,
    lines: [
      { productSlug: "small-red-beans", cases: 12 },
      { productSlug: "breadfruit-flour", cases: 10 },
    ],
  },
];

/** Line totals are derived from the catalog so the numbers always agree. */
export function demoOrderTotals(order: DemoOrder) {
  const lines = order.lines.map((line) => {
    const product = findProductBySlug(line.productSlug);
    const unitPriceMinor = product ? casePriceForQuantity(product, line.cases) : 0;
    return {
      ...line,
      name: product?.name ?? line.productSlug,
      sku: product?.sku ?? "",
      pack: product?.pack ?? "",
      image: product?.image ?? "",
      unitPriceMinor,
      totalMinor: unitPriceMinor * line.cases,
    };
  });
  const subtotalMinor = lines.reduce((sum, l) => sum + l.totalMinor, 0);
  const caseCount = lines.reduce((sum, l) => sum + l.cases, 0);
  return { lines, subtotalMinor, caseCount };
}

export const DEMO_ORDERS = orders;

export function demoOrdersForCompany(companyId: string) {
  return orders.filter((o) => o.companyId === companyId);
}

export function findDemoOrder(orderNumber: string) {
  return orders.find((o) => o.orderNumber === orderNumber);
}
