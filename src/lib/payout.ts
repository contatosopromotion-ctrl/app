import { prisma } from "@/lib/prisma";

export interface PayoutLineItemResult {
  influencer: {
    id: string;
    displayName: string;
    email: string;
    couponCode: string;
    pixKey: string | null;
    bankName: string | null;
  };
  orderCount: number;
  totalRevenue: number;
  commissionRate: number;
  commissionOwed: number;
}

export async function calculatePayoutBatch(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayoutLineItemResult[]> {
  const influencers = await prisma.influencer.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      displayName: true,
      email: true,
      couponCode: true,
      commissionRate: true,
      pixKey: true,
      bankName: true,
    },
  });

  const results: PayoutLineItemResult[] = [];

  for (const influencer of influencers) {
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        influencerId: influencer.id,
        financialStatus: "paid",
        processedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: { totalPrice: true },
    });

    if (orders.length === 0) continue;

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const commissionRate = Number(influencer.commissionRate);
    const commissionOwed = totalRevenue * commissionRate;

    results.push({
      influencer: {
        id: influencer.id,
        displayName: influencer.displayName,
        email: influencer.email,
        couponCode: influencer.couponCode,
        pixKey: influencer.pixKey,
        bankName: influencer.bankName,
      },
      orderCount: orders.length,
      totalRevenue,
      commissionRate,
      commissionOwed,
    });
  }

  // Sort by commission owed descending
  results.sort((a, b) => b.commissionOwed - a.commissionOwed);

  return results;
}
