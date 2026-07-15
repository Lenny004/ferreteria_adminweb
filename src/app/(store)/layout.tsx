/**
 * Layout público de tienda — sin AuthGuard admin.
 */

import { StoreFooter } from "@/components/store/store-footer";
import { StoreHeader } from "@/components/store/store-header";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <StoreHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <StoreFooter />
    </div>
  );
}
