import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculatePayoutBatch } from "@/lib/payout";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (session.user.role !== "BRAND_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const searchParams = req.nextUrl.searchParams;

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Parâmetros 'from' e 'to' são obrigatórios" },
      { status: 400 }
    );
  }

  const periodStart = new Date(from);
  const periodEnd = new Date(to);
  periodEnd.setHours(23, 59, 59, 999);

  const result = await calculatePayoutBatch(tenantId, periodStart, periodEnd);

  return NextResponse.json(result);
}
