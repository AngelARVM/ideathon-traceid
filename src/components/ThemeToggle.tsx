"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("submarket_dark_mode");
    const enabled =
      saved === null
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : saved === "true";
    document.documentElement.classList.toggle("dark", enabled);
    setDark(enabled);
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("submarket_dark_mode", String(next));
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
    >
      {dark ? (
        <Sun className="h-5 w-5 text-amber-400" aria-hidden />
      ) : (
        <Moon className="h-5 w-5" aria-hidden />
      )}
    </button>
  );
}
