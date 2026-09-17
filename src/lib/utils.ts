import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats integer minor units (cents) as USD. Never uses float math on money. */
export function formatMinorUsd(minor: number | bigint): string {
  const value = typeof minor === "bigint" ? minor : BigInt(Math.trunc(minor));
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const dollars = abs / 100n;
  const cents = abs % 100n;
  const grouped = dollars.toLocaleString("en-US");
  return `${negative ? "-" : ""}$${grouped}.${cents.toString().padStart(2, "0")}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Only allow same-origin relative redirect targets. */
export function safeNextPath(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
