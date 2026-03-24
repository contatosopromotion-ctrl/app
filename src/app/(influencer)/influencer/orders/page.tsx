"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Order {
  id: string;
  orderNumber: string;
  customerEmail: string | null;
  totalPrice: string;
  subtotalPrice: string;
  totalDiscounts: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  processedAt: string;
  couponCode: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InfluencerOrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
      });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [page, fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = data?.orders.filter((o) =>
    search ? o.orderNumber.toLowerCase().includes(search.toLowerCase()) : true
  ) ?? [];

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
        <p className="text-gray-500 mt-1">Visualize todos os pedidos gerados com seu cupom.</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <Input
              label="Buscar por número"
              placeholder="#1001"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Filtrar</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
            >
              Limpar
            </Button>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">
            {data ? `${data.total} pedidos encontrados` : "Carregando..."}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Cupom</th>
                <th>Subtotal</th>
                <th>Desconto</th>
                <th>Total</th>
                <th>Financeiro</th>
                <th>Envio</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10">
                    <div className="inline-flex items-center gap-2 text-gray-400">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Carregando pedidos...
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-10">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="text-gray-500 text-xs">{order.customerEmail || "—"}</td>
                    <td className="font-mono text-xs text-brand-600">{order.couponCode}</td>
                    <td>{formatCurrency(order.subtotalPrice)}</td>
                    <td className="text-red-600">-{formatCurrency(order.totalDiscounts)}</td>
                    <td className="font-semibold">{formatCurrency(order.totalPrice)}</td>
                    <td><Badge status={order.financialStatus} /></td>
                    <td>
                      {order.fulfillmentStatus ? (
                        <Badge status={order.fulfillmentStatus} />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="text-gray-500 text-xs">{formatDate(order.processedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Página {data.page} de {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
