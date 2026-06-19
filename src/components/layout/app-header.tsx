import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Ambiente administrativo</span>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
            ADMIN
          </span>
        </div>
      </div>
    </header>
  );
}
