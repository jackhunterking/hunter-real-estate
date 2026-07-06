import { useEffect, useState } from "react";

/** True when the viewport is phone-sized. SSR-safe (defaults to false). */
export function useIsMobile(query = "(max-width: 820px)") {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return isMobile;
}
