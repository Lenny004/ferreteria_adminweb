"use client";

/**
 * Barra lateral del layout admin (desktop + drawer móvil).
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { navigationGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6 px-4 py-6">
      {navigationGroups.map((group) => (
        <section key={group.title}>
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </h2>
          <div className="mt-2 space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center border-b border-border px-6">
      <div>
        <p className="text-sm font-semibold text-primary">Ferreteria</p>
        <p className="text-xs text-muted-foreground">AdminWeb</p>
      </div>
    </div>
  );
}

/** Sidebar fijo en desktop. */
export function AppSidebar() {
  return (
    <aside className="hidden border-r border-border bg-card lg:block">
      <Brand />
      <NavLinks />
    </aside>
  );
}

/** Botón + drawer de navegación para viewport &lt; lg. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,280px)] flex-col border-r border-border bg-card shadow-lg outline-none lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Dialog.Title className="text-sm font-semibold text-primary">
              Ferreteria
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" size="sm" variant="ghost" aria-label="Cerrar menú">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
