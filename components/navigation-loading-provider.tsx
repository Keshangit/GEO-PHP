"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface NavigationLoadingContextValue {
  startNavigation: () => void;
  stopNavigation: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(
  null
);

function isInternalNavigationLink(anchor: HTMLAnchorElement, pathname: string) {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) {
      return false;
    }
    return url.pathname + url.search !== pathname;
  } catch {
    return false;
  }
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const stopNavigation = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsNavigating(false);
  }, []);

  const startNavigation = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsNavigating(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      timeoutRef.current = null;
    }, 15_000);
  }, []);

  useEffect(() => {
    stopNavigation();
  }, [pathname, stopNavigation]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || !isInternalNavigationLink(anchor, pathname)) return;

      startNavigation();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, startNavigation]);

  useEffect(() => {
    document.body.style.cursor = isNavigating ? "progress" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isNavigating]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return (
    <NavigationLoadingContext.Provider value={{ startNavigation, stopNavigation }}>
      {isNavigating && (
        <>
          <div className="navigation-progress-track" aria-hidden>
            <div className="navigation-progress-bar" />
          </div>
          <div className="navigation-busy-indicator" role="status" aria-live="polite">
            <Loader2 className="size-5 animate-spin text-[#3eb1f1]" />
            <span>Loading page…</span>
          </div>
        </>
      )}
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error("useNavigationLoading must be used within NavigationLoadingProvider");
  }
  return context;
}
