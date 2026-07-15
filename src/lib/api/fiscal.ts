import { api, getAccessToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export type IvaReportType = "VENTAS_CF" | "VENTAS_CCF" | "COMPRAS";
export type IvaReportStatus = "BORRADOR" | "CERRADO";

export type IvaReportRow = {
  id: string;
  year: number;
  month: number;
  reportType: IvaReportType;
  status: IvaReportStatus;
  totalExenta: number;
  totalGravada: number;
  totalIva: number;
  generatedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  lineCount?: number;
};

export type IvaPeriodPreview = {
  reportType: IvaReportType;
  live: {
    totalExenta: number;
    totalGravada: number;
    totalIva: number;
    lineCount: number;
  };
  saved: IvaReportRow | null;
  balanced: boolean;
};

export type IvaPeriodResponse = {
  year: number;
  month: number;
  reports: IvaReportRow[];
  previews: IvaPeriodPreview[];
};

export type IvaReportDetail = IvaReportRow & {
  lines: Array<{
    date: string;
    documentNumber: string;
    documentType: string;
    partnerName: string;
    partnerTaxId: string | null;
    totalExenta: number;
    totalGravada: number;
    totalIva: number;
    total: number;
    sourceId: string;
  }>;
  liveTotals: {
    totalExenta: number;
    totalGravada: number;
    totalIva: number;
    lineCount: number;
  };
  balanced: boolean;
};

export type DteRow = {
  id: string;
  dteType: string;
  controlNumber: string;
  mhStatus: string;
  totalGravada: number;
  totalIva: number;
  totalPagar: number;
  issuedAt: string;
};

async function downloadBlob(path: string, fallbackName: string) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Error al descargar (${res.status})`);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  const match = cd?.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const fiscalApi = {
  listReports: (params?: { year?: number; month?: number }) => {
    const search = new URLSearchParams();
    if (params?.year) search.set("year", String(params.year));
    if (params?.month) search.set("month", String(params.month));
    const qs = search.toString();
    return api.get<IvaReportRow[]>(`/fiscal/iva-reports${qs ? `?${qs}` : ""}`);
  },
  getPeriod: (year: number, month: number) =>
    api.get<IvaPeriodResponse>(`/fiscal/iva-reports/period/${year}/${month}`),
  getReport: (id: string) => api.get<IvaReportDetail>(`/fiscal/iva-reports/${id}`),
  generate: (data: { year: number; month: number; reportType: IvaReportType; notes?: string }) =>
    api.post<IvaReportRow>("/fiscal/iva-reports/generate", data),
  close: (id: string) => api.post<IvaReportRow>(`/fiscal/iva-reports/${id}/close`),
  exportExcel: (id: string) => downloadBlob(`/fiscal/iva-reports/${id}/export`, "iva.xlsx"),
  listDte: (params?: { year?: number; month?: number; dteType?: string; take?: number }) => {
    const search = new URLSearchParams();
    if (params?.year) search.set("year", String(params.year));
    if (params?.month) search.set("month", String(params.month));
    if (params?.dteType) search.set("dteType", params.dteType);
    if (params?.take) search.set("take", String(params.take));
    const qs = search.toString();
    return api.get<{ items: DteRow[]; total: number }>(`/fiscal/dte${qs ? `?${qs}` : ""}`);
  },
};
