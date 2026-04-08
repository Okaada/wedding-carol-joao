export default function StatsCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-accent bg-white px-5 py-4">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
