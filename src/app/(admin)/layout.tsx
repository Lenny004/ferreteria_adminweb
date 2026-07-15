/**
 * Layout del área autenticada `(admin)`.
 */

import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SessionProvider } from "@/contexts/session-context";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <SessionProvider>
        <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_1fr]">
          <AppSidebar />
          <div className="min-w-0">
            <AppHeader />
            <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </SessionProvider>
    </AuthGuard>
  );
}
