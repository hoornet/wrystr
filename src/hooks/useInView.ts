import { useEffect, useState } from "react";

/**
 * Returns true once the referenced element has entered the viewport.
 * Uses IntersectionObserver with a generous rootMargin so data fetches
 * start slightly before the card scrolls fully into view.
 *
 * Once visible, stays true — we never un-fetch engagement data.
 */
export function useInView(ref: React.RefObject<HTMLElement | null>, rootMargin = "300px"): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, inView, rootMargin]);

  return inView;
}
