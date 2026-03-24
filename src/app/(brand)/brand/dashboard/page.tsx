import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { RevenueByMonthChart } from "@/components/charts/RevenueByMonthChart";
import { TopInfluencersChart } from "@/components/charts/TopInfluencersChart";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function BrandDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    redirect("/auth/signin");
  }

  const tenantId = session.user.tenantId;

  const [activeInfluencers, allOrders, influencersWithStats] = await Promise.all([
    prisma.influencer.count({
      where: { tenantId, isActive: true },
    }),
    prisma.order.findMany({
      where: { tenantId, financialStatus: "paid" },
      select: { totalPrice: true, processedAt: true, influencerId: true },
    }),
    prisma.influencer.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        displayName: true,
        couponCode: true,
        commissionRate: true,
        orders: {
          where: { financialStatus: "paid" },
          select: { totalPrice: true },
        },
      },
    }),
  ]);

  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);

  // Calculate total commissions owed
  const totalCommissions = influencersWithStats.reduce((sum, inf) => {
    const rev = inf.orders.reduce((s, o) => s + Number(o.totalPrice), 0);
    return sum + rev * Number(inf.commissionRate);
  }, 0);

  // Top 5 influencers by revenue
  const topInfluencers = influencersWithStats
    .map((inf) => ({
      name: inf.displayName,
      revenue: inf.orders.reduce((s, o) => s + Number(o.totalPrice), 0),
      commission: inf.orders.reduce((s, o) => s + Number(o.totalPrice) * Number(inf.commissionRate), 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Monthly revenue last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyOrders = allOrders.filter(
    (o) => new Date(o.processedAt) >= sixMonthsAgo
  );

  const monthlyMap = new Map<string, { revenue: number; commission: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    monthlyMap.set(key, { revenue: 0, commission: 0 });
  }

  // For monthly chart, use average commission rate (10%) as approximation
  for (const order of monthlyOrders) {
    const key = new Date(order.processedAt).toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    const inf = influencersWithStats.find((i) => i.id === order.influencerId);
    const rate = inf ? Number(inf.commissionRate) : 0.1;
    const existing = monthlyMap.get(key);
    if (existing) {
      const rev = Number(order.totalPrice);
      existing.revenue += rev;
      existing.commission += rev * rate;
    }
  }

  const monthlyData = Array.from(monthlyMap.entries()).map(([month, val]) => ({
    month,
    ...val,
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard da Marca</h1>
        <p className="text-gray-500 mt-1">Visão geral do desempenho dos seus influenciadores.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Influenciadores Ativos</span>
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeInfluencers}</p>
          <p className="text-xs text-gray-500 mt-1">influenciadores parceiros</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Receita Total</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">gerada por influenciadores</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Comissões a Pagar</span>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCommissions)}</p>
          <p className="text-xs text-gray-500 mt-1">estimativa total</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total de Pedidos</span>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{allOrders.length}</p>
          <p className="text-xs text-gray-500 mt-1">pedidos pagos no total</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Influenciadores por Receita</CardTitle>
          </CardHeader>
          <TopInfluencersChart data={topInfluencers} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Mês (últimos 6 meses)</CardTitle>
          </CardHeader>
          <RevenueByMonthChart data={monthlyData} />
        </Card>
      </div>
    </div>
  );
}
