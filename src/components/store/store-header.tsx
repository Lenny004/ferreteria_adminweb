"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getShopAccessToken, shopAuthApi } from "@/lib/api/shop-auth";

const links = [
  { href: "/tienda", label: "Catálogo" },
  { href: "/tienda/favoritos", label: "Favoritos" },
  { href: "/tienda/perfil", label: "Perfil" },
  { href: "/tienda/contacto", label: "Contáctanos" },
  { href: "/tienda/terminos", label: "Términos" },
  { href: "/tienda/privacidad", label: "Privacidad" },
];

export function StoreHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function sync() {
      setLoggedIn(Boolean(getShopAccessToken()));
    }
    sync();
    window.addEventListener("shop-token-changed", sync);
    return () => window.removeEventListener("shop-token-changed", sync);
  }, []);

  function onLogout() {
    shopAuthApi.logout();
    setLoggedIn(false);
    router.push("/tienda");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/tienda" className="text-lg font-semibold tracking-tight text-foreground">
          Ferreteria
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                pathname === link.href ||
                  (link.href !== "/tienda" && pathname.startsWith(link.href))
                  ? "bg-muted font-medium text-foreground"
                  : "",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loggedIn ? (
            <Button type="button" size="sm" variant="outline" onClick={onLogout}>
              Salir
            </Button>
          ) : (
            <>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href="/tienda/login">Ingresar</Link>
              </Button>
              <Button type="button" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/tienda/registro">Registro</Link>
              </Button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            {!loggedIn ? (
              <Link
                href="/tienda/registro"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Registro
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
