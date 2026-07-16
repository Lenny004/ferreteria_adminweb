"use client";

/**
 * Navegación lateral de departamentos y subfamilias del catálogo de tienda.
 */

import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  Droplets,
  Hammer,
  HardHat,
  Lightbulb,
  Package,
  Paintbrush,
  Plug,
  Shield,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type StoreFamily = {
  id: string;
  name: string;
  code: string;
  iconKey?: string | null;
  slug?: string | null;
};

export type StoreSubfamily = {
  id: string;
  name: string;
  code: string;
  familyId?: string;
};

export type StoreSideNavProps = {
  families: StoreFamily[];
  selectedFamilyId?: string | null;
  selectedSubfamilyId?: string | null;
  subfamilies?: StoreSubfamily[];
  onSelectFamily: (id: string | null) => void;
  onSelectSubfamily: (id: string | null) => void;
  className?: string;
};

const ICON_MAP: Record<string, LucideIcon> = {
  package: Package,
  wrench: Wrench,
  hammer: Hammer,
  paintbrush: Paintbrush,
  plug: Plug,
  hardhat: HardHat,
  "hard-hat": HardHat,
  zap: Zap,
  droplets: Droplets,
  lightbulb: Lightbulb,
  shield: Shield,
};

function resolveFamilyIcon(iconKey?: string | null): LucideIcon {
  if (!iconKey) return Package;
  const key = iconKey.trim().toLowerCase();
  return ICON_MAP[key] ?? Package;
}

function NavButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-left text-sm transition",
        active
          ? "bg-primary font-medium text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

function SideNavContent({
  families,
  selectedFamilyId,
  selectedSubfamilyId,
  subfamilies = [],
  onSelectFamily,
  onSelectSubfamily,
}: Omit<StoreSideNavProps, "className">) {
  const allSelected = !selectedFamilyId && !selectedSubfamilyId;
  const visibleSubfamilies = selectedFamilyId
    ? subfamilies.filter((s) => !s.familyId || s.familyId === selectedFamilyId)
    : [];

  return (
    <nav aria-label="Departamentos" className="space-y-1">
      <NavButton
        active={allSelected}
        onClick={() => {
          onSelectFamily(null);
          onSelectSubfamily(null);
        }}
      >
        Todos
      </NavButton>

      {families.map((family) => {
        const Icon = resolveFamilyIcon(family.iconKey);
        const isSelected = selectedFamilyId === family.id;
        const showSubfamilies = isSelected && visibleSubfamilies.length > 0;

        return (
          <div key={family.id} className="space-y-0.5">
            <NavButton
              active={isSelected && !selectedSubfamilyId}
              onClick={() => {
                onSelectFamily(family.id);
                onSelectSubfamily(null);
              }}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                <span className="min-w-0 truncate">{family.name}</span>
              </span>
            </NavButton>

            {showSubfamilies ? (
              <div className="ml-4 space-y-0.5 border-l border-border py-0.5 pl-3">
                {visibleSubfamilies.map((subfamily) => (
                  <NavButton
                    key={subfamily.id}
                    active={selectedSubfamilyId === subfamily.id}
                    onClick={() => {
                      onSelectFamily(family.id);
                      onSelectSubfamily(subfamily.id);
                    }}
                    className="py-1.5 text-xs"
                  >
                    {subfamily.name}
                  </NavButton>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function StoreSideNav({
  families,
  selectedFamilyId,
  selectedSubfamilyId,
  subfamilies,
  onSelectFamily,
  onSelectSubfamily,
  className,
}: StoreSideNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedFamily = families.find((f) => f.id === selectedFamilyId);
  const mobileLabel = selectedFamily?.name ?? "Todos";

  return (
    <>
      <div className={cn("md:hidden", className)}>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <span className="truncate text-left">
            <span className="text-muted-foreground">Categoría: </span>
            {mobileLabel}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", mobileOpen && "rotate-180")}
            aria-hidden="true"
          />
        </Button>

        {mobileOpen ? (
          <div className="mt-2 rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-sm)]">
            <SideNavContent
              families={families}
              selectedFamilyId={selectedFamilyId}
              selectedSubfamilyId={selectedSubfamilyId}
              subfamilies={subfamilies}
              onSelectFamily={(id) => {
                onSelectFamily(id);
                onSelectSubfamily(null);
                setMobileOpen(false);
              }}
              onSelectSubfamily={(id) => {
                onSelectSubfamily(id);
                setMobileOpen(false);
              }}
            />
          </div>
        ) : null}
      </div>

      <aside
        className={cn(
          "hidden md:block md:sticky md:top-24 md:self-start",
          "rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-sm)]",
          className,
        )}
      >
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Departamentos
        </p>
        <SideNavContent
          families={families}
          selectedFamilyId={selectedFamilyId}
          selectedSubfamilyId={selectedSubfamilyId}
          subfamilies={subfamilies}
          onSelectFamily={onSelectFamily}
          onSelectSubfamily={onSelectSubfamily}
        />
      </aside>
    </>
  );
}
