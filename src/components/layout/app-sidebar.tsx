import Link from "next/link";

import { navigationGroups } from "@/config/navigation";

export function AppSidebar() {
  return (
    <aside className="hidden border-r border-border bg-card lg:block">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div>
          <p className="text-sm font-semibold text-primary">FlexoCable SV</p>
          <p className="text-xs text-muted-foreground">AdminWeb</p>
        </div>
      </div>
      <nav className="space-y-6 px-4 py-6">
        {navigationGroups.map((group) => (
          <section key={group.title}>
            <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.title}
            </h2>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                    href={item.href}
                    key={item.href}
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
    </aside>
  );
}
