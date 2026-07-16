"use client";

/**
 * Encabezado sticky del área autenticada.
 */

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { MobileNav } from "@/components/layout/app-sidebar";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav />
          <Breadcrumbs />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
