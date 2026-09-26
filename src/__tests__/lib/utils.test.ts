/**
 * Pruebas para utilidades: formateo de fechas, moneda y helpers.
 */

import { formatDateTime, formatMoney } from "@/lib/utils";

describe("Utils", () => {
  describe("formatMoney", () => {
    it("debe formatear valores monetarios correctamente", () => {
      expect(formatMoney(100)).toBe("$100.00");
      expect(formatMoney(1234.56)).toBe("$1,234.56");
      expect(formatMoney(0)).toBe("$0.00");
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
});
