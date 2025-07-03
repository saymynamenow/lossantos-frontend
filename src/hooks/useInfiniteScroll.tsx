import { useEffect, useRef } from "react";

export default function useInfiniteScroll(
  callback: () => void,
  enabled: boolean
) {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log("Intersection observer triggered:", {
          isIntersecting: entry.isIntersecting,
          isFetching: isFetchingRef.current,
          enabled,
        });
        if (entry.isIntersecting && !isFetchingRef.current) {
          isFetchingRef.current = true;
          callback();
          setTimeout(() => {
            isFetchingRef.current = false;
          }, 500); // debounce to avoid rapid refiring
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: "100px", // Trigger 100px before the element comes into view
      }
    );

    observer.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
      observer.disconnect();
    };
  }, [callback, enabled]);

  return loaderRef;
}
