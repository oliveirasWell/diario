"use client";

import { useEffect, useRef, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

function applyTheme(mode: ThemeMode, mqlRef: React.MutableRefObject<MediaQueryList | null>) {
  const root = document.documentElement;
  if (mqlRef.current) {
    mqlRef.current.onchange = null;
    mqlRef.current = null;
  }
  if (mode === "light") {
    root.classList.remove("dark");
  } else if (mode === "dark") {
    root.classList.add("dark");
  } else {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mqlRef.current = mql;
    const setBySystem = () => {
      if (mql.matches) root.classList.add("dark");
      else root.classList.remove("dark");
    };
    setBySystem();
    mql.onchange = setBySystem;
  }
}

export function useThemeMode() {
  const mqlRef = useRef<MediaQueryList | null>(null);
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as ThemeMode | null) ?? "system";
    setModeState(stored);
    applyTheme(stored, mqlRef);
    return () => {
      if (mqlRef.current) mqlRef.current.onchange = null;
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem("theme", next);
    applyTheme(next, mqlRef);
  };

  return { mode, setMode };
}
