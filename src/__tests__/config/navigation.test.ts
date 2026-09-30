import { filterNavigationGroups, navigationGroups } from "@/config/navigation";

describe("navegación de inventario por rol", () => {
  it("muestra conteos físicos a ACCOUNTANT pero no movimientos y stock", () => {
    const groups = filterNavigationGroups(navigationGroups, "ACCOUNTANT");
    const inventory = groups.flatMap((group) => group.items).find((item) => item.title === "Inventario");
    expect(inventory?.children).toEqual([{ title: "Conteos físicos", href: "/inventario/conteos" }]);
  });
});
