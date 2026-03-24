interface BadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  paid: {
    label: "Pago",
    className: "bg-green-100 text-green-700",
  },
  pending: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-700",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700",
  },
  refunded: {
    label: "Reembolsado",
    className: "bg-orange-100 text-orange-700",
  },
  voided: {
    label: "Anulado",
    className: "bg-gray-100 text-gray-600",
  },
  fulfilled: {
    label: "Enviado",
    className: "bg-blue-100 text-blue-700",
  },
  unfulfilled: {
    label: "Não enviado",
    className: "bg-gray-100 text-gray-600",
  },
  active: {
    label: "Ativo",
    className: "bg-green-100 text-green-700",
  },
  inactive: {
    label: "Inativo",
    className: "bg-gray-100 text-gray-500",
  },
};

export function Badge({ status, className = "" }: BadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
