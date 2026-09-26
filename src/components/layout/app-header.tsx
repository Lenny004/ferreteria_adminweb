"use client";

/**
 * Encabezado sticky del área autenticada.
 */

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNav } from "@/components/layout/app-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-primary/20 bg-card/90 backdrop-blur-md">
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent" aria-hidden="true" />
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <Breadcrumbs />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
