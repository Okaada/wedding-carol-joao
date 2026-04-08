"use client";

import { useState } from "react";
import { TimelineEvent, WeddingDayData } from "@/data/types";

interface WeddingDayTimelineItemProps {
  event: TimelineEvent;
  weddingDay: WeddingDayData;
}

type SelectedVenue = "ceremony" | "reception";

export default function WeddingDayTimelineItem({
  event,
  weddingDay,
}: WeddingDayTimelineItemProps) {
  const [selected, setSelected] = useState<SelectedVenue>("ceremony");

  const activeEmbedUrl =
    selected === "ceremony"
      ? weddingDay.ceremony.embedUrl
      : weddingDay.reception.embedUrl;

  const activeMapUrl =
    selected === "ceremony"
      ? weddingDay.ceremony.mapUrl
      : weddingDay.reception.mapUrl;

  const cardBase =
    "w-full rounded-xl border p-6 text-center transition-colors duration-200 cursor-pointer text-left";
  const cardSelected = "border-primary bg-primary/5";
  const cardUnselected =
    "border-muted/20 bg-section-alt hover:border-primary/40";

  return (
    <div className="relative flex flex-col items-center pt-8">
      {/* Large decorative timeline dot */}
      <div className="absolute -top-2 left-1/2 z-10 hidden h-6 w-6 -translate-x-1/2 rounded-full border-4 border-primary bg-primary md:block" />

      {/* Terminal card */}
      <div className="w-full max-w-3xl rounded-2xl border border-primary/30 bg-background px-8 py-10 shadow-lg md:px-12">
        {/* Date / time badge */}
        <p className="mb-1 text-center text-sm font-semibold tracking-widest uppercase text-primary">
          {weddingDay.date} · {weddingDay.time}
        </p>
        <h3 className="mb-4 text-center font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground md:text-4xl">
          {event.title}
        </h3>
        <p className="mx-auto mb-10 max-w-lg text-center leading-relaxed text-muted">
          {event.description}
        </p>

        {/* Clickable venue cards */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {/* Cerimônia card */}
          <button
            onClick={() => setSelected("ceremony")}
            className={`${cardBase} ${selected === "ceremony" ? cardSelected : cardUnselected}`}
            aria-pressed={selected === "ceremony"}
          >
            <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-primary">
              Cerimônia
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-xl font-bold text-foreground">
              {weddingDay.ceremony.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {weddingDay.ceremony.address}
            </p>
            <p className="mt-3 text-sm font-semibold text-primary">
              {weddingDay.time}
            </p>
          </button>

          {/* Festa card */}
          <button
            onClick={() => setSelected("reception")}
            className={`${cardBase} ${selected === "reception" ? cardSelected : cardUnselected}`}
            aria-pressed={selected === "reception"}
          >
            <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-primary">
              Festa
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-xl font-bold text-foreground">
              {weddingDay.reception.name}
            </p>
            <p className="mt-2 text-sm text-muted">{weddingDay.reception.start}</p>
            <p className="mt-1 text-sm text-muted">{weddingDay.reception.end}</p>
          </button>
        </div>

        {/* Hint label */}
        <p className="mb-4 text-center text-xs text-muted/60">
          {selected === "ceremony" ? "Cerimônia" : "Festa"} — clique no card para trocar
        </p>

        {/* Google Maps iframe */}
        <div className="overflow-hidden rounded-xl border border-muted/20">
          <iframe
            key={activeEmbedUrl}
            src={activeEmbedUrl}
            width="100%"
            height="320"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Localização — ${selected === "ceremony" ? weddingDay.ceremony.name : weddingDay.reception.name}`}
            className="block w-full"
          />
        </div>

        {/* Map link */}
        <div className="mt-5 text-center">
          <a
            href={activeMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary transition-opacity hover:opacity-70"
          >
            Ver no mapa →
          </a>
        </div>
      </div>
    </div>
  );
}
