"use client";

import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Modal } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { employeeDetailApi } from "@/lib/api/employee-detail";
import { hrCatalogApi } from "@/lib/api/hr-catalog";

/** Consulta y registra documentos del expediente de un empleado. */
export default function EmpleadoDocumentosContent() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const qc = useQueryClient();
  const docs = useQuery({
    queryKey: ["employee-docs", employeeId],
    queryFn: () => employeeDetailApi.listDocuments(employeeId),
  });
  const types = useQuery({
    queryKey: ["document-types"],
    queryFn: () => hrCatalogApi.listDocumentTypes(),
  });
  const [open, setOpen] = useState(false);
  const [docTypeId, setDocTypeId] = useState("");
  const [status, setStatus] = useState("PENDIENTE");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      employeeDetailApi.createDocument(employeeId, {
        docTypeId,
        status,
        expiryDate: expiryDate || null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-docs", employeeId] });
      setOpen(false);
      toast.success("Documento registrado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar"),
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Documentos"
        description="Expediente documental del empleado"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/empleados/${employeeId}/ficha`}>← Ficha</Link>
            </Button>
            <Button onClick={() => setOpen(true)}>Registrar documento</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="table-container pt-6">
          {docs.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : docs.isError ? (
            <QueryErrorState error={docs.error} onRetry={() => void docs.refetch()} />
          ) : (docs.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin documentos.</p>
          ) : (
            <table className="data-table">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Tipo</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Estado</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Vence</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Notas</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {(docs.data ?? []).map((d) => (
                  <tr key={d.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{d.docType?.name ?? d.docTypeId}</td>
                    <td className="data-table__cell data-table__cell">{d.status}</td>
                    <td className="data-table__cell data-table__cell">{d.expiryDate?.slice(0, 10) ?? "—"}</td>
                    <td className="data-table__cell data-table__cell">{d.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title="Registrar documento" size="md">
        <form
          className="grid gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <label className="grid gap-1 text-sm">
            <span>Tipo *</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={docTypeId}
              onChange={(e) => setDocTypeId(e.target.value)}
            >
              <option value="">{types.isError ? "Error al cargar" : "—"}</option>
              {(types.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {types.isError ? <p className="text-xs text-danger">No se pudieron cargar los tipos. Reintenta la página.</p> : null}
          </label>
          <label className="grid gap-1 text-sm">
            <span>Estado</span>
            <select
              className="h-10 rounded-md border border-border px-3"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="ENTREGADO">ENTREGADO</option>
              <option value="VENCIDO">VENCIDO</option>
              <option value="NO_APLICA">NO_APLICA</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Vencimiento</span>
            <input
              type="date"
              className="h-10 rounded-md border border-border px-3"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Notas</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
