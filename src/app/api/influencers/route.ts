import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;

  const influencers = await prisma.influencer.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { orders: { where: { financialStatus: "paid" } } },
      },
      orders: {
        where: { financialStatus: "paid" },
        select: { totalPrice: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = influencers.map((inf) => ({
    id: inf.id,
    displayName: inf.displayName,
    email: inf.email,
    couponCode: inf.couponCode,
    commissionRate: Number(inf.commissionRate),
    pixKey: inf.pixKey,
    bankName: inf.bankName,
    bankAccount: inf.bankAccount,
    isActive: inf.isActive,
    notes: inf.notes,
    orderCount: inf._count.orders,
    totalRevenue: inf.orders.reduce((sum, o) => sum + Number(o.totalPrice), 0),
    createdAt: inf.createdAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (session.user.role !== "BRAND_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const body = await req.json();

  const {
    displayName,
    email,
    password,
    couponCode,
    commissionRate,
    pixKey,
    bankName,
    bankAccount,
    notes,
  } = body;

  if (!displayName || !email || !password || !couponCode || commissionRate === undefined) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  // Check if email or coupon already exists
  const [existingUser, existingCoupon] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.influencer.findFirst({ where: { tenantId, couponCode } }),
  ]);

  if (existingUser) {
    return NextResponse.json({ error: "Este e-mail já está em uso" }, { status: 400 });
  }

  if (existingCoupon) {
    return NextResponse.json({ error: "Este cupom já está sendo usado" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: displayName,
      role: "INFLUENCER",
      tenantId,
    },
  });

  const influencer = await prisma.influencer.create({
    data: {
      tenantId,
      userId: user.id,
      displayName,
      email,
      couponCode: couponCode.toUpperCase(),
      commissionRate: new Prisma.Decimal(commissionRate),
      pixKey: pixKey || null,
      bankName: bankName || null,
      bankAccount: bankAccount || null,
      notes: notes || null,
      isActive: true,
    },
  });

  return NextResponse.json(influencer, { status: 201 });
}
