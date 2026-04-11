import { Suspense } from "react";
import { getMongoClient } from "@/lib/mongodb";
import { formatDate } from "@/lib/format";
import StatsCard from "@/components/admin/StatsCard";
import RsvpSearch from "@/components/admin/RsvpSearch";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function RsvpPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const client = await getMongoClient();
  const collection = client.db("carol-joao").collection("rsvp");

  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { cellphone: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const [rsvps, total] = await Promise.all([
    collection.find(filter).sort({ submittedAt: -1 }).toArray(),
    collection.countDocuments(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
          Confirmações
        </h1>
        <a
          href="/api/rsvp/export"
          className="rounded-lg border border-accent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          Exportar CSV
        </a>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatsCard label="Total de confirmações" value={total} />
        {q && <StatsCard label="Resultados da busca" value={rsvps.length} />}
      </div>

      <div className="mb-4">
        <Suspense>
          <RsvpSearch />
        </Suspense>
      </div>

      <div className="overflow-x-auto rounded-lg border border-accent">
        <table className="min-w-max w-full text-left text-sm">
          <thead className="border-b border-accent bg-section-alt">
            <tr>
              <th className="px-4 py-3 font-medium text-muted">Nome</th>
              <th className="px-4 py-3 font-medium text-muted">Celular</th>
              <th className="px-4 py-3 font-medium text-muted">Data</th>
            </tr>
          </thead>
          <tbody>
            {rsvps.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  {q ? "Nenhum resultado encontrado." : "Nenhuma confirmação ainda."}
                </td>
              </tr>
            ) : (
              rsvps.map((rsvp) => (
                <tr key={rsvp._id.toString()} className="border-b border-accent/50 last:border-0">
                  <td className="px-4 py-3 text-foreground">{rsvp.name}</td>
                  <td className="px-4 py-3 text-foreground">{rsvp.cellphone}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(rsvp.submittedAt as string)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
