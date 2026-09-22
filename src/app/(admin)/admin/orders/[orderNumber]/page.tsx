import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { WireReconcileAction } from "@/components/admin/wire-reconcile-action";
import { formatDate, formatMinorUsd } from "@/lib/utils";
import { guardPermission } from "@/modules/identity/guards";
import { getOrder, orderLabel, paymentLabel, paymentMethodLabel, statusTone } from "@/modules/orders/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

/** Staff view of one order with multi-payment method tracking and wire reconciliation. */
export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await guardPermission("orders.read");
  const { orderNumber } = await params;
  const order = await getOrder(orderNumber);
  if (!order) notFound();

  const isWirePending = order.paymentMethod === "WIRE" && order.paymentStatus === "UNPAID";

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Orders
      </Link>

      <PageHeading
        eyebrow={order.companyName}
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDate(order.placedAt)} by ${order.placedBy}.`}
        action={
          <span className="flex flex-wrap gap-2">
            <StatusPill tone={statusTone(order.paymentStatus, order.paymentMethod)}>
              {paymentLabel(order.paymentStatus, order.paymentMethod)}
            </StatusPill>
            <StatusPill tone={statusTone(order.status)}>{orderLabel(order.status)}</StatusPill>
          </span>
        }
      />

      {isWirePending && order.id ? (
        <div className="mb-6">
          <WireReconcileAction
            orderId={order.id}
            orderNumber={order.orderNumber}
            totalFormatted={formatMinorUsd(order.totalMinor)}
          />
        </div>
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
          <PanelHeader title="Order" />
          <PanelBody>
            <DefinitionList
              items={[
                {
                  term: "Customer",
                  value: (
                    <Link
                      href={`/admin/customers/${order.companyId}`}
                      className="text-primary underline underline-offset-4"
                    >
                      {order.companyName}
                    </Link>
                  ),
                },
                { term: "Placed by", value: order.placedBy },
                { term: "Placed", value: formatDate(order.placedAt) },
                { term: "PO number", value: order.poNumber ?? "Not provided" },
                { term: "Payment method", value: paymentMethodLabel(order.paymentMethod) },
                { term: "Payment status", value: paymentLabel(order.paymentStatus, order.paymentMethod) },
                ...(order.wireReference
                  ? [{ term: "Wire reference", value: <span className="font-mono">{order.wireReference}</span> }]
                  : []),
                { term: "Fulfillment", value: orderLabel(order.fulfillmentStatus) },
                ...(order.internalNotes
                  ? [{ term: "Internal notes", value: <span className="whitespace-pre-line text-xs font-mono">{order.internalNotes}</span> }]
                  : []),
              ]}
            />
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
