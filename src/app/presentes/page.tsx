import Link from "next/link";
import type { Filter, Sort } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";
import { releaseExpiredReservations } from "@/lib/gifts";
import { isPanicModeActive } from "@/lib/panic-mode";
import { generatePixQrCodeDataUrl, generatePixPayload } from "@/lib/pix";
import GiftCard from "@/components/GiftCard";
import Navbar from "@/components/Navbar";
import Pagination from "@/components/Pagination";
import GiftListControls from "@/components/gifts/GiftListControls";
import PixSection from "@/components/PixSection";
import type { Gift, PixSettings } from "@/data/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lista de Presentes — Carol & João",
};

const PAGE_SIZE = 12;

type PriceBucket = "all" | "lt100" | "100to300" | "300to600" | "gte600";
type AvailabilityFilter = "available" | "all";
type SortKey = "default" | "price-asc" | "price-desc";

type ParsedParams = {
  page: number;
  price: PriceBucket;
  available: AvailabilityFilter;
  sort: SortKey;
};

const PRICE_VALUES: readonly PriceBucket[] = [
  "all",
  "lt100",
  "100to300",
  "300to600",
  "gte600",
];
const AVAILABILITY_VALUES: readonly AvailabilityFilter[] = ["available", "all"];
const SORT_VALUES: readonly SortKey[] = ["default", "price-asc", "price-desc"];

function readSingle(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parseParams(
  raw: Record<string, string | string[] | undefined>,
): ParsedParams {
  const rawPage = Number.parseInt(readSingle(raw.page) ?? "", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  return {
    page,
    price: parseEnum(readSingle(raw.price), PRICE_VALUES, "all"),
    available: parseEnum(readSingle(raw.available), AVAILABILITY_VALUES, "available"),
    sort: parseEnum(readSingle(raw.sort), SORT_VALUES, "default"),
  };
}

function buildMongoFilter(params: ParsedParams): Filter<Gift> {
  const filter: Filter<Gift> = { status: { $ne: "purchased" } };
  if (params.available === "available") {
    filter.status = "available";
  }
  const priceRange: { $gte?: number; $lt?: number } = {};
  switch (params.price) {
    case "lt100":
      priceRange.$lt = 10000;
      break;
    case "100to300":
      priceRange.$gte = 10000;
      priceRange.$lt = 30000;
      break;
    case "300to600":
      priceRange.$gte = 30000;
      priceRange.$lt = 60000;
      break;
    case "gte600":
      priceRange.$gte = 60000;
      break;
  }
  if (Object.keys(priceRange).length > 0) {
    filter.price = priceRange;
  }
  return filter;
}

function buildMongoSort(sort: SortKey): Sort {
  if (sort === "price-asc") return { price: 1 };
  if (sort === "price-desc") return { price: -1 };
  return { sortOrder: 1 };
}

function buildUrl(
  base: ParsedParams,
  overrides: Partial<ParsedParams>,
): string {
  const next = { ...base, ...overrides };
  const sp = new URLSearchParams();
  if (next.price !== "all") sp.set("price", next.price);
  if (next.available !== "available") sp.set("available", next.available);
  if (next.sort !== "default") sp.set("sort", next.sort);
  if (next.page > 1) sp.set("page", String(next.page));
  const qs = sp.toString();
  return qs ? `/presentes?${qs}` : "/presentes";
}

export default async function PresentesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await releaseExpiredReservations();

  const raw = await searchParams;
  const params = parseParams(raw);

  const client = await getMongoClient();
  const db = client.db("carol-joao");
  const collection = db.collection<Gift>("gifts");

  const filter = buildMongoFilter(params);
  const sort = buildMongoSort(params.sort);

  const totalCount = await collection.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(params.page, 1), totalPages);

  const docs = await collection
    .find(filter)
    .sort(sort)
    .skip((currentPage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .toArray();
  const gifts = docs.map((d) => ({ ...d, _id: d._id.toString() })) as Gift[];

  const pixDoc = await db.collection("settings").findOne({ key: "pix" });
  const pixSettings = pixDoc?.value as PixSettings | undefined;
  const panicMode = await isPanicModeActive();

  const pixDataMap: Record<string, { qrCodeUrl: string; payload: string }> = {};
  if (pixSettings) {
    for (const gift of gifts) {
      const mode = gift.purchaseMode ?? "mercadopago";
      const needsPix =
        (mode === "external" && gift.price > 0) ||
        (panicMode && gift.price > 0);
      if (needsPix) {
        const amountBrl = gift.price / 100;
        const [qrCodeUrl, payload] = await Promise.all([
          generatePixQrCodeDataUrl(pixSettings, amountBrl),
          Promise.resolve(generatePixPayload(pixSettings, amountBrl)),
        ]);
        pixDataMap[gift._id] = { qrCodeUrl, payload };
      }
    }
  }

  const effectiveParams = { ...params, page: currentPage };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-12 text-center">
            <h1 className="mb-3 font-[family-name:var(--font-playfair)] text-4xl font-bold text-foreground">
              Lista de Presentes
            </h1>
            <p className="text-muted">
              Sua presença é o nosso maior presente! Mas se quiser nos presentear,
              aqui estão algumas sugestões.
            </p>
          </div>

          <GiftListControls />

          {gifts.length === 0 ? (
            <div className="mb-16 flex flex-col items-center gap-4 rounded-lg border border-accent/40 bg-section-alt/40 px-6 py-16 text-center">
              <p className="text-muted">
                Nenhum presente encontrado com esses filtros.
              </p>
              <Link
                href="/presentes"
                className="inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
              >
                Limpar filtros
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gifts.map((gift) => (
                  <GiftCard
                    key={gift._id}
                    gift={gift}
                    pixQrCodeUrl={pixDataMap[gift._id]?.qrCodeUrl}
                    pixPayload={pixDataMap[gift._id]?.payload}
                    panicMode={panicMode}
                  />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                buildHref={(p) => buildUrl(effectiveParams, { page: p })}
              />
            </>
          )}

          {pixSettings && <PixSection settings={pixSettings} />}
        </div>
      </div>
    </>
  );
}
