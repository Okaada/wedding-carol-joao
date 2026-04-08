import Image from "next/image";
import { TimelineEvent } from "@/data/types";

interface TimelineItemProps {
  event: TimelineEvent;
  index: number;
}

export default function TimelineItem({ event, index }: TimelineItemProps) {
  const isEven = index % 2 === 0;

  return (
    <div className="relative flex flex-col items-center gap-6 md:flex-row md:gap-12">
      {/* Line connector dot */}
      <div className="absolute left-1/2 top-0 z-10 hidden h-4 w-4 -translate-x-1/2 rounded-full border-2 border-primary bg-background md:block" />

      {/* Content - alternates sides on desktop */}
      <div
        className={`w-full md:w-1/2 ${isEven ? "md:text-right md:pr-12" : "md:order-2 md:pl-12"}`}
      >
        <p className="mb-1 text-sm font-semibold tracking-widest uppercase text-primary">
          {event.date}
        </p>
        <h3 className="mb-2 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
          {event.title}
        </h3>
        <p className="leading-relaxed text-muted">{event.description}</p>
      </div>

      {/* Image */}
      <div
        className={`w-full md:w-1/2 ${isEven ? "md:order-2 md:pl-12" : "md:text-right md:pr-12"}`}
      >
        {event.image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
