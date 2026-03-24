import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "BRAND_ADMIN" || session.user.role === "SUPER_ADMIN") {
      redirect("/brand/dashboard");
    } else if (session.user.role === "INFLUENCER") {
      redirect("/influencer/dashboard");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-6">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Influencer<span className="text-brand-300">Hub</span>
          </h1>
          <p className="text-brand-200 text-xl mb-2">
            Plataforma de gestão de influenciadores
          </p>
          <p className="text-brand-300 text-base max-w-md mx-auto">
            Conecte sua loja Shopify e gerencie suas parcerias com influenciadores de forma simples e eficiente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-white">
            <div className="text-3xl font-bold text-brand-300 mb-1">📊</div>
            <div className="font-semibold mb-1">Relatórios em tempo real</div>
            <div className="text-sm text-brand-200">Acompanhe vendas e comissões</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-white">
            <div className="text-3xl font-bold text-brand-300 mb-1">🛍️</div>
            <div className="font-semibold mb-1">Integração Shopify</div>
            <div className="text-sm text-brand-200">Sincronize pedidos automaticamente</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-white">
            <div className="text-3xl font-bold text-brand-300 mb-1">💰</div>
            <div className="font-semibold mb-1">Gestão de pagamentos</div>
            <div className="text-sm text-brand-200">Exporte relatórios de comissões</div>
          </div>
        </div>

        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-brand-50 transition-colors shadow-lg"
        >
          Entrar na plataforma
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <p className="text-brand-300 text-sm mt-6">
          © 2024 InfluencerHub. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}
