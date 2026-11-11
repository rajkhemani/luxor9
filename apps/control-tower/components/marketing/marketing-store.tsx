"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MarketingStore = {
  routeProgress: number;
  setRouteProgress: (value: number) => void;
  activeRouteIndex: number;
  setActiveRouteIndex: (index: number) => void;
  routeBroken: boolean;
  setRouteBroken: (broken: boolean) => void;
};

const Ctx = createContext<MarketingStore | null>(null);

export function MarketingStoreProvider({ children }: { children: ReactNode }) {
  const [routeProgress, setRouteProgress] = useState(0);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [routeBroken, setRouteBroken] = useState(false);

  const value = useMemo(
    () => ({
      routeProgress,
      setRouteProgress,
      activeRouteIndex,
      setActiveRouteIndex,
      routeBroken,
      setRouteBroken,
    }),
    [routeProgress, activeRouteIndex, routeBroken],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMarketingStore(): MarketingStore {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useMarketingStore must be used within MarketingStoreProvider");
  }
  return ctx;
}

export function useOptionalMarketingStore(): MarketingStore | null {
  return useContext(Ctx);
}

export function useSyncRouteFromScroll() {
  const store = useOptionalMarketingStore();
  return useCallback(
    (progress: number) => {
      store?.setRouteProgress(progress);
    },
    [store],
  );
}
