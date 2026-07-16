/**
 * Layout del área autenticada `(admin)`.
 */

import { AuthGuard } from "@/components/auth-guard";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/contexts/session-context";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <SessionProvider>
        <div className="min-h-screen bg-background lg:grid lg:grid-cols-[272px_1fr]">
          <AppSidebar />
          <div className="flex min-h-screen min-w-0 flex-col">
            <AppHeader />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
            <AppFooter />
          </div>
        </div>
      </SessionProvider>
    </AuthGuard>
  );
}
