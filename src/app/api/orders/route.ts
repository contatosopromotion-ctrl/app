import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const role = session.user.role;
  const searchParams = req.nextUrl.searchParams;

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "15")));

  const where: {
    tenantId: string;
    influencerId?: string;
    processedAt?: { gte?: Date; lte?: Date };
  } = { tenantId };

  // Influencers can only see their own orders
  if (role === "INFLUENCER") {
    if (!session.user.influencerId) {
      return NextResponse.json({ orders: [], total: 0, page, pageSize, totalPages: 0 });
    }
    where.influencerId = session.user.influencerId;
  }

  if (from || to) {
    where.processedAt = {};
    if (from) where.processedAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.processedAt.lte = toDate;
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { processedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        totalPrice: true,
        subtotalPrice: true,
        totalDiscounts: true,
        financialStatus: true,
        fulfillmentStatus: true,
        processedAt: true,
        couponCode: true,
        influencer: {
          select: { displayName: true, couponCode: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      totalPrice: o.totalPrice.toString(),
      subtotalPrice: o.subtotalPrice.toString(),
      totalDiscounts: o.totalDiscounts.toString(),
    })),
    total,
    page,
    pageSize,
    totalPages,
  });
}
