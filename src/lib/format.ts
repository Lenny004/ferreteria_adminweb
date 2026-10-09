/**
 * Formateadores de presentación para moneda, números y fechas del negocio.
 */

const LOCALE = "es-SV";
const BUSINESS_TIME_ZONE = "America/El_Salvador";
const EMPTY_VALUE = "—";

type FormatValue = string | number | Date | null | undefined;

function numericValue(value: string | number): number | null {
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function dateParts(value: Date, timeZone: string): Record<string, string> {
  return Object.fromEntries(
    new Intl.DateTimeFormat(LOCALE, {
      timeZone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(value)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value: part }) => [type, part]),
  );
}

function formatDateParts(parts: Record<string, string>): string {
  return `${parts.day}/${parts.month}/${parts.year}`;
}

/**
 * Formatea un importe como USD con dos decimales y locale salvadoreño.
 *
 * @param value - Importe numérico o texto numérico.
 * @returns Importe formateado, guion largo para vacío o el texto original si es inválido.
 */
export function formatMoney(value: string | number | null | undefined): string {
  if (value == null || (typeof value === "string" && value.trim() === "")) return EMPTY_VALUE;
  const parsed = numericValue(value);
  if (parsed === null) return String(value);
  return parsed.toLocaleString(LOCALE, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatea un número con una cantidad fija de decimales.
 *
 * @param value - Número o texto numérico.
 * @param decimals - Cantidad de decimales que se mostrarán.
 * @returns Número formateado, guion largo para vacío o el texto original si es inválido.
 */
export function formatNumber(value: string | number | null | undefined, decimals = 2): string {
  if (value == null || (typeof value === "string" && value.trim() === "")) return EMPTY_VALUE;
  const parsed = numericValue(value);
  if (parsed === null) return String(value);
  const safeDecimals = Number.isFinite(decimals) ? Math.max(0, Math.trunc(decimals)) : 0;
  return parsed.toLocaleString(LOCALE, {
    minimumFractionDigits: safeDecimals,
    maximumFractionDigits: safeDecimals,
  });
}

function parseDate(value: FormatValue): { date: Date; dateOnly: boolean } | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : { date: value, dateOnly: false };
  }
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    return valid ? { date, dateOnly: true } : null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : { date, dateOnly: false };
}

/**
 * Formatea una fecha como `dd/mm/aaaa` sin desplazar fechas ISO de solo día.
 *
 * @param value - Fecha ISO, timestamp, Date o valor vacío.
 * @returns Fecha formateada, guion largo para vacío o el texto original si es inválido.
 */
export function formatDate(value?: FormatValue): string {
  if (value == null || (typeof value === "string" && value.trim() === "")) return EMPTY_VALUE;
  const parsed = parseDate(value);
  if (!parsed) return String(value);
  const parts = dateParts(parsed.date, parsed.dateOnly ? "UTC" : BUSINESS_TIME_ZONE);
  return formatDateParts(parts);
}

/**
 * Formatea fecha y hora en `es-SV` usando la zona del negocio.
 *
 * @param value - Fecha ISO, timestamp, Date o valor vacío.
 * @returns Fecha y hora formateadas, guion largo para vacío o el texto original si es inválido.
 */
export function formatDateTime(value?: FormatValue): string {
  if (value == null || (typeof value === "string" && value.trim() === "")) return EMPTY_VALUE;
  const parsed = parseDate(value);
  if (!parsed) return String(value);
  if (parsed.dateOnly) return formatDate(value);
  const parts = dateParts(parsed.date, BUSINESS_TIME_ZONE);
  return `${formatDateParts(parts)}, ${parts.hour}:${parts.minute}`;
}
