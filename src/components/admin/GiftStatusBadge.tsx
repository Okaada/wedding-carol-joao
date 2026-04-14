const styles: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  reserved: "bg-yellow-100 text-yellow-800",
  purchased: "bg-gray-100 text-gray-600",
  claimed: "bg-blue-100 text-blue-800",
};

const labels: Record<string, string> = {
  available: "Disponível",
  reserved: "Reservado",
  purchased: "Comprado",
  claimed: "Reservado (externo)",
};

export default function GiftStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.available}`}>
      {labels[status] ?? status}
    </span>
  );
}
