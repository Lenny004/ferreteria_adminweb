import {
  ADMIN_MOVEMENT_TYPES,
  MOVEMENT_LABELS,
  MOVEMENT_TYPES,
  formatSignedQuantity,
  movementDirection,
  movementDirectionClass,
  movementLabel,
} from "@/lib/inventory-movements";

describe("reglas de movimientos de inventario", () => {
  it("expone las etiquetas de los cinco tipos reales y conserva desconocidos", () => {
    expect(MOVEMENT_TYPES).toEqual([
      "ENTRADA_COMPRA",
      "ENTRADA_DEVOLUCION",
      "AJUSTE_ENTRADA",
      "SALIDA_VENTA",
      "AJUSTE_SALIDA",
    ]);
    expect(MOVEMENT_LABELS).toEqual({
      ENTRADA_COMPRA: "Entrada por compra",
      ENTRADA_DEVOLUCION: "Devolución de venta",
      AJUSTE_ENTRADA: "Ajuste de entrada",
      SALIDA_VENTA: "Venta",
      AJUSTE_SALIDA: "Ajuste de salida",
    });
    expect(movementLabel("SALIDA_VENTA")).toBe("Venta");
    expect(movementLabel("TIPO_DESCONOCIDO")).toBe("TIPO_DESCONOCIDO");
  });

  it("expone las tres opciones administrativas con sus valores y etiquetas", () => {
    expect(ADMIN_MOVEMENT_TYPES).toEqual([
      "ENTRADA_COMPRA",
      "AJUSTE_ENTRADA",
      "AJUSTE_SALIDA",
    ]);
    expect(ADMIN_MOVEMENT_TYPES.map((type) => MOVEMENT_LABELS[type])).toEqual([
      "Entrada por compra",
      "Ajuste de entrada",
      "Ajuste de salida",
    ]);
  });

  it("prioriza direction y deriva la dirección para respuestas antiguas", () => {
    expect(movementDirection({ movementType: "SALIDA_VENTA", direction: "ENTRADA" })).toBe("ENTRADA");
    expect(movementDirection({ movementType: "ENTRADA_DEVOLUCION" })).toBe("ENTRADA");
    expect(movementDirection({ movementType: "AJUSTE_SALIDA", direction: null })).toBe("SALIDA");
    expect(movementDirection({ movementType: "TIPO_DESCONOCIDO" })).toBeNull();
  });

  it("normaliza magnitud, signo y decimales según la dirección", () => {
    expect(formatSignedQuantity("5", "ENTRADA")).toBe("+5");
    expect(formatSignedQuantity(-2, "SALIDA")).toBe("-2");
    expect(formatSignedQuantity("-2", "SALIDA")).toBe("-2");
    expect(formatSignedQuantity("1234.5678", "ENTRADA")).toBe("+1,234.568");
    expect(formatSignedQuantity(-5, null)).toBe("5");
  });

  it("usa las clases semánticas del panel", () => {
    expect(movementDirectionClass("ENTRADA")).toBe("text-success");
    expect(movementDirectionClass("SALIDA")).toBe("text-danger");
    expect(movementDirectionClass(null)).toBe("text-muted-foreground");
  });
  it("devuelve el valor original si la cantidad no es numérica", () => {
    expect(formatSignedQuantity("n/d", "SALIDA")).toBe("n/d");
  });
});
