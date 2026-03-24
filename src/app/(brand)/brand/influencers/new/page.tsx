"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function NewInfluencerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    couponCode: "",
    commissionRate: "10",
    pixKey: "",
    bankName: "",
    bankAccount: "",
    notes: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          commissionRate: Number(form.commissionRate) / 100,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar influenciador.");
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

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/brand/influencers" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Influenciador</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Cadastre um novo parceiro influenciador.</p>
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
              placeholder="Ana Silva"
              value={form.displayName}
              onChange={(e) => handleChange("displayName", e.target.value)}
              required
            />
            <Input
              label="E-mail *"
              type="email"
              placeholder="ana@email.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Acesso ao Portal</h3>
          <Input
            label="Senha de acesso *"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required
            helpText="O influenciador usará este e-mail e senha para acessar o portal."
          />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Cupom e Comissão</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Código do cupom *"
              placeholder="ANA10"
              value={form.couponCode}
              onChange={(e) => handleChange("couponCode", e.target.value.toUpperCase())}
              required
              helpText="Código único usado na Shopify"
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
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              value={form.pixKey}
              onChange={(e) => handleChange("pixKey", e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Banco"
                placeholder="Nubank, Itaú, etc."
                value={form.bankName}
                onChange={(e) => handleChange("bankName", e.target.value)}
              />
              <Input
                label="Conta bancária"
                placeholder="Agência / Conta"
                value={form.bankAccount}
                onChange={(e) => handleChange("bankAccount", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Informações adicionais..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? "Salvando..." : "Criar Influenciador"}
          </Button>
          <Link href="/brand/influencers">
            <Button type="button" variant="outline" size="lg">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
