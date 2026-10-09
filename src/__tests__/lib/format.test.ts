/** Pruebas del formateo regional de moneda, números y fechas. */

import { formatDate, formatDateTime, formatMoney, formatNumber } from "@/lib/format";

describe("format", () => {
  it("formatea moneda USD con dos decimales", () => {
    expect(formatMoney(1234.5)).toBe("$1,234.50");
  });

  it("formatea números y conserva valores vacíos o inválidos", () => {
    expect(formatNumber(1234.567, 2)).toBe("1,234.57");
    expect(formatNumber(null, 2)).toBe("—");
    expect(formatNumber("texto", 2)).toBe("texto");
  });

  it("no desplaza fechas ISO de solo día", () => {
    expect(formatDate("2024-01-15")).toBe("15/01/2024");
  });

  it("formatea fecha y hora en la zona del negocio", () => {
    expect(formatDateTime("2024-01-15T18:30:00Z")).toMatch(/^15\/01\/2024,/);
    expect(formatDateTime("invalid-date")).toBe("invalid-date");
  });
});
