/**
 * Dashboard gerencial: KPIs de ventas, inventario, compras y RRHH (`/dashboard/summary`).
 */
"use client";

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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/use-dashboard";
import type { LucideIcon } from "lucide-react";

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
}) {
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

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  );
}

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
  }));

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
            label="Hoy"
            value={formatMoney(sales.today)}
            hint={`${sales.todayTx} tickets`}
            icon={TrendingUp}
          />
          <Kpi
            label="Semana"
            value={formatMoney(sales.week)}
            hint={`${sales.weekTx} tickets`}
            icon={ShoppingCart}
          />
          <Kpi
            label="Mes"
            value={formatMoney(sales.month)}
            hint={
              sales.monthOverMonthPct == null
                ? `${sales.monthTx} tickets`
                : `${sales.monthTx} tickets · ${sales.monthOverMonthPct}% vs mes ant.`
            }
            icon={TrendingUp}
          />
          <Kpi label="Ticket promedio" value={formatMoney(sales.avgTicket)} icon={Package} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top productos (mes)</CardTitle>
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
                      formatter={(v) => formatMoney(Number(v))}
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
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
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
