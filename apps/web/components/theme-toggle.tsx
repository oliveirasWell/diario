"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Laptop } from "lucide-react";

type Mode = "system" | "light" | "dark";

function applyTheme(mode: Mode, mqlRef: React.MutableRefObject<MediaQueryList | null>) {
  const root = document.documentElement;
  // Clean previous listener
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

export function ThemeToggle() {
  const mqlRef = useRef<MediaQueryList | null>(null);
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Mode | null) ?? "system";
    setMode(stored);
    applyTheme(stored, mqlRef);
    return () => {
      if (mqlRef.current) mqlRef.current.onchange = null;
    };
  }, []);

  const cycle = () => {
    const next: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    localStorage.setItem("theme", next);
    applyTheme(next, mqlRef);
  };

  const Icon = mode === "system" ? Laptop : mode === "light" ? Sun : Moon;
  const label = mode === "system" ? "Tema: sistema" : mode === "light" ? "Tema: claro" : "Tema: escuro";

  return (
    <Button variant="ghost" className="h-8 w-8 p-0" onClick={cycle} title={label} aria-label={label}>
      <Icon className="size-5" />
    </Button>
  );
}
