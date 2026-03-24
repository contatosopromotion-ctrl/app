"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface InfluencerData {
  id: string;
  displayName: string;
  email: string;
  couponCode: string;
  commissionRate: string;
  pixKey: string | null;
  bankName: string | null;
  bankAccount: string | null;
  notes: string | null;
  isActive: boolean;
}

export default function EditInfluencerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    couponCode: "",
    commissionRate: "10",
    pixKey: "",
    bankName: "",
    bankAccount: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchInfluencer() {
      try {
        const res = await fetch(`/api/influencers/${id}`);
        if (res.ok) {
          const data: InfluencerData = await res.json();
          setForm({
            displayName: data.displayName,
            email: data.email,
            couponCode: data.couponCode,
            commissionRate: (Number(data.commissionRate) * 100).toFixed(1),
            pixKey: data.pixKey || "",
            bankName: data.bankName || "",
            bankAccount: data.bankAccount || "",
            notes: data.notes || "",
          });
        } else {
          setError("Influenciador não encontrado.");
        }
      } finally {
        setFetching(false);
      }
    }
    fetchInfluencer();
  }, [id]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/influencers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          commissionRate: Number(form.commissionRate) / 100,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao atualizar influenciador.");
        return;
      }

      router.push("/brand/influencers");
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/brand/influencers" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Influenciador</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{form.displayName}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Dados Pessoais</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome de exibição *"
              value={form.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              required
            />
            <Input
              label="E-mail *"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Cupom e Comissão</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código do cupom *"
              value={form.couponCode}
              onChange={(e) => handleChange("couponCode", e.target.value.toUpperCase())}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Taxa de comissão (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.1"
                  value={form.commissionRate}
                  onChange={(e) => handleChange("commissionRate", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Dados Bancários (opcional)</h3>
          <div className="space-y-4">
            <Input
              label="Chave PIX"
              value={form.pixKey}
              onChange={(e) => handleChange("pixKey", e.target.value)}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Banco"
                value={form.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
              />
              <Input
                label="Conta bancária"
                value={form.bankAccount}
                onChange={(e) => handleChange("bankAccount", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Link href="/brand/influencers">
            <Button type="button" variant="outline" size="lg">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
