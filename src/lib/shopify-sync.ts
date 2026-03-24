import { prisma } from "@/lib/prisma";
import { createShopifyClient } from "@/lib/shopify";
import { Prisma } from "@prisma/client";

interface SyncResult {
  added: number;
  updated: number;
  errors: number;
  lastSyncedAt: Date;
}

export async function syncTenantOrders(
  tenantId: string,
  options: { full?: boolean } = {}
): Promise<SyncResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      influencers: {
        where: { isActive: true },
        select: { id: true, couponCode: true },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  if (!tenant.shopifyShopDomain || !tenant.shopifyAccessToken) {
    throw new Error("Shopify credentials not configured");
  }

  const client = createShopifyClient(tenant.shopifyShopDomain, tenant.shopifyAccessToken);

  let added = 0;
  let updated = 0;
  let errors = 0;

  // Determine date range for sync
  const createdAtMin =
    !options.full && tenant.lastSyncedAt
      ? new Date(tenant.lastSyncedAt.getTime() - 24 * 60 * 60 * 1000).toISOString()
      : undefined;

  for (const influencer of tenant.influencers) {
    try {
      let pageInfo: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await client.getOrders({
          financial_status: "paid",
          discount_code: influencer.couponCode,
          limit: 250,
          ...(pageInfo ? { page_info: pageInfo } : {}),
          ...(createdAtMin ? { created_at_min: createdAtMin } : {}),
        });

        for (const order of result.orders) {
          // Check if this order uses the influencer's coupon
          const hasInfluencerCoupon = order.discount_codes.some(
            (dc) => dc.code.toUpperCase() === influencer.couponCode.toUpperCase()
          );

          if (!hasInfluencerCoupon) continue;

          try {
            const existing = await prisma.order.findUnique({
              where: {
                tenantId_shopifyOrderId: {
                  tenantId,
                  shopifyOrderId: String(order.id),
                },
              },
            });

            await prisma.order.upsert({
              where: {
                tenantId_shopifyOrderId: {
                  tenantId,
                  shopifyOrderId: String(order.id),
                },
              },
              create: {
                tenantId,
                influencerId: influencer.id,
                shopifyOrderId: String(order.id),
                orderNumber: `#${order.order_number}`,
                couponCode: influencer.couponCode,
                customerEmail: order.email || null,
                subtotalPrice: new Prisma.Decimal(order.subtotal_price),
                totalDiscounts: new Prisma.Decimal(order.total_discounts || "0"),
                totalPrice: new Prisma.Decimal(order.total_price),
                currency: order.currency || "BRL",
                financialStatus: order.financial_status,
                fulfillmentStatus: order.fulfillment_status || null,
                processedAt: new Date(order.processed_at),
              },
              update: {
                financialStatus: order.financial_status,
                fulfillmentStatus: order.fulfillment_status || null,
                totalPrice: new Prisma.Decimal(order.total_price),
                totalDiscounts: new Prisma.Decimal(order.total_discounts || "0"),
              },
            });

            if (existing) {
              updated++;
            } else {
              added++;
            }
          } catch (err) {
            console.error(`Error upserting order ${order.id}:`, err);
            errors++;
          }
        }

        pageInfo = result.nextPageInfo;
        hasMore = !!pageInfo;
      }
    } catch (err) {
      console.error(`Error syncing influencer ${influencer.id}:`, err);
      errors++;
    }
  }

  const lastSyncedAt = new Date();
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { lastSyncedAt },
  });

  return { added, updated, errors, lastSyncedAt };
}
