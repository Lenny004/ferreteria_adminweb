"use client";

/**
 * Listado, filtrado y creación de conteos físicos de inventario.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/dialog";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { useSession } from "@/contexts/session-context";
import {
  useCreateInventoryCount,
  useInventoryCounts,
} from "@/hooks/use-inventory-counts";
import {
  type InventoryCountStatus,
} from "@/lib/api/inventory-counts";
import { publicCatalogApi } from "@/lib/api/public-catalog";
import { ApiError } from "@/lib/api";
import { canWriteCounts } from "@/lib/inventory-counts";
import { formatDate, formatMoney } from "@/lib/utils";

const PAGE_SIZE = 20;

function statusLabel(status: InventoryCountStatus): string {
  return status === "ABIERTO" ? "Abierto" : status === "APLICADO" ? "Aplicado" : "Cancelado";
}

function statusVariant(status: InventoryCountStatus): BadgeProps["variant"] {
  return status === "ABIERTO" ? "warning" : status === "APLICADO" ? "success" : "muted";
}

/**
 * Tabla de conteos y diálogo de alta por alcance de catálogo.
 * Solo ADMIN y OWNER pueden crear conteos; los demás roles conservan la consulta y exportación.
 */
export default function ConteosContent() {
  const router = useRouter();
  const { user } = useSession();
  const canWrite = user ? canWriteCounts(user.role) : false;
  const [status, setStatus] = useState<InventoryCountStatus | "">("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [subfamilyId, setSubfamilyId] = useState("");
  const [notes, setNotes] = useState("");
  const countsQuery = useInventoryCounts({
    status: status || undefined,
    take: PAGE_SIZE,
    skip: page * PAGE_SIZE,
  });
  const familiesQuery = useQuery({
    queryKey: ["public-catalog", "families"],
    queryFn: publicCatalogApi.listFamilies,
    enabled: open,
  });
  const subfamiliesQuery = useQuery({
    queryKey: ["public-catalog", "subfamilies", familyId],
    queryFn: () => publicCatalogApi.listSubfamilies(familyId),
    enabled: open && Boolean(familyId),
  });
  const createMutation = useCreateInventoryCount();
  const counts = countsQuery.data?.items ?? [];
  const subfamilies = useMemo(() => subfamiliesQuery.data ?? [], [subfamiliesQuery.data]);

  function changeStatus(nextStatus: InventoryCountStatus | "") {
    setStatus(nextStatus);
    setPage(0);
  }

  function changeFamily(nextFamilyId: string) {
    setFamilyId(nextFamilyId);
    setSubfamilyId("");
  }

  async function createCount() {
    if (!name.trim()) {
      toast.error("El nombre del conteo es obligatorio");
      return;
    }
    if (!familyId) {
      toast.error("Selecciona una familia");
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        name: name.trim(),
        familyId,
        subfamilyId: subfamilyId || undefined,
        notes: notes.trim() || null,
      });
      setOpen(false);
      setName("");
      setFamilyId("");
      setSubfamilyId("");
      setNotes("");
      router.push(`/inventario/conteos/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo crear el conteo");
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Conteos físicos"
        description="Toma física cíclica, diferencias valoradas y ajustes auditables de inventario."
        actions={
          canWrite ? <Button onClick={() => setOpen(true)}>Nuevo conteo</Button> : null
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-5 sm:pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <select
                className="h-10 rounded-lg border border-border bg-card px-3"
                value={status}
                onChange={(event) => changeStatus(event.target.value as InventoryCountStatus | "")}
              >
                <option value="">Todos</option>
                <option value="ABIERTO">Abiertos</option>
                <option value="APLICADO">Aplicados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </label>
            <span className="text-sm text-muted-foreground">
              {countsQuery.data?.total ?? 0} conteos
            </span>
          </div>

          {countsQuery.isLoading ? <p className="text-sm text-muted-foreground">Cargando conteos…</p> : null}
          {countsQuery.isError ? <p className="text-sm text-danger">{countsQuery.error instanceof ApiError ? countsQuery.error.message : "No se pudieron cargar los conteos."}</p> : null}
          <div className="table-container">
            <table className="data-table min-w-[900px]">
              <thead className="data-table__head">
                <tr className="data-table__row">
                  <th className="data-table__cell data-table__cell--heading">Folio</th>
                  <th className="data-table__cell data-table__cell--heading">Nombre</th>
                  <th className="data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading">Avance</th>
                  <th className="data-table__cell data-table__cell--heading">Diferencia neta</th>
                  <th className="data-table__cell data-table__cell--heading">Creado</th>
                  <th className="data-table__cell data-table__cell--heading">Aplicado</th>
                </tr>
              </thead>
              <tbody className="data-table__body">
                {counts.map((count) => (
                  <tr key={count.id} className="data-table__row">
                    <td className="data-table__cell">
                      <Link className="font-mono font-medium text-primary hover:underline" href={`/inventario/conteos/${count.id}`}>
                        #{count.folio}
                      </Link>
                    </td>
                    <td className="data-table__cell">
                      <Link className="font-medium hover:underline" href={`/inventario/conteos/${count.id}`}>
                        {count.name}
                      </Link>
                    </td>
                    <td className="data-table__cell"><Badge variant={statusVariant(count.status)}>{statusLabel(count.status)}</Badge></td>
                    <td className="data-table__cell">{count.summary.countedLines}/{count.summary.totalLines} contadas</td>
                    <td className={`data-table__cell ${Number(count.summary.netValue) > 0 ? "text-success" : Number(count.summary.netValue) < 0 ? "text-danger" : "text-muted-foreground"}`}>
                      {formatMoney(count.summary.netValue)}
                    </td>
                    <td className="data-table__cell">{formatDate(count.createdAt)}</td>
                    <td className="data-table__cell">{formatDate(count.appliedAt)}</td>
                  </tr>
                ))}
                {!countsQuery.isLoading && counts.length === 0 ? (
                  <tr className="data-table__row"><td colSpan={7} className="text-center text-muted-foreground data-table__cell">No hay conteos para este filtro.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={countsQuery.data?.total ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title="Nuevo conteo" description="Selecciona el alcance que se fotografiará en el sistema." size="lg">
        <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void createCount(); }}>
          <label className="grid gap-1 text-sm">
            <span>Nombre *</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required placeholder="Conteo pasillo ferretería" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Familia *</span>
            <select className="h-10 rounded-lg border border-border bg-card px-3" value={familyId} onChange={(event) => changeFamily(event.target.value)} required>
              <option value="">Seleccionar familia</option>
              {(familiesQuery.data ?? []).map((family) => <option key={family.id} value={family.id}>{family.code} — {family.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Subfamilia <span className="text-muted-foreground">(opcional)</span></span>
            <select className="h-10 rounded-lg border border-border bg-card px-3" value={subfamilyId} onChange={(event) => setSubfamilyId(event.target.value)} disabled={!familyId || subfamiliesQuery.isLoading}>
              <option value="">Toda la familia</option>
              {subfamilies.map((subfamily) => <option key={subfamily.id} value={subfamily.id}>{subfamily.code} — {subfamily.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Notas <span className="text-muted-foreground">(opcional)</span></span>
            <textarea className="min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creando…" : "Crear conteo"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
