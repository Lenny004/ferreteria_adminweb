"use client";

import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api";
import { employeeDetailApi } from "@/lib/api/employee-detail";
import { hrCatalogApi } from "@/lib/api/hr-catalog";
import { EmployeeDocumentConstraints } from "@/lib/constraints";
import { formatDate } from "@/lib/utils";

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
                    <td className="data-table__cell data-table__cell"><StatusBadge status={d.status} /></td>
                    <td className="data-table__cell data-table__cell">{formatDate(d.expiryDate)}</td>
                    <td className="data-table__cell data-table__cell">{d.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Registrar documento"
        size="md"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="employee-document-form" loading={createMut.isPending} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form
          id="employee-document-form"
          className="grid gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <FormField label="Tipo de documento" required id="employee-document-type" placeholder="Selecciona un tipo">
            <>
            <Select
              id="employee-document-type"
              required
              value={docTypeId}
              onChange={(e) => setDocTypeId(e.target.value)}
            >
              <option value="">{types.isError ? "Error al cargar" : "—"}</option>
              {(types.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
            {types.isError ? <p className="text-xs text-danger">No se pudieron cargar los tipos. Reintenta la página.</p> : null}
            </>
          </FormField>
          <FormField label="Estado" id="employee-document-status" constraints={EmployeeDocumentConstraints.status}>
            <Select
              id="employee-document-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="ENTREGADO">ENTREGADO</option>
              <option value="VENCIDO">VENCIDO</option>
              <option value="NO_APLICA">NO_APLICA</option>
            </Select>
          </FormField>
          <FormField label="Vencimiento" id="employee-document-expiry" constraints={EmployeeDocumentConstraints.expiryDate}>
            <Input
              id="employee-document-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </FormField>
          <FormField label="Notas" id="employee-document-notes" placeholder="Observaciones del documento" constraints={EmployeeDocumentConstraints.notes}>
            <Input
              id="employee-document-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
