import { TimelineEvent } from "@/data/types";
import TimelineItem from "./TimelineItem";

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
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
            {events.map((event, index) => (
              <TimelineItem key={index} event={event} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
