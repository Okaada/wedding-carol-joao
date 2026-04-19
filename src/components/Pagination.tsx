import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

function buildPageList(current: number, total: number): Array<number | "ellipsis"> {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(sorted[i]);
  }
  return result;
}

export default function Pagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const isFirst = safePage === 1;
  const isLast = safePage === totalPages;
  const pageList = buildPageList(safePage, totalPages);

  const baseLinkClass =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm transition-colors";
  const disabledClass = "cursor-not-allowed text-muted/50";
  const inactiveClass = "text-muted hover:bg-section-alt hover:text-primary";
  const activeClass = "bg-primary text-white";

  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-col items-center gap-3">
      <p className="sr-only" aria-live="polite">
        Página {safePage} de {totalPages}
      </p>

      {/* Mobile compact variant */}
      <div className="flex items-center gap-4 md:hidden">
        {isFirst ? (
          <span aria-disabled="true" className={`${baseLinkClass} ${disabledClass}`}>
            &larr;
          </span>
        ) : (
          <Link
            href={buildHref(safePage - 1)}
            rel="prev"
            className={`${baseLinkClass} ${inactiveClass}`}
          >
            &larr;
          </Link>
        )}
        <span className="text-sm text-foreground">
          {safePage} / {totalPages}
        </span>
        {isLast ? (
          <span aria-disabled="true" className={`${baseLinkClass} ${disabledClass}`}>
            &rarr;
          </span>
        ) : (
          <Link
            href={buildHref(safePage + 1)}
            rel="next"
            className={`${baseLinkClass} ${inactiveClass}`}
          >
            &rarr;
          </Link>
        )}
      </div>

      {/* Full numbered variant */}
      <ul className="hidden items-center gap-1 md:flex">
        <li>
          {isFirst ? (
            <span aria-disabled="true" className={`${baseLinkClass} ${disabledClass}`}>
              Anterior
            </span>
          ) : (
            <Link
              href={buildHref(safePage - 1)}
              rel="prev"
              className={`${baseLinkClass} ${inactiveClass}`}
            >
              Anterior
            </Link>
          )}
        </li>
        {pageList.map((item, idx) =>
          item === "ellipsis" ? (
            <li key={`ellipsis-${idx}`}>
              <span aria-hidden="true" className="px-2 text-muted">
                …
              </span>
            </li>
          ) : (
            <li key={item}>
              {item === safePage ? (
                <Link
                  href={buildHref(item)}
                  aria-current="page"
                  className={`${baseLinkClass} ${activeClass}`}
                >
                  {item}
                </Link>
              ) : (
                <Link
                  href={buildHref(item)}
                  className={`${baseLinkClass} ${inactiveClass}`}
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {isLast ? (
            <span aria-disabled="true" className={`${baseLinkClass} ${disabledClass}`}>
              Próxima
            </span>
          ) : (
            <Link
              href={buildHref(safePage + 1)}
              rel="next"
              className={`${baseLinkClass} ${inactiveClass}`}
            >
              Próxima
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
