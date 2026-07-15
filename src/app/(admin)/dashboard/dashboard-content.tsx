"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { useDashboardSummary } from "@/hooks/use-dashboard";

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>
      ) : null}
    </Card>
  );
}

export default function DashboardContent() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando dashboard…</p>;
  }
  if (error || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudo cargar el resumen. Verifica que la API esté en marcha.
      </p>
    );
  }

  const { sales, inventory, purchases, hr } = data;
  const chartData = sales.topProducts.map((p) => ({
    name: p.code,
    monto: p.amount,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          KPIs operativos · actualizado{" "}
          {new Date(data.generatedAt).toLocaleString("es-SV")}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Ventas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Hoy" value={formatMoney(sales.today)} hint={`${sales.todayTx} tickets`} />
          <Kpi label="Semana" value={formatMoney(sales.week)} hint={`${sales.weekTx} tickets`} />
          <Kpi
            label="Mes"
            value={formatMoney(sales.month)}
            hint={
              sales.monthOverMonthPct == null
                ? `${sales.monthTx} tickets`
                : `${sales.monthTx} tickets · ${sales.monthOverMonthPct}% vs mes ant.`
            }
          />
          <Kpi label="Ticket promedio" value={formatMoney(sales.avgTicket)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top productos (mes)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {chartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin ventas en el mes.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Bar dataKey="monto" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por tipo de orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sales.byOrderType.length === 0 ? (
                <p className="text-muted-foreground">Sin datos.</p>
              ) : (
                sales.byOrderType.map((t) => (
                  <div key={t.orderType} className="flex justify-between border-b border-border/60 py-2">
                    <span>{t.orderType}</span>
                    <span className="font-medium">
                      {formatMoney(t.total)} · {t.count}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Inventario</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Valor stock" value={formatMoney(inventory.totalValue)} />
          <Kpi label="Productos activos" value={String(inventory.activeProducts)} />
          <Kpi label="Bajo mínimo" value={String(inventory.belowMin)} />
          <Kpi label="Alertas abiertas" value={String(inventory.openAlerts)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Compras</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="OC pendientes" value={String(purchases.pendingOrders)} />
          <Kpi
            label="Comprado mes"
            value={formatMoney(purchases.monthTotal)}
            hint={`${purchases.monthCount} OC recibidas`}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top proveedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {purchases.topSuppliers.length === 0 ? (
                <p className="text-muted-foreground">Sin compras.</p>
              ) : (
                purchases.topSuppliers.map((s) => (
                  <div key={s.supplierId} className="flex justify-between">
                    <span>{s.name}</span>
                    <span className="font-medium">{formatMoney(s.total)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">RRHH</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="Empleados activos" value={String(hr.activeEmployees)} />
          <Kpi label="Docs por vencer (30d)" value={String(hr.documentsExpiring30d)} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Planillas pendientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {hr.upcomingPayroll.length === 0 ? (
                <p className="text-muted-foreground">Ninguna en revisión/aprobada.</p>
              ) : (
                hr.upcomingPayroll.map((r) => (
                  <div key={r.id} className="flex justify-between gap-2">
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
            <CardTitle className="text-base">Headcount por contrato</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            {hr.headcountByContract.map((h) => (
              <div
                key={h.contractType}
                className="rounded-md border border-border px-3 py-2"
              >
                <span className="text-muted-foreground">{h.contractType}: </span>
                <span className="font-medium">{h.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
