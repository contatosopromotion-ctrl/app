import type { PayoutLineItemResult } from "@/lib/payout";

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function payoutBatchToCSV(lineItems: PayoutLineItemResult[]): string {
  const headers = [
    "Nome",
    "Email",
    "Cupom",
    "Chave PIX",
    "Pedidos",
    "Receita Total",
    "Taxa Comissão",
    "Comissão a Pagar",
  ];

  const rows = lineItems.map((item) => [
    escapeCsvField(item.influencer.displayName),
    escapeCsvField(item.influencer.email),
    escapeCsvField(item.influencer.couponCode),
    escapeCsvField(item.influencer.pixKey),
    escapeCsvField(item.orderCount),
    escapeCsvField(item.totalRevenue.toFixed(2)),
    escapeCsvField(`${(item.commissionRate * 100).toFixed(1)}%`),
    escapeCsvField(item.commissionOwed.toFixed(2)),
  ]);

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ];

  // Add BOM for Excel UTF-8 compatibility
  return "\uFEFF" + csvLines.join("\n");
}
