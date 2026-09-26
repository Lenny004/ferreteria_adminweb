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
  Mail,
  PackagePlus,
  ReceiptText,
  Users,
} from "lucide-react";

/** Enlace hijo dentro de un módulo desplegable. */
export type NavigationChild = {
  title: string;
  href: string;
};

/** Ítem de menú lateral (ruta + icono; opcionalmente con hijos en dropdown). */
export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavigationChild[];
};

/** Grupo temático del sidebar (General, RRHH, Operaciones, Fiscal). */
export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

/** Menú principal del panel admin. */
export const navigationGroups: NavigationGroup[] = [
  {
    title: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Reportes", href: "/reportes", icon: BarChart3 },
      { title: "Mensajes", href: "/mensajes-contacto", icon: Mail },
    ],
  },
  {
    title: "Recursos humanos",
    items: [
      { title: "Empleados", href: "/empleados", icon: Users },
      {
        title: "RRHH",
        href: "/rrhh/bancos",
        icon: Landmark,
        children: [
          { title: "Bancos", href: "/rrhh/bancos" },
          { title: "Tipos documento", href: "/rrhh/tipos-documento" },
          { title: "Feriados", href: "/rrhh/feriados" },
        ],
      },
      {
        title: "Planilla",
        href: "/planilla/periodos",
        icon: ReceiptText,
        children: [
          { title: "Periodos", href: "/planilla/periodos" },
          { title: "Corridas", href: "/planilla/corridas" },
          { title: "Aguinaldo", href: "/planilla/aguinaldo" },
          { title: "Vacaciones", href: "/planilla/vacaciones" },
          { title: "Liquidaciones", href: "/planilla/liquidaciones" },
        ],
      },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { title: "Inventario", href: "/inventario", icon: Boxes },
      {
        title: "Compras",
        href: "/compras/proveedores",
        icon: PackagePlus,
        children: [
          { title: "Proveedores", href: "/compras/proveedores" },
          { title: "Órdenes", href: "/compras/ordenes" },
        ],
      },
      { title: "Clientes", href: "/clientes", icon: Building2 },
      { title: "Importaciones", href: "/importaciones", icon: FileSpreadsheet },
    ],
  },
  {
    title: "Fiscal",
    items: [{ title: "Libros IVA", href: "/fiscal/libros-iva", icon: BookOpenCheck }],
  },
];
