import Link from "next/link";
import { getMongoClient } from "@/lib/mongodb";
import GiftTable from "@/components/admin/GiftTable";
import StatsCard from "@/components/admin/StatsCard";
import type { Gift } from "@/data/types";

export default async function GiftsPage() {
  const client = await getMongoClient();
  const collection = client.db("carol-joao").collection("gifts");

  const docs = await collection.find().sort({ sortOrder: 1 }).toArray();
  const gifts = docs.map((d) => ({ ...d, _id: d._id.toString() })) as Gift[];

  const available = gifts.filter((g) => g.status === "available").length;
  const reserved = gifts.filter((g) => g.status === "reserved").length;
  const claimed = gifts.filter((g) => g.status === "claimed").length;
  const purchased = gifts.filter((g) => g.status === "purchased").length;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
          Presentes
        </h1>
        <Link
          href="/admin/gifts/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
        >
          Novo presente
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatsCard label="Total" value={gifts.length} />
        <StatsCard label="Disponíveis" value={available} />
        <StatsCard label="Reservados" value={reserved} />
        <StatsCard label="Reservados (ext.)" value={claimed} />
        <StatsCard label="Comprados" value={purchased} />
      </div>

      <GiftTable gifts={gifts} />
    </div>
  );
}
