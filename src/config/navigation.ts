/**
 * Árbol de navegación del AdminWeb.
 * Agrupa enlaces por dominio de negocio (RRHH/Employee, Payroll, inventario/Product, fiscal, etc.).
 */

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  Building2,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  PackagePlus,
  ReceiptText,
  Users,
} from "lucide-react";

/** Ítem de menú lateral (ruta + icono). */
export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

/** Grupo temático del sidebar (General, RRHH, Operaciones, Fiscal). */
export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

/**
 * Menú principal del panel.
 * Las rutas apuntan a módulos placeholder hasta implementar cada entidad.
 */
export const navigationGroups: NavigationGroup[] = [
  {
    title: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Reportes", href: "/reportes", icon: BarChart3 },
    ],
  },
  {
    title: "Recursos humanos",
    items: [
      { title: "Empleados", href: "/empleados", icon: Users },
      { title: "RRHH", href: "/rrhh/bancos", icon: Landmark },
      { title: "Planilla", href: "/planilla/periodos", icon: ReceiptText },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { title: "Inventario", href: "/inventario", icon: Boxes },
      { title: "Compras", href: "/compras/proveedores", icon: PackagePlus },
      { title: "Clientes", href: "/clientes", icon: Building2 },
      { title: "Importaciones", href: "/importaciones", icon: FileSpreadsheet },
    ],
  },
  {
    title: "Fiscal",
    items: [{ title: "Libros IVA", href: "/fiscal/libros-iva", icon: BookOpenCheck }],
  },
];
