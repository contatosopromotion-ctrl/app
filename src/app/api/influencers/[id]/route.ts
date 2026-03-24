import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { id } = params;

  const influencer = await prisma.influencer.findFirst({
    where: { id, tenantId },
    include: {
      _count: {
        select: { orders: { where: { financialStatus: "paid" } } },
      },
      orders: {
        where: { financialStatus: "paid" },
        select: { totalPrice: true },
      },
    },
  });

  if (!influencer) {
    return NextResponse.json({ error: "Influenciador não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: influencer.id,
    displayName: influencer.displayName,
    email: influencer.email,
    couponCode: influencer.couponCode,
    commissionRate: Number(influencer.commissionRate),
    pixKey: influencer.pixKey,
    bankName: influencer.bankName,
    bankAccount: influencer.bankAccount,
    isActive: influencer.isActive,
    notes: influencer.notes,
    orderCount: influencer._count.orders,
    totalRevenue: influencer.orders.reduce((sum, o) => sum + Number(o.totalPrice), 0),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (session.user.role !== "BRAND_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const { id } = params;

  const existing = await prisma.influencer.findFirst({ where: { id, tenantId } });
  if (!existing) {
    return NextResponse.json({ error: "Influenciador não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const {
    displayName,
    email,
    couponCode,
    commissionRate,
    pixKey,
    bankName,
    bankAccount,
    notes,
    isActive,
  } = body;

  // Check coupon uniqueness if changing
  if (couponCode && couponCode !== existing.couponCode) {
    const existingCoupon = await prisma.influencer.findFirst({
      where: { tenantId, couponCode, NOT: { id } },
    });
    if (existingCoupon) {
      return NextResponse.json({ error: "Este cupom já está sendo usado" }, { status: 400 });
    }
  }

  const updated = await prisma.influencer.update({
    where: { id },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(email !== undefined && { email }),
      ...(couponCode !== undefined && { couponCode: couponCode.toUpperCase() }),
      ...(commissionRate !== undefined && {
        commissionRate: new Prisma.Decimal(commissionRate),
      }),
      ...(pixKey !== undefined && { pixKey: pixKey || null }),
      ...(bankName !== undefined && { bankName: bankName || null }),
      ...(bankAccount !== undefined && { bankAccount: bankAccount || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (session.user.role !== "BRAND_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const { id } = params;

  const existing = await prisma.influencer.findFirst({ where: { id, tenantId } });
  if (!existing) {
    return NextResponse.json({ error: "Influenciador não encontrado" }, { status: 404 });
  }

  // Soft delete
  await prisma.influencer.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
