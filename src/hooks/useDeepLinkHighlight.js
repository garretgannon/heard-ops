import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export function useDeepLinkHighlight() {
  const [searchParams] = useSearchParams();
  const highlightedRef = useRef(null);

  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId) return;

    const element = document.getElementById(highlightId);
    if (!element) return;

    // Add glow animation
    element.classList.add("animate-deep-link-glow", "animate-subtle-bounce");
    highlightedRef.current = element;

    // Cleanup after animation completes
    const timer = setTimeout(() => {
      if (element) {
        element.classList.remove("animate-deep-link-glow", "animate-subtle-bounce");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  return highlightedRef;
}