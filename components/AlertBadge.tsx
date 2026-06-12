"use client";

import { useEffect, useState } from "react";

export function AlertBadge() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => setCount(data.count ?? 0))
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
