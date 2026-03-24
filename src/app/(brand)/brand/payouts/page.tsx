"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PayoutLineItem {
  influencer: {
    id: string;
    displayName: string;
    email: string;
    couponCode: string;
    pixKey: string | null;
    bankName: string | null;
  };
  orderCount: number;
  totalRevenue: number;
  commissionRate: number;
  commissionOwed: number;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getDefaultDates() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: firstDay.toISOString().split("T")[0],
    to: lastDay.toISOString().split("T")[0],
  };
}

export default function BrandPayoutsPage() {
  const defaults = getDefaultDates();
  const [fromDate, setFromDate] = useState(defaults.from);
  const [toDate, setToDate] = useState(defaults.to);
  const [data, setData] = useState<PayoutLineItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCalculate() {
    if (!fromDate || !toDate) {
      setError("Selecione um período válido.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: fromDate, to: toDate });
      const res = await fetch(`/api/payouts?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setError(err.error || "Erro ao calcular pagamentos.");
      }
    } catch {
      setError("Erro ao calcular pagamentos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    const params = new URLSearchParams({ from: fromDate, to: toDate });
    window.location.href = `/api/payouts/export?${params}`;
  }

  const totalCommission = data?.reduce((sum, item) => sum + item.commissionOwed, 0) ?? 0;
  const totalRevenue = data?.reduce((sum, item) => sum + item.totalRevenue, 0) ?? 0;
  const totalOrders = data?.reduce((sum, item) => sum + item.orderCount, 0) ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-500 mt-1">Calcule e exporte comissões por período.</p>
      </div>

      {/* Period selector */}
      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Selecionar Período</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-40">
            <Input
              label="Data início"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="min-w-40">
            <Input
              label="Data fim"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleCalculate}
            disabled={loading}
          >
            {loading ? "Calculando..." : "Calcular Comissões"}
          </Button>
          {data && data.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </Card>

      {data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <p className="text-sm text-gray-500 mb-1">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-500 mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="stat-card border-brand-200 bg-brand-50">
              <p className="text-sm text-brand-600 mb-1 font-medium">Total a Pagar</p>
              <p className="text-2xl font-bold text-brand-700">{formatCurrency(totalCommission)}</p>
            </div>
          </div>

          {/* Table */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Detalhamento por Influenciador
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Período: {new Date(fromDate).toLocaleDateString("pt-BR")} – {new Date(toDate).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cupom</th>
                    <th>Pedidos</th>
                    <th>Receita</th>
                    <th>Taxa</th>
                    <th>Comissão</th>
                    <th>Chave PIX</th>
                    <th>Banco</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-gray-400 py-10">
                        Nenhum pedido encontrado no período selecionado.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.influencer.id}>
                        <td>
                          <div className="font-medium text-gray-900">{item.influencer.displayName}</div>
                          <div className="text-xs text-gray-500">{item.influencer.email}</div>
                        </td>
                        <td>
                          <span className="font-mono text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded">
                            {item.influencer.couponCode}
                          </span>
                        </td>
                        <td className="font-medium">{item.orderCount}</td>
                        <td>{formatCurrency(item.totalRevenue)}</td>
                        <td>{(item.commissionRate * 100).toFixed(0)}%</td>
                        <td className="font-semibold text-green-700">
                          {formatCurrency(item.commissionOwed)}
                        </td>
                        <td className="text-xs text-gray-600">
                          {item.influencer.pixKey || "—"}
                        </td>
                        <td className="text-xs text-gray-600">
                          {item.influencer.bankName || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan={2} className="px-4 py-3 text-gray-700">Total</td>
                      <td className="px-4 py-3">{totalOrders}</td>
                      <td className="px-4 py-3">{formatCurrency(totalRevenue)}</td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3 text-green-700">{formatCurrency(totalCommission)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Selecione um período e clique em &ldquo;Calcular Comissões&rdquo;</p>
        </div>
      )}
    </div>
  );
}
