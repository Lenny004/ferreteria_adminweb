"use client";

/**
 * Botón circular de usuario: abre dropdown con Perfil y Cerrar sesión.
 */

import { ImageIcon, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/contexts/session-context";
import { logout } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  className?: string;
};

export function UserMenu({ className }: UserMenuProps) {
  const { user } = useSession();
  const router = useRouter();

  async function onLogout() {
    await logout();
    toast.success("Sesión cerrada");
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Menú de usuario"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground shadow-sm transition",
            "hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block truncate text-sm font-semibold text-foreground">
            {user.email}
          </span>
          <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {user.role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void onLogout();
          }}
          className="text-danger focus:bg-danger/10 focus:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
