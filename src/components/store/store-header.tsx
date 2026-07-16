"use client";

/**
 * Header de la tienda pública con carrito, pedidos y menú de cuenta.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImageIcon,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { cartApi } from "@/lib/api/cart";
import { getShopAccessToken, shopAuthApi } from "@/lib/api/shop-auth";

const SHOP_CART_QUERY_KEY = ["shop-cart"] as const;

const links = [
  { href: "/tienda", label: "Catálogo" },
  { href: "/tienda/favoritos", label: "Favoritos" },
  { href: "/tienda/pedidos", label: "Pedidos" },
  { href: "/tienda/contacto", label: "Contáctanos" },
] as const;

function getCartItemCount(data: unknown): number {
  if (!data || typeof data !== "object") return 0;
  const cart = data as { itemCount?: number; items?: unknown[] };
  if (typeof cart.itemCount === "number") return cart.itemCount;
  if (Array.isArray(cart.items)) return cart.items.length;
  return 0;
}

export function StoreHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);

  const cartQuery = useQuery({
    queryKey: SHOP_CART_QUERY_KEY,
    queryFn: () => cartApi.getCart(),
    enabled: loggedIn,
    retry: false,
  });

  const cartCount = getCartItemCount(cartQuery.data);

  useEffect(() => {
    function sync() {
      setLoggedIn(Boolean(getShopAccessToken()));
      void queryClient.invalidateQueries({ queryKey: SHOP_CART_QUERY_KEY });
    }
    sync();
    window.addEventListener("shop-token-changed", sync);
    return () => window.removeEventListener("shop-token-changed", sync);
  }, [queryClient]);

  function onLogout() {
    shopAuthApi.logout();
    setLoggedIn(false);
    queryClient.removeQueries({ queryKey: SHOP_CART_QUERY_KEY });
    router.push("/tienda");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/tienda" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            F
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">Ferreteria</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
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
          <Link
            href="/tienda/carrito"
            aria-label="Carrito"
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground shadow-sm transition",
              "hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pathname.startsWith("/tienda/carrito")
                ? "border-primary/40 bg-primary/10 text-primary"
                : "",
            )}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menú de cuenta"
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground shadow-sm transition",
                  "hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {loggedIn ? (
                <>
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tienda/perfil">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tienda/pedidos">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Pedidos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tienda/carrito">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      Carrito
                      {cartCount > 0 ? (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {cartCount > 99 ? "99+" : cartCount}
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      onLogout();
                    }}
                    className="text-danger focus:bg-danger/10 focus:text-danger"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>Acceso</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tienda/login">
                      <LogIn className="h-4 w-4 text-muted-foreground" />
                      Ingresar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/tienda/registro">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      Registro
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            size="icon"
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
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
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
            <Link
              href="/tienda/carrito"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Carrito{cartCount > 0 ? ` (${cartCount})` : ""}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
