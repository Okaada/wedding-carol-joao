import { TimelineEvent, WeddingDayData } from "@/data/types";
import TimelineItem from "./TimelineItem";
import WeddingDayTimelineItem from "./WeddingDayTimelineItem";

interface TimelineProps {
  events: TimelineEvent[];
  weddingDay?: WeddingDayData;
}

export default function Timeline({ events, weddingDay }: TimelineProps) {
  const regularEvents = weddingDay ? events.slice(0, -1) : events;
  const lastEvent = weddingDay ? events[events.length - 1] : null;

  return (
    <section id="nossa-historia" className="bg-section-alt py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center font-[family-name:var(--font-playfair)] text-4xl font-bold text-foreground">
          Nossa História
        </h2>
        <p className="mx-auto mb-16 max-w-lg text-center text-muted">
          Cada momento nos trouxe até aqui. Conheça um pouco da nossa
          trajetória.
        </p>

        {/* Vertical line (desktop only) */}
        <div className="relative">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-primary-light/40 md:block" />

          <div className="flex flex-col gap-16">
            {regularEvents.map((event, index) => (
              <TimelineItem key={index} event={event} index={index} />
            ))}

            {lastEvent && weddingDay && (
              <WeddingDayTimelineItem event={lastEvent} weddingDay={weddingDay} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
