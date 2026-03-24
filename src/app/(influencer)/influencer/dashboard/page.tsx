import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SalesOverTimeChart } from "@/components/charts/SalesOverTimeChart";
import { RevenueByMonthChart } from "@/components/charts/RevenueByMonthChart";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function InfluencerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.influencerId) {
    redirect("/auth/signin");
  }

  const influencerId = session.user.influencerId;

  const influencer = await prisma.influencer.findUnique({
    where: { id: influencerId },
    select: { commissionRate: true, couponCode: true, displayName: true },
  });

  if (!influencer) {
    redirect("/auth/signin");
  }

  const commissionRate = Number(influencer.commissionRate);

  // Stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, monthOrders, allOrders] = await Promise.all([
    prisma.order.count({
      where: { influencerId, financialStatus: "paid" },
    }),
    prisma.order.count({
      where: {
        influencerId,
        financialStatus: "paid",
        processedAt: { gte: startOfMonth },
      },
    }),
    prisma.order.findMany({
      where: { influencerId, financialStatus: "paid" },
      select: { totalPrice: true, processedAt: true },
    }),
  ]);

  const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const estimatedCommission = totalRevenue * commissionRate;

  // Last 10 orders
  const recentOrders = await prisma.order.findMany({
    where: { influencerId },
    orderBy: { processedAt: "desc" },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      totalPrice: true,
      financialStatus: true,
      fulfillmentStatus: true,
      processedAt: true,
      customerEmail: true,
    },
  });

  // Daily sales for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPaidOrders = await prisma.order.findMany({
    where: {
      influencerId,
      financialStatus: "paid",
      processedAt: { gte: thirtyDaysAgo },
    },
    select: { totalPrice: true, processedAt: true },
    orderBy: { processedAt: "asc" },
  });

  // Build daily data map
  const dailyMap = new Map<string, { count: number; revenue: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    dailyMap.set(key, { count: 0, revenue: 0 });
  }

  for (const order of recentPaidOrders) {
    const key = new Date(order.processedAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const existing = dailyMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.revenue += Number(order.totalPrice);
    }
  }

  const dailyData = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    ...val,
  }));

  // Monthly data for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyOrders = await prisma.order.findMany({
    where: {
      influencerId,
      financialStatus: "paid",
      processedAt: { gte: sixMonthsAgo },
    },
    select: { totalPrice: true, processedAt: true },
  });

  const monthlyMap = new Map<string, { revenue: number; commission: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    monthlyMap.set(key, { revenue: 0, commission: 0 });
  }

  for (const order of monthlyOrders) {
    const key = new Date(order.processedAt).toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    const existing = monthlyMap.get(key);
    if (existing) {
      const rev = Number(order.totalPrice);
      existing.revenue += rev;
      existing.commission += rev * commissionRate;
    }
  }

  const monthlyData = Array.from(monthlyMap.entries()).map(([month, val]) => ({
    month,
    ...val,
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {influencer.displayName.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Aqui está um resumo das suas vendas e comissões.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total Vendas</span>
            <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">pedidos pagos no total</p>
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
          <p className="text-xs text-gray-500 mt-1">em vendas geradas</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Comissão Estimada</span>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(estimatedCommission)}</p>
          <p className="text-xs text-gray-500 mt-1">taxa: {(commissionRate * 100).toFixed(0)}%</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Pedidos Esse Mês</span>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{monthOrders}</p>
          <p className="text-xs text-gray-500 mt-1">pedidos em {now.toLocaleDateString("pt-BR", { month: "long" })}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia (últimos 30 dias)</CardTitle>
          </CardHeader>
          <SalesOverTimeChart data={dailyData} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Mês (últimos 6 meses)</CardTitle>
          </CardHeader>
          <RevenueByMonthChart data={monthlyData} />
        </Card>
      </div>

      {/* Recent Orders */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Pedidos Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Comissão Est.</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="text-gray-500">{order.customerEmail || "—"}</td>
                    <td className="font-medium">{formatCurrency(Number(order.totalPrice))}</td>
                    <td className="text-green-700 font-medium">
                      {formatCurrency(Number(order.totalPrice) * commissionRate)}
                    </td>
                    <td><Badge status={order.financialStatus} /></td>
                    <td className="text-gray-500">{formatDate(order.processedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
