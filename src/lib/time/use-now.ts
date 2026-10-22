"use client";

import { useEffect, useState } from "react";

/**
 * The current instant, refreshed every `intervalMs` and whenever the tab
 * becomes visible again — for date / time pickers that must notice a window
 * starting (or midnight passing) while the page stays open. null until
 * mounted: the server render never guesses the viewer's clock.
 */
export function useNow(intervalMs = 15_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}
