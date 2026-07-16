"use client";

/**
 * Alterna tema claro/oscuro en document.documentElement y persiste en localStorage.
 */

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const THEME_STORAGE_KEY = "ferreteria-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Muestra los tres colores de marca activos (primary / secondary / accent). */
export function PalettePreview() {
  return (
    <div
      className="hidden items-center gap-1.5 sm:flex"
      aria-hidden="true"
      title="Paleta Ferreteria activa"
    >
      <span className="h-3.5 w-3.5 rounded-full bg-primary ring-1 ring-border" />
      <span className="h-3.5 w-3.5 rounded-full bg-secondary ring-1 ring-border" />
      <span className="h-3.5 w-3.5 rounded-full bg-accent ring-1 ring-border" />
    </div>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className="flex items-center gap-2">
      <PalettePreview />
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={toggle}
        disabled={!mounted}
        aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
        title={theme === "light" ? "Modo oscuro" : "Modo claro"}
      >
        {mounted && theme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
