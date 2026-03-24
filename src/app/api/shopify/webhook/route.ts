import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function verifyShopifyHmac(
  body: string,
  hmacHeader: string,
  secret: string
): Promise<boolean> {
  const hash = crypto
    .createHmac("sha256", secret)
    .update(body, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}

export async function POST(req: NextRequest) {
  const shopDomain = req.headers.get("x-shopify-shop-domain");
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic");

  if (!shopDomain || !hmacHeader) {
    return NextResponse.json({ error: "Headers ausentes" }, { status: 400 });
  }

  // Find tenant by shop domain
  const tenant = await prisma.tenant.findUnique({
    where: { shopifyShopDomain: shopDomain },
    select: {
      id: true,
      shopifyWebhookSecret: true,
      influencers: {
        where: { isActive: true },
        select: { id: true, couponCode: true },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }

  // Verify HMAC if secret is configured
  const rawBody = await req.text();
  if (tenant.shopifyWebhookSecret) {
    const isValid = await verifyShopifyHmac(rawBody, hmacHeader, tenant.shopifyWebhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }
  }

  if (topic !== "orders/paid") {
    return NextResponse.json({ message: "Evento ignorado" });
  }

  let order: {
    id: number;
    order_number: number;
    discount_codes?: Array<{ code: string }>;
    email?: string;
    subtotal_price: string;
    total_discounts: string;
    total_price: string;
    currency: string;
    financial_status: string;
    fulfillment_status?: string;
    processed_at: string;
  };

  try {
    order = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const discountCodes = order.discount_codes?.map((d: { code: string }) => d.code.toUpperCase()) || [];

  // Find matching influencer
  const matchingInfluencer = tenant.influencers.find((inf) =>
    discountCodes.includes(inf.couponCode.toUpperCase())
  );

  if (!matchingInfluencer) {
    return NextResponse.json({ message: "Nenhum cupom de influenciador encontrado" });
  }

  const couponCode = matchingInfluencer.couponCode;

  await prisma.order.upsert({
    where: {
      tenantId_shopifyOrderId: {
        tenantId: tenant.id,
        shopifyOrderId: String(order.id),
      },
    },
    create: {
      tenantId: tenant.id,
      influencerId: matchingInfluencer.id,
      shopifyOrderId: String(order.id),
      orderNumber: `#${order.order_number}`,
      couponCode,
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

  return NextResponse.json({ message: "Pedido processado com sucesso" });
}
