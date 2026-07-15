"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { employeeDetailApi } from "@/lib/api/employee-detail";
import { hrCatalogApi } from "@/lib/api/hr-catalog";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documentos</h1>
          <Link
            className="text-sm text-primary underline"
            href={`/empleados/${employeeId}/ficha`}
          >
            ← Ficha
          </Link>
        </div>
        <Button onClick={() => setOpen(true)}>Registrar documento</Button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {docs.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (docs.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin documentos.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Tipo</th>
                  <th className="pb-2 pr-3 font-medium">Estado</th>
                  <th className="pb-2 pr-3 font-medium">Vence</th>
                  <th className="pb-2 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {(docs.data ?? []).map((d) => (
                  <tr key={d.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{d.docType?.name ?? d.docTypeId}</td>
                    <td className="py-2 pr-3">{d.status}</td>
                    <td className="py-2 pr-3">{d.expiryDate?.slice(0, 10) ?? "—"}</td>
                    <td className="py-2">{d.notes ?? "—"}</td>
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
            <span>Tipo</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={docTypeId}
              onChange={(e) => setDocTypeId(e.target.value)}
            >
              <option value="">—</option>
              {(types.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
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
