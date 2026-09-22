/**
 * Corporate Wire Transfer Instructions & Configuration for Horizon Vert Foods B2B.
 */

export type WireInstructions = {
  beneficiaryName: string;
  bankName: string;
  bankAddress: string;
  routingNumber: string;
  accountNumber: string;
  swiftBic: string;
  currency: string;
  instructions: string;
};

export const HORIZON_VERT_WIRE_DETAILS: WireInstructions = {
  beneficiaryName: "Horizon Vert Foods LLC",
  bankName: "JPMorgan Chase Bank, N.A.",
  bankAddress: "Commercial Banking Center, 200 S Biscayne Blvd, Miami, FL 33131",
  routingNumber: "065200171",
  accountNumber: "9876543210",
  swiftBic: "CHASUS33",
  currency: "USD",
  instructions:
    "Please include your Wire Reference in the wire remittance memo (Field 70). Domestic wires typically settle within same-day or 24 hours. Your order is reserved and will begin fulfillment once funds are confirmed.",
};
