import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteInfluencerButton } from "./DeleteInfluencerButton";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function BrandInfluencersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.tenantId) {
    redirect("/auth/signin");
  }

  const tenantId = session.user.tenantId;
  const search = searchParams.q || "";

  const influencers = await prisma.influencer.findMany({
    where: {
      tenantId,
      ...(search
        ? {
            OR: [
              { displayName: { contains: search } },
              { couponCode: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    },
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

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Influenciadores</h1>
          <p className="text-gray-500 mt-1">Gerencie seus parceiros influenciadores.</p>
        </div>
        <Link href="/brand/influencers/new">
          <Button variant="primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Influenciador
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <form method="GET" className="flex gap-3">
          <input
            name="q"
            defaultValue={search}
            placeholder="Buscar por nome, e-mail ou cupom..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button type="submit" variant="primary">Buscar</Button>
          {search && (
            <Link href="/brand/influencers">
              <Button type="button" variant="outline">Limpar</Button>
            </Link>
          )}
        </form>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cupom</th>
                <th>Comissão</th>
                <th>Pedidos</th>
                <th>Receita Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {influencers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-10">
                    {search ? "Nenhum influenciador encontrado para a busca." : "Nenhum influenciador cadastrado ainda."}
                  </td>
                </tr>
              ) : (
                influencers.map((inf) => {
                  const totalRevenue = inf.orders.reduce(
                    (sum, o) => sum + Number(o.totalPrice),
                    0
                  );
                  return (
                    <tr key={inf.id}>
                      <td className="font-medium text-gray-900">{inf.displayName}</td>
                      <td className="text-gray-500 text-xs">{inf.email}</td>
                      <td>
                        <span className="font-mono text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded">
                          {inf.couponCode}
                        </span>
                      </td>
                      <td className="font-medium">
                        {(Number(inf.commissionRate) * 100).toFixed(0)}%
                      </td>
                      <td>{inf._count.orders}</td>
                      <td className="font-medium">{formatCurrency(totalRevenue)}</td>
                      <td>
                        <Badge status={inf.isActive ? "active" : "inactive"} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link href={`/brand/influencers/${inf.id}`}>
                            <Button variant="outline" size="sm">Editar</Button>
                          </Link>
                          <DeleteInfluencerButton
                            id={inf.id}
                            name={inf.displayName}
                            isActive={inf.isActive}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
          {influencers.length} influenciador{influencers.length !== 1 ? "es" : ""} encontrado{influencers.length !== 1 ? "s" : ""}
        </div>
      </Card>
    </div>
  );
}
