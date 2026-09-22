import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate, formatMinorUsd } from "@/lib/utils";
import { orderLabel, paymentLabel, statusTone, type OrderSummary } from "@/modules/orders/queries";

/**
 * Shared order list for the buyer portal and the admin. The admin variant
 * adds the customer column; the buyer variant shows who placed the order.
 */
export function OrderTable({
  orders,
  basePath,
  showCustomer = false,
}: {
  orders: readonly OrderSummary[];
  basePath: string;
  showCustomer?: boolean;
}) {
  return (
    <TableScroll>
      <Table className="min-w-[620px]">
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Date</Th>
            <Th>{showCustomer ? "Customer" : "Placed by"}</Th>
            <Th>Payment</Th>
            <Th>Fulfillment</Th>
            <Th className="text-right">Cases</Th>
            <Th className="text-right">Total</Th>
            <Th>
              <span className="sr-only">Open</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <Tr key={order.orderNumber}>
              <Td>
                <Link
                  href={`${basePath}/${order.orderNumber}`}
                  className="font-medium hover:underline hover:underline-offset-4"
                >
                  {order.orderNumber}
                </Link>
                {order.poNumber ? (
                  <span className="block text-xs text-foreground-muted">{order.poNumber}</span>
                ) : null}
              </Td>
              <Td className="text-foreground-muted">{formatDate(order.placedAt)}</Td>
              <Td>
                {showCustomer ? (
                  <>
                    {order.companyName}
                    <span className="block text-xs text-foreground-muted">{order.placedBy}</span>
                  </>
                ) : (
                  order.placedBy
                )}
              </Td>
              <Td>
                <StatusPill tone={statusTone(order.paymentStatus, order.paymentMethod)}>
                  {paymentLabel(order.paymentStatus, order.paymentMethod)}
                </StatusPill>
                {order.paymentMethod ? (
                  <span className="block text-3xs text-foreground-muted mt-0.5">
                    {order.paymentMethod === "CARD" ? "Card" : order.paymentMethod === "ACH" ? "ACH" : "Wire"}
                  </span>
                ) : null}
              </Td>
              <Td>
                <StatusPill tone={statusTone(order.status)}>{orderLabel(order.status)}</StatusPill>
              </Td>
              <Td className="tabular text-right">{order.caseCount}</Td>
              <Td className="tabular text-right font-medium">{formatMinorUsd(order.totalMinor)}</Td>
              <Td className="text-right">
                <Link
                  href={`${basePath}/${order.orderNumber}`}
                  aria-label={`Open order ${order.orderNumber}`}
                  className="inline-flex text-foreground-muted hover:text-foreground"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  );
}
