"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface DeleteInfluencerButtonProps {
  id: string;
  name: string;
  isActive: boolean;
}

export function DeleteInfluencerButton({ id, name, isActive }: DeleteInfluencerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (!confirm(`${isActive ? "Desativar" : "Reativar"} influenciador "${name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/influencers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isActive ? "danger" : "secondary"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {isActive ? "Desativar" : "Reativar"}
    </Button>
  );
}
