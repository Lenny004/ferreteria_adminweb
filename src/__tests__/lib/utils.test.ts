/**
 * Pruebas para utilidades: formateo de fechas, moneda y helpers.
 */

import { cn, formatDate, formatDateTime, formatMoney } from "@/lib/utils";

describe("Utils", () => {
  describe("formatMoney", () => {
    it("debe formatear valores monetarios correctamente", () => {
      const expected = (value: number) => value.toLocaleString("es-SV", { style: "currency", currency: "USD" });
      expect(formatMoney(100)).toBe(expected(100));
      expect(formatMoney(1234.56)).toBe(expected(1234.56));
      expect(formatMoney(0)).toBe(expected(0));
    });

    it("debe manejar valores negativos", () => {
      expect(formatMoney(-100)).toContain("100.00");
    });

    it("debe manejar valores decimales", () => {
      expect(formatMoney(0.99)).toBe("$0.99");
      expect(formatMoney(123.456)).toContain("123.46");
    });

    it("debe manejar valores muy grandes", () => {
      const result = formatMoney(1000000);
      expect(result).toContain("1,000,000");
    });

    it("debe conservar entradas no numéricas y valores vacíos", () => {
      expect(formatMoney("texto")).toBe("texto");
      expect(formatMoney(null)).toBe("—");
    });
  });

  describe("formatDateTime", () => {
    it("debe formatear fechas ISO correctamente", () => {
      const date = "2024-01-15T10:30:00Z";
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it("debe manejar fechas inválidas", () => {
      const result = formatDateTime("invalid-date");
      expect(result).toBeTruthy();
    });
  });

  it("formatea fechas cortas y conserva fechas inválidas", () => {
    expect(formatDate("2024-01-15")).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(formatDate("invalid-date")).toBe("invalid-date");
    expect(formatDate()).toBe("—");
  });

  it("combina clases con prioridad Tailwind", () => {
    expect(cn("px-2", "px-4")).toContain("px-4");
  });
});
