"use client";

import { useState, useEffect } from "react";

const WEDDING_DATE = new Date("2026-10-24T16:00:00-03:00").getTime();

interface TimeLeft {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, WEDDING_DATE - Date.now());
  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return null;

  const lessThanOneWeek = WEDDING_DATE - Date.now() < 7 * 24 * 60 * 60 * 1000;

  const units = [
    { value: timeLeft.dias, label: "Dias" },
    ...(lessThanOneWeek
      ? [
          { value: timeLeft.horas, label: "Horas" },
          { value: timeLeft.minutos, label: "Minutos" },
          { value: timeLeft.segundos, label: "Segundos" },
        ]
      : []),
  ];

  return (
    <div className="mt-6 flex gap-6 sm:gap-8">
      {units.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold tabular-nums text-white sm:text-4xl md:text-5xl">
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-xs tracking-widest uppercase text-white/70 sm:text-sm">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
