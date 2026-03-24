import { Suspense } from "react";
import AuthErrorContent from "./AuthErrorContent";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
