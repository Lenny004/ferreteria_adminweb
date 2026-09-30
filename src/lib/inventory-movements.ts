/**
 * Reglas puras para interpretar y presentar movimientos de inventario.
 */

/** Tipos de movimiento válidos según el dominio de inventario. */
export const MOVEMENT_TYPES = [
  "ENTRADA_COMPRA",
  "ENTRADA_DEVOLUCION",
  "AJUSTE_ENTRADA",
  "SALIDA_VENTA",
  "AJUSTE_SALIDA",
] as const;

/** Tipo unión de los movimientos de inventario reconocidos por el panel. */
export type InventoryMovementType = (typeof MOVEMENT_TYPES)[number];

/** Tipos de movimiento que el formulario administrativo permite registrar. */
export const ADMIN_MOVEMENT_TYPES = [
  "ENTRADA_COMPRA",
  "AJUSTE_ENTRADA",
  "AJUSTE_SALIDA",
] as const satisfies readonly InventoryMovementType[];

/** Tipo unión de las opciones manuales disponibles para administradores. */
export type AdminInventoryMovementType = (typeof ADMIN_MOVEMENT_TYPES)[number];

/** Etiquetas en español para los tipos de movimiento reconocidos. */
export const MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  ENTRADA_COMPRA: "Entrada por compra",
  ENTRADA_DEVOLUCION: "Devolución de venta",
  AJUSTE_ENTRADA: "Ajuste de entrada",
  SALIDA_VENTA: "Venta",
  AJUSTE_SALIDA: "Ajuste de salida",
};

const MOVEMENT_DIRECTIONS: Record<InventoryMovementType, "ENTRADA" | "SALIDA"> = {
  ENTRADA_COMPRA: "ENTRADA",
  ENTRADA_DEVOLUCION: "ENTRADA",
  AJUSTE_ENTRADA: "ENTRADA",
  SALIDA_VENTA: "SALIDA",
  AJUSTE_SALIDA: "SALIDA",
};

/**
 * Indica si una cadena corresponde a un tipo de movimiento conocido.
 *
 * @param type - Tipo recibido desde la API o una fuente externa
 * @returns `true` cuando el tipo pertenece a la lista de movimientos válidos
 */
function isInventoryMovementType(type: string): type is InventoryMovementType {
  return (MOVEMENT_TYPES as readonly string[]).includes(type);
}

/**
 * Obtiene la etiqueta visible de un movimiento sin ocultar tipos desconocidos.
 *
 * @param type - Tipo de movimiento recibido
 * @returns Etiqueta en español o el valor original si no está reconocido
 */
export function movementLabel(type: string): string {
  return isInventoryMovementType(type) ? MOVEMENT_LABELS[type] : type;
}

/**
 * Resuelve la dirección del movimiento usando la respuesta nueva o el tipo legado.
 *
 * @param row - Movimiento con dirección opcional y tipo recibido
 * @returns Dirección de entrada/salida o `null` si no puede determinarse
 */
export function movementDirection(row: {
  movementType: string;
  direction?: "ENTRADA" | "SALIDA" | null;
}): "ENTRADA" | "SALIDA" | null {
  if (row.direction) return row.direction;
  return isInventoryMovementType(row.movementType)
    ? MOVEMENT_DIRECTIONS[row.movementType]
    : null;
}

/**
 * Formatea una cantidad con signo según la dirección del movimiento.
 *
 * @param quantity - Magnitud recibida como número o texto
 * @param direction - Dirección que determina el signo visible
 * @returns Cantidad localizada y normalizada como magnitud positiva o con signo
 */
export function formatSignedQuantity(
  quantity: string | number,
  direction: "ENTRADA" | "SALIDA" | null,
): string {
  const numeric = typeof quantity === "number" ? quantity : Number(quantity);
  if (Number.isNaN(numeric)) return String(quantity);
  const magnitude = Math.abs(numeric);
  const formatted = magnitude.toLocaleString("es-SV", { maximumFractionDigits: 3 });
  if (direction === "ENTRADA") return `+${formatted}`;
  if (direction === "SALIDA") return `-${formatted}`;
  return formatted;
}

/**
 * Devuelve la clase semántica para una entrada, salida o movimiento desconocido.
 *
 * @param direction - Dirección resuelta del movimiento
 * @returns Clase de color del panel
 */
export function movementDirectionClass(direction: "ENTRADA" | "SALIDA" | null): string {
  if (direction === "ENTRADA") return "text-success";
  if (direction === "SALIDA") return "text-danger";
  return "text-muted-foreground";
}
