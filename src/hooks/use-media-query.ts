"use client";

import { useEffect, useState } from "react";

/**
 * Subscribes to `window.matchMedia`. Defaults to `false` until mounted (SSR-safe).
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
