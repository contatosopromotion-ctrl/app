import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      name: true,
      shopifyShopDomain: true,
      shopifyAccessToken: true,
      lastSyncedAt: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (session.user.role !== "BRAND_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json();
  const { shopifyShopDomain, shopifyAccessToken } = body;

  const updated = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: {
      ...(shopifyShopDomain !== undefined && {
        shopifyShopDomain: shopifyShopDomain || null,
      }),
      ...(shopifyAccessToken !== undefined && {
        shopifyAccessToken: shopifyAccessToken || null,
      }),
    },
    select: {
      name: true,
      shopifyShopDomain: true,
      shopifyAccessToken: true,
      lastSyncedAt: true,
    },
  });

  return NextResponse.json(updated);
}
