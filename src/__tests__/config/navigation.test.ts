import { filterNavigationGroups, navigationGroups } from "@/config/navigation";

describe("navegación de inventario por rol", () => {
  it("muestra conteos físicos a ACCOUNTANT pero no movimientos y stock", () => {
    const groups = filterNavigationGroups(navigationGroups, "ACCOUNTANT");
    const inventory = groups.flatMap((group) => group.items).find((item) => item.title === "Inventario");
    expect(inventory?.children).toEqual([{ title: "Conteos físicos", href: "/inventario/conteos" }]);
  });
});

describe("navegación de pedidos de tienda por rol", () => {
  it("muestra pedidos de tienda a ADMIN y OWNER, pero no a ACCOUNTANT", () => {
    expect(filterNavigationGroups(navigationGroups, "ADMIN").flatMap((group) => group.items).some((item) => item.href === "/pedidos-tienda")).toBe(true);
    expect(filterNavigationGroups(navigationGroups, "OWNER").flatMap((group) => group.items).some((item) => item.href === "/pedidos-tienda")).toBe(true);
    expect(filterNavigationGroups(navigationGroups, "ACCOUNTANT").flatMap((group) => group.items).some((item) => item.href === "/pedidos-tienda")).toBe(false);
  });
});
