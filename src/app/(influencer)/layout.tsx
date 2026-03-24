import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/Sidebar";

const navItems = [
  {
    href: "/influencer/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/influencer/orders",
    label: "Meus Pedidos",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
];

export default async function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "INFLUENCER") {
    redirect("/auth/signin");
  }

  let couponCode: string | undefined;
  if (session.user.influencerId) {
    const influencer = await prisma.influencer.findUnique({
      where: { id: session.user.influencerId },
      select: { couponCode: true },
    });
    couponCode = influencer?.couponCode;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        navItems={navItems}
        userInfo={{
          name: session.user.name,
          email: session.user.email,
          role: "Influenciadora(o)",
          couponCode,
        }}
        title="Portal do Influenciador"
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
