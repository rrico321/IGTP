"use client";

import { useEffect, useState } from "react";

export function LocalTime({ date, fallback }: { date: string; fallback?: string }) {
  const [formatted, setFormatted] = useState(fallback ?? "");

  useEffect(() => {
    setFormatted(new Date(date).toLocaleString());
  }, [date]);

  return <>{formatted}</>;
}

export function LocalDate({ date, fallback }: { date: string; fallback?: string }) {
  const [formatted, setFormatted] = useState(fallback ?? "");

  useEffect(() => {
    setFormatted(
      new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );
  }, [date]);

  return <>{formatted}</>;
}
