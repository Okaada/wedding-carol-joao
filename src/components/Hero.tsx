import Image from "next/image";
import { HeroData } from "@/data/types";

interface HeroProps {
  data: HeroData;
}

export default function Hero({ data }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <Image
        src={data.image}
        alt={data.names}
        fill
        priority
        className="object-cover brightness-50 blur-sm scale-110"
      />
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center text-white">
        <p className="text-sm tracking-[0.3em] uppercase text-white/80">
          {data.subtitle}
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-bold leading-tight md:text-7xl lg:text-8xl">
          {data.names}
        </h1>
        <div className="mt-4 h-px w-24 bg-white/60" />
        <p className="mt-2 text-lg tracking-widest text-white/90 md:text-xl">
          {data.date}
        </p>
      </div>
    </section>
  );
}
