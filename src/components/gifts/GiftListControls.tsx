"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PRICE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "lt100", label: "Até R$ 100" },
  { value: "100to300", label: "R$ 100–300" },
  { value: "300to600", label: "R$ 300–600" },
  { value: "gte600", label: "Acima de R$ 600" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Disponíveis" },
  { value: "all", label: "Todos" },
];

const SORT_OPTIONS = [
  { value: "default", label: "Padrão" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
];

const selectClass =
  "w-full rounded-md border border-accent bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function GiftListControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const price = searchParams.get("price") ?? "all";
  const available = searchParams.get("available") ?? "available";
  const sort = searchParams.get("sort") ?? "default";

  const updateParam = (key: string, value: string, defaultValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="mb-8 grid gap-4 rounded-lg border border-accent/40 bg-section-alt/40 p-4 sm:grid-cols-3">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="gift-price-filter"
          className="text-xs uppercase tracking-widest text-muted"
        >
          Faixa de preço
        </label>
        <select
          id="gift-price-filter"
          value={price}
          onChange={(e) => updateParam("price", e.target.value, "all")}
          className={selectClass}
        >
          {PRICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="gift-availability-filter"
          className="text-xs uppercase tracking-widest text-muted"
        >
          Disponibilidade
        </label>
        <select
          id="gift-availability-filter"
          value={available}
          onChange={(e) => updateParam("available", e.target.value, "available")}
          className={selectClass}
        >
          {AVAILABILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="gift-sort"
          className="text-xs uppercase tracking-widest text-muted"
        >
          Ordenar por
        </label>
        <select
          id="gift-sort"
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value, "default")}
          className={selectClass}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
