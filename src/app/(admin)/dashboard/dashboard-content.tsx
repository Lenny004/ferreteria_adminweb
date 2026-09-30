"use client";

/**
 * Dashboard gerencial: KPIs de ventas, inventario, compras y RRHH (`/dashboard/summary`).
 */
import {
  AlertTriangle,
  Boxes,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import { hasReturns, returnsHint, salesBreakdown } from "@/lib/net-sales";
import { formatMoney } from "@/lib/utils";
import type { DashboardSummary } from "@/lib/api/dashboard";
import type { LucideIcon } from "lucide-react";

/** Props de la tarjeta reutilizable para indicadores del dashboard. */
type KpiProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
};

/** Muestra un indicador principal con su explicación secundaria opcional. */
function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: KpiProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
        <div className="space-y-1.5">
          <CardDescription className="font-medium">{label}</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{value}</CardTitle>
        </div>
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>
      ) : null}
    </Card>
  );
}

/** Encabezado visual uniforme para cada familia de información. */
function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  );
}

/** Estado de carga del dashboard con la misma estructura general de la vista. */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-xl border border-border bg-card" />
        <div className="h-72 rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}

/** Convierte una fecha ISO del backend a una etiqueta corta legible en el eje X. */
function formatShortDate(date: string): string {
  const [, month, day] = date.split("-");
  return month && day ? `${day}/${month}` : date;
}

/** Composición de la tarjeta de ventas por día para los últimos siete días. */
function DailySalesCard({ sales }: { sales: DashboardSummary["sales"] }) {
  if (!sales.daily) return null;

  const dailyData = sales.daily.map((day) => ({
    ...day,
    label: formatShortDate(day.date),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas últimos 7 días</CardTitle>
        <CardDescription>Ventas netas y devoluciones por día.</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {dailyData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin ventas en los últimos 7 días.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip
                formatter={(value, name) => [
                  formatMoney(Number(value)),
                  name === "Devoluciones" ? "Devoluciones" : "Ventas netas",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              />
              <Legend />
              <Bar dataKey="net" name="Ventas netas" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              <Bar
                dataKey="returns"
                name="Devoluciones"
                fill="var(--danger)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/** Lista el neto mensual por familia y explica devoluciones cuando existen. */
function CategorySalesCard({ sales }: { sales: DashboardSummary["sales"] }) {
  if (!sales.byCategory) return null;
  const categories = sales.byCategory;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas por categoría (mes)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {categories.length === 0 ? (
          <p className="text-muted-foreground">Sin ventas en el mes.</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.familyId}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {category.code} — {category.name}
                </p>
                {category.returns > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Bruto {formatMoney(category.gross)} · Devoluciones {formatMoney(-Math.abs(category.returns))}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-medium">{formatMoney(category.net)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/** Dashboard gerencial con KPIs netos y los principales desgloses de ventas. */
export default function DashboardContent() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No se pudo cargar el resumen</CardTitle>
          <CardDescription>
            Verifica que la API esté en marcha e intenta recargar la página.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { sales, inventory, purchases, hr } = data;
  const chartData = sales.topProducts.map((p) => ({
    name: p.code,
    monto: p.amount,
    returnedAmount: p.returnedAmount ?? 0,
  }));
  const today = salesBreakdown(sales, "today");
  const week = salesBreakdown(sales, "week");
  const month = salesBreakdown(sales, "month");
  const ticketHint =
    sales.avgTicketGross == null ? undefined : `Bruto ${formatMoney(sales.avgTicketGross)}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`KPIs operativos · actualizado ${new Date(data.generatedAt).toLocaleString("es-SV")}`}
      />

      <section className="space-y-4">
        <SectionTitle>Ventas</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Ventas netas · Hoy"
            value={formatMoney(today.net)}
            hint={[`${today.tx} tickets`, returnsHint(today)].filter(Boolean).join(" · ")}
            icon={TrendingUp}
          />
          <Kpi
            label="Ventas netas · Semana"
            value={formatMoney(week.net)}
            hint={[`${week.tx} tickets`, returnsHint(week)].filter(Boolean).join(" · ")}
            icon={ShoppingCart}
          />
          <Kpi
            label="Ventas netas · Mes"
            value={formatMoney(month.net)}
            hint={
              [
                `${month.tx} tickets`,
                sales.monthOverMonthPct == null
                  ? undefined
                  : `${sales.monthOverMonthPct}% vs mes ant. (neto)`,
                returnsHint(month),
              ]
                .filter(Boolean)
                .join(" · ")
            }
            icon={TrendingUp}
          />
          <Kpi
            label="Ticket promedio neto"
            value={formatMoney(sales.avgTicket)}
            hint={ticketHint}
            icon={Package}
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top productos (mes, neto)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin ventas en el mes.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const returnedAmount = Number(
                          (item.payload as { returnedAmount?: number }).returnedAmount ?? 0,
                        );
                        const returnedLabel =
                          returnedAmount > 0
                            ? ` · Devuelto ${formatMoney(-returnedAmount)}`
                            : "";
                        return [`${formatMoney(Number(value))}${returnedLabel}`, "Neto"];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                      }}
                    />
                    <Bar dataKey="monto" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Por tipo de orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {sales.byOrderType.length === 0 ? (
                <p className="text-muted-foreground">Sin datos.</p>
              ) : (
                sales.byOrderType.map((t) => (
                  <div
                    key={t.orderType}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/60"
                  >
                    <span className="font-medium">{t.orderType}</span>
                    <span className="text-muted-foreground">
                      {formatMoney(t.total)} · {t.count}
                      {hasReturns({ returns: t.returns ?? 0 })
                        ? ` · ${formatMoney(-Math.abs(t.returns ?? 0))} devol.`
                        : ""}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DailySalesCard sales={sales} />
          <CategorySalesCard sales={sales} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Inventario</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Valor stock" value={formatMoney(inventory.totalValue)} icon={Boxes} />
          <Kpi label="Productos activos" value={String(inventory.activeProducts)} icon={Package} />
          <Kpi label="Bajo mínimo" value={String(inventory.belowMin)} icon={AlertTriangle} />
          <Kpi label="Alertas abiertas" value={String(inventory.openAlerts)} icon={AlertTriangle} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>Compras</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="OC pendientes" value={String(purchases.pendingOrders)} icon={ShoppingCart} />
          <Kpi
            label="Comprado mes"
            value={formatMoney(purchases.monthTotal)}
            hint={`${purchases.monthCount} OC recibidas`}
            icon={Package}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top proveedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {purchases.topSuppliers.length === 0 ? (
                <p className="text-muted-foreground">Sin compras.</p>
              ) : (
                purchases.topSuppliers.map((s) => (
                  <div
                    key={s.supplierId}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/60"
                  >
                    <span>{s.name}</span>
                    <span className="font-medium">{formatMoney(s.total)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>RRHH</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Empleados activos" value={String(hr.activeEmployees)} icon={Users} />
          <Kpi
            label="Docs por vencer (30d)"
            value={String(hr.documentsExpiring30d)}
            icon={AlertTriangle}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Planillas pendientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {hr.upcomingPayroll.length === 0 ? (
                <p className="text-muted-foreground">Ninguna en revisión/aprobada.</p>
              ) : (
                hr.upcomingPayroll.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-muted/60"
                  >
                    <span>
                      {r.name} · {r.status}
                    </span>
                    <span className="font-medium">{formatMoney(r.totalNet)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Headcount por contrato</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {hr.headcountByContract.map((h) => (
              <div
                key={h.contractType}
                className="rounded-full border border-border bg-muted/50 px-3 py-1.5"
              >
                <span className="text-muted-foreground">{h.contractType}: </span>
                <span className="font-semibold">{h.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
