import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { WireRemittanceVoucher } from "@/components/commerce/wire-voucher";
import { formatDate, formatMinorUsd } from "@/lib/utils";
import { getOrder, orderLabel, paymentLabel, paymentMethodLabel, statusTone } from "@/modules/orders/queries";
import { getActiveMembership } from "@/modules/identity/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

/** Order detail for the buying company. Scoped to the active membership. */
export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams?: Promise<{ wire?: string }>;
}) {
  const membership = await getActiveMembership();
  if (!membership) redirect("/wholesale/dashboard");

  const { orderNumber } = await params;
  const sp = searchParams ? await searchParams : {};
  const isWireJustPlaced = sp.wire === "1";

  const order = await getOrder(orderNumber);
  if (!order || order.companyId !== membership.companyId) notFound();

  const isWirePending = order.paymentMethod === "WIRE" && order.paymentStatus === "UNPAID";

  return (
    <>
      <Link
        href="/wholesale/orders"
        className="mb-4 inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground print:hidden"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Orders
      </Link>

      <PageHeading
        eyebrow={formatDate(order.placedAt)}
        title={`Order ${order.orderNumber}`}
        description={`Placed by ${order.placedBy}.`}
        action={
          <span className="flex flex-wrap gap-2">
            <StatusPill tone={statusTone(order.paymentStatus, order.paymentMethod)}>
              {paymentLabel(order.paymentStatus, order.paymentMethod)}
            </StatusPill>
            <StatusPill tone={statusTone(order.status)}>{orderLabel(order.status)}</StatusPill>
          </span>
        }
      />

      {isWireJustPlaced ? (
        <Notice tone="success" className="mb-6 print:hidden" title="Order Placed Successfully!">
          Your order has been registered and merchandise is reserved. Please initiate the bank wire
          transfer below to complete fulfillment.
        </Notice>
      ) : null}

      {isWirePending ? (
        <div className="mb-6">
          <WireRemittanceVoucher
            orderNumber={order.orderNumber}
            wireReference={order.wireReference}
            totalMinor={order.totalMinor}
            companyName={membership.companyDisplayName}
          />
        </div>
      ) : null}

      {order.paymentStatus === "PROCESSING" && order.paymentMethod === "ACH" ? (
        <Notice tone="warning" className="mb-6 print:hidden" title="ACH Payment Processing">
          Bank payments typically take 1–3 business days to clear. Your order is reserved and stays on hold
          until the payment confirms.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Items" description={`${order.caseCount} cases`} />
          <TableScroll>
            <Table className="min-w-[480px]">
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th className="text-right">Cases</Th>
                  <Th className="text-right">Price per case</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line) => (
                  <Tr key={line.productSlug}>
                    <Td>
                      <span className="flex items-center gap-3">
                        {line.image ? (
                          <span className="relative size-10 shrink-0 overflow-hidden rounded-sm bg-surface-muted">
                            <Image
                              src={line.image}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-contain p-1"
                            />
                          </span>
                        ) : null}
                        <span>
                          <span className="block font-medium text-foreground">{line.name}</span>
                          <span className="block text-xs text-foreground-muted">
                            {line.sku} · {line.pack}
                          </span>
                        </span>
                      </span>
                    </Td>
                    <Td className="tabular text-right">{line.cases}</Td>
                    <Td className="tabular text-right">{formatMinorUsd(line.unitPriceMinor)}</Td>
                    <Td className="tabular text-right font-medium">
                      {formatMinorUsd(line.totalMinor)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
          <PanelBody className="flex items-center justify-between border-t border-border">
            <span className="text-sm text-foreground-muted">Merchandise subtotal</span>
            <span className="tabular text-md font-semibold text-foreground">
              {formatMinorUsd(order.totalMinor)}
            </span>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Summary" />
          <PanelBody>
            <DefinitionList
              items={[
                { term: "Order number", value: order.orderNumber },
                { term: "Placed", value: formatDate(order.placedAt) },
                { term: "Placed by", value: order.placedBy },
                { term: "PO number", value: order.poNumber ?? "Not provided" },
                { term: "Payment method", value: paymentMethodLabel(order.paymentMethod) },
                { term: "Payment status", value: paymentLabel(order.paymentStatus, order.paymentMethod) },
                ...(order.wireReference
                  ? [{ term: "Wire reference", value: <span className="font-mono">{order.wireReference}</span> }]
                  : []),
                { term: "Fulfillment", value: orderLabel(order.fulfillmentStatus) },
              ]}
            />
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
