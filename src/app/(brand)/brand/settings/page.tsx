"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface TenantSettings {
  shopifyShopDomain: string | null;
  shopifyAccessToken: string | null;
  lastSyncedAt: string | null;
  name: string;
}

export default function BrandSettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    shopifyShopDomain: "",
    shopifyAccessToken: "",
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          setForm({
            shopifyShopDomain: data.shopifyShopDomain || "",
            shopifyAccessToken: data.shopifyAccessToken || "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setMessage({ type: "success", text: "Configurações salvas com sucesso!" });
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Erro ao salvar configurações." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar configurações." });
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Sincronização concluída! ${data.added} pedidos adicionados, ${data.updated} atualizados.`,
        });
        // Refresh settings to get new lastSyncedAt
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } else {
        setMessage({ type: "error", text: data.error || "Erro na sincronização." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro na sincronização." });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie a integração com a Shopify.</p>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg mb-6 text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
            Integração Shopify
          </h3>
          <div className="space-y-4">
            <Input
              label="Domínio da loja Shopify"
              placeholder="sua-loja.myshopify.com"
              value={form.shopifyShopDomain}
              onChange={(e) => setForm((f) => ({ ...f, shopifyShopDomain: e.target.value }))}
              helpText="Ex: minha-loja.myshopify.com (sem https://)"
            />
            <Input
              label="Token de acesso da API"
              type="password"
              placeholder="shpat_xxxxxxxxxxxxxxxxxx"
              value={form.shopifyAccessToken}
              onChange={(e) => setForm((f) => ({ ...f, shopifyAccessToken: e.target.value }))}
              helpText="Token de acesso privado da API da Shopify"
            />
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <Card className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
          Sincronização de Pedidos
        </h3>

        <div className="mb-4">
          {settings?.lastSyncedAt ? (
            <p className="text-sm text-gray-600">
              Última sincronização:{" "}
              <span className="font-medium">
                {new Date(settings.lastSyncedAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma sincronização realizada ainda.</p>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          A sincronização busca os pedidos pagos na Shopify que utilizaram os cupons dos seus influenciadores
          e os importa para a plataforma.
        </p>

        {!form.shopifyShopDomain || !form.shopifyAccessToken ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
            Configure o domínio da loja e o token de acesso antes de sincronizar.
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={handleSync}
            disabled={syncing}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? "Sincronizando..." : "Sincronizar Agora"}
          </Button>
        )}
      </Card>
    </div>
  );
}
