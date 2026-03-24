import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncTenantOrders } from "@/lib/shopify-sync";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (session.user.role !== "BRAND_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { shopifyShopDomain: true, shopifyAccessToken: true },
  });

  if (!tenant?.shopifyShopDomain || !tenant?.shopifyAccessToken) {
    return NextResponse.json(
      {
        error:
          "Loja Shopify não configurada. Configure o domínio e o token de acesso nas Configurações antes de sincronizar.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await syncTenantOrders(tenantId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Erro durante a sincronização. Verifique as credenciais da Shopify." },
      { status: 500 }
    );
  }
}
