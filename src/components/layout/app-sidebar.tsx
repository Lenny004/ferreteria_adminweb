"use client";

/**
 * Barra lateral del layout admin (desktop + drawer móvil).
 * Módulos con hijos se muestran como dropdown colapsable.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { navigationGroups, type NavigationItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemIsActive(pathname: string, item: NavigationItem) {
  if (item.children?.length) {
    return item.children.some((child) => isPathActive(pathname, child.href));
  }
  return isPathActive(pathname, item.href);
}

function NavItemLink({
  item,
  onNavigate,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = itemIsActive(pathname, item);
  const hasChildren = Boolean(item.children?.length);
  const [open, setOpen] = useState(active);
  const panelId = useId();

  useEffect(() => {
    if (active) setOpen(true);
  }, [active, pathname]);

  const Icon = item.icon;

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary-foreground" : "text-sidebar-muted group-hover:text-sidebar-foreground",
          )}
        />
        {item.title}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
          active
            ? "bg-sidebar-accent text-sidebar-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-sidebar-muted" />
        <span className="min-w-0 flex-1">{item.title}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-sidebar-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-4 space-y-0.5 border-l border-sidebar-border py-1 pl-3">
            {item.children!.map((child) => {
              const childActive = isPathActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition",
                    childActive
                      ? "bg-primary/15 font-semibold text-primary"
                      : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-7 px-3 py-5">
      {navigationGroups.map((group) => (
        <section key={group.title}>
          <h2 className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
            {group.title}
          </h2>
          <div className="mt-2.5 space-y-1">
            {group.items.map((item) => (
              <NavItemLink
                key={item.title + item.href}
                item={item}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        F
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
          Ferreteria
        </p>
        <p className="truncate text-xs text-sidebar-muted">Panel admin</p>
      </div>
    </div>
  );
}

function SidebarChrome({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <Brand />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-sidebar-muted">
          Ferreteria ERP · AdminWeb
        </p>
      </div>
    </div>
  );
}

/** Sidebar fijo en desktop. */
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen border-r border-sidebar-border lg:block">
      <SidebarChrome />
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
          size="icon"
          variant="outline"
          className="lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(100%,300px)] flex-col bg-sidebar shadow-2xl outline-none lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Dialog.Title className="text-sm font-semibold text-sidebar-foreground">
              Menú
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                aria-label="Cerrar menú"
              >
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
