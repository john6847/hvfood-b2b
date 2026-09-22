"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import {
  BUSINESS_TYPES,
  ESTIMATED_VOLUMES,
  US_STATES,
  wholesaleApplicationSchema,
  type WholesaleApplicationInput,
} from "@/modules/accounts/schemas";
import { submitWholesaleApplicationAction } from "@/app/(public)/wholesale/apply/actions";

const PRODUCT_OPTIONS = [
  "Specialty Sauces & Condiments",
  "Plantain Chips & Snacks",
  "Flours, Grains & Staples",
  "Spices & Seasoning Blends",
  "Specialty Tropical Beverages",
  "Bulk Dried Fruits & Provisions",
];

export function ApplicationForm() {
  const [isPending, startTransition] = useTransition();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<WholesaleApplicationInput>({
    firstName: "",
    lastName: "",
    businessName: "",
    email: "",
    phone: "",
    website: "",
    businessType: "RETAIL",
    street1: "",
    street2: "",
    city: "",
    state: "FL",
    postalCode: "",
    businessNumber: "",
    estimatedMonthlyVolume: ESTIMATED_VOLUMES[0],
    productsInterestedIn: [],
    applicantNotes: "",
  });

  const handleChange = (field: keyof WholesaleApplicationInput, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setFormError(null);
  };

  const handleProductToggle = (product: string) => {
    setFormData((prev) => {
      const exists = prev.productsInterestedIn.includes(product);
      return {
        ...prev,
        productsInterestedIn: exists
          ? prev.productsInterestedIn.filter((p) => p !== product)
          : [...prev.productsInterestedIn, product],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const result = wholesaleApplicationSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = String(err.path[0]);
        if (!errors[key]) {
          errors[key] = err.message;
        }
      });
      setFieldErrors(errors);
      setFormError("Please correct the highlighted fields before submitting.");
      return;
    }

    startTransition(async () => {
      const res = await submitWholesaleApplicationAction(result.data);
      if (res.success && res.applicationId) {
        setSubmittedId(res.applicationId);
      } else {
        setFormError(res.error || "An unexpected error occurred. Please try again.");
      }
    });
  };

  if (submittedId) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground sm:text-2xl">
          Application Received
        </h2>
        <p className="mt-2 text-sm text-foreground-muted sm:text-base">
          Thank you for applying for a wholesale account with Horizon Vert Foods.
        </p>

        <div className="mx-auto mt-6 max-w-md rounded-md border border-border/80 bg-surface-subtle p-4 text-left text-xs sm:text-sm text-foreground-muted">
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="font-medium text-foreground">Business:</span>
            <span>{formData.businessName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="font-medium text-foreground">Contact:</span>
            <span>{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-medium text-foreground">Email:</span>
            <span>{formData.email}</span>
          </div>
        </div>

        <div className="mt-8 text-xs text-foreground-subtle">
          Our wholesale team reviews applications within 1 to 2 business days. You will receive an
          activation email with your personalized invitation link once approved.
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/wholesale/catalog"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            Explore Public Catalog
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {formError && (
        <Notice tone="danger" title="Submission Error">
          {formError}
        </Notice>
      )}

      {/* 1. Contact Person */}
      <section className="space-y-4">
        <h2 className="border-b border-border pb-2 text-md font-semibold text-foreground">
          1. Applicant & Contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" htmlFor="firstName" error={fieldErrors.firstName}>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              placeholder="e.g. Jean"
              required
              aria-invalid={!!fieldErrors.firstName}
            />
          </Field>
          <Field label="Last Name" htmlFor="lastName" error={fieldErrors.lastName}>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              placeholder="e.g. Martin"
              required
              aria-invalid={!!fieldErrors.lastName}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Work Email" htmlFor="email" error={fieldErrors.email} hint="Used for your sign-in invitation and orders">
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="orders@yourbusiness.com"
              required
              aria-invalid={!!fieldErrors.email}
            />
          </Field>
          <Field label="Phone Number" htmlFor="phone" error={fieldErrors.phone}>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(305) 555-0142"
              required
              aria-invalid={!!fieldErrors.phone}
            />
          </Field>
        </div>
      </section>

      {/* 2. Business Profile */}
      <section className="space-y-4">
        <h2 className="border-b border-border pb-2 text-md font-semibold text-foreground">
          2. Business Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal or Operating Business Name" htmlFor="businessName" error={fieldErrors.businessName}>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="e.g. Caribbean Table Inc."
              required
              aria-invalid={!!fieldErrors.businessName}
            />
          </Field>
          <Field label="Business Type" htmlFor="businessType" error={fieldErrors.businessType}>
            <Select
              id="businessType"
              value={formData.businessType}
              onChange={(e) => handleChange("businessType", e.target.value)}
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website / Social Link" htmlFor="website" error={fieldErrors.website} hint="Optional">
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleChange("website", e.target.value)}
              placeholder="www.yourcompany.com"
              aria-invalid={!!fieldErrors.website}
            />
          </Field>
          <Field
            label="Tax ID / EIN or Resale Certificate #"
            htmlFor="businessNumber"
            error={fieldErrors.businessNumber}
            hint="For tax exemption or credit eligibility verification"
          >
            <Input
              id="businessNumber"
              value={formData.businessNumber}
              onChange={(e) => handleChange("businessNumber", e.target.value)}
              placeholder="e.g. 12-3456789 or FL-RES-001"
            />
          </Field>
        </div>
      </section>

      {/* 3. Physical & Delivery Address */}
      <section className="space-y-4">
        <h2 className="border-b border-border pb-2 text-md font-semibold text-foreground">
          3. Receiving / Primary Address
        </h2>
        <Field label="Street Address" htmlFor="street1" error={fieldErrors.street1}>
          <Input
            id="street1"
            value={formData.street1}
            onChange={(e) => handleChange("street1", e.target.value)}
            placeholder="123 Commerce Way"
            required
            aria-invalid={!!fieldErrors.street1}
          />
        </Field>

        <Field label="Suite / Unit / Dock #" htmlFor="street2" hint="Optional">
          <Input
            id="street2"
            value={formData.street2}
            onChange={(e) => handleChange("street2", e.target.value)}
            placeholder="Suite 400"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City" htmlFor="city" error={fieldErrors.city}>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              placeholder="Orlando"
              required
              aria-invalid={!!fieldErrors.city}
            />
          </Field>
          <Field label="State" htmlFor="state" error={fieldErrors.state}>
            <Select
              id="state"
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
            >
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="ZIP Code" htmlFor="postalCode" error={fieldErrors.postalCode}>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleChange("postalCode", e.target.value)}
              placeholder="32801"
              required
              maxLength={10}
              aria-invalid={!!fieldErrors.postalCode}
            />
          </Field>
        </div>
      </section>

      {/* 4. Commercial Intent */}
      <section className="space-y-4">
        <h2 className="border-b border-border pb-2 text-md font-semibold text-foreground">
          4. Commercial Ordering Intent
        </h2>
        <Field label="Estimated Monthly Case Volume" htmlFor="estimatedMonthlyVolume">
          <Select
            id="estimatedMonthlyVolume"
            value={formData.estimatedMonthlyVolume}
            onChange={(e) => handleChange("estimatedMonthlyVolume", e.target.value)}
          >
            {ESTIMATED_VOLUMES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Product lines you are interested in (select all that apply):
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {PRODUCT_OPTIONS.map((prod) => {
              const checked = formData.productsInterestedIn.includes(prod);
              return (
                <label
                  key={prod}
                  className="flex items-center gap-2.5 rounded-md border border-border/70 bg-surface px-3 py-2 text-xs sm:text-sm text-foreground hover:bg-surface-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleProductToggle(prod)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>{prod}</span>
                </label>
              );
            })}
          </div>
        </div>

        <Field label="Receiving or Delivery Notes" htmlFor="applicantNotes" hint="Optional: loading dock, liftgate requirements, receiving hours, etc.">
          <Textarea
            id="applicantNotes"
            value={formData.applicantNotes}
            onChange={(e) => handleChange("applicantNotes", e.target.value)}
            placeholder="e.g. Loading dock on side alley, delivery hours 8am - 2pm."
            rows={3}
          />
        </Field>
      </section>

      <div className="pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Application...
            </>
          ) : (
            "Submit Wholesale Application"
          )}
        </Button>
      </div>
    </form>
  );
}
