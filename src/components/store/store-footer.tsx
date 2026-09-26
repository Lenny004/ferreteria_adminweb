"use client";

/**
 * Pie de página de la tienda pública.
 */

import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/tienda/contacto", label: "Contáctanos" },
  { href: "/tienda/terminos", label: "Términos" },
  { href: "/tienda/privacidad", label: "Privacidad" },
] as const;

export function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            F
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ferreteria</p>
            <p className="text-xs text-muted-foreground">
              © {year} Ferreteria. Todos los derechos reservados.
            </p>
          </div>
        </div>
        <nav aria-label="Enlaces legales" className="flex flex-wrap gap-1">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
