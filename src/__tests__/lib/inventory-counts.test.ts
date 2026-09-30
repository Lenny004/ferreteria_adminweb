import {
  calculateUiVariance,
  canWriteCounts,
  formatVariance,
  getVarianceClass,
  validateCountedQuantity,
} from "@/lib/inventory-counts";

describe("reglas de conteos físicos", () => {
  it("valida cero, rango y cantidad de decimales", () => {
    expect(validateCountedQuantity("0", 0)).toBeNull();
    expect(validateCountedQuantity("1.25", 2)).toBeNull();
    expect(validateCountedQuantity("1.256", 2)).toMatch(/m[aá]ximo 2/);
    expect(validateCountedQuantity("-1", 2)).toBe("Ingresa un número válido");
    expect(validateCountedQuantity("", 2)).toBe("Ingresa una cantidad");
  });

  it("calcula la diferencia contra el stock congelado o el stock actual como vista previa", () => {
    expect(calculateUiVariance("12", "10", "99")).toBe(2);
    expect(calculateUiVariance("12", null, "10")).toBe(2);
    expect(calculateUiVariance(null, null, "10")).toBeNull();
  });

  it("formatea y colorea sobrantes y faltantes", () => {
    expect(formatVariance(2)).toBe("+2");
    expect(formatVariance(-1.5, 2)).toBe("-1.5");
    expect(getVarianceClass(2)).toBe("text-success");
    expect(getVarianceClass(-1)).toBe("text-danger");
    expect(getVarianceClass(0)).toBe("text-muted-foreground");
  });

  it("solo permite escritura a ADMIN y OWNER", () => {
    expect(canWriteCounts("ADMIN")).toBe(true);
    expect(canWriteCounts("OWNER")).toBe(true);
    expect(canWriteCounts("ACCOUNTANT")).toBe(false);
  });
});
