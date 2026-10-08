"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { ApiError } from "@/lib/api";
import { hrCatalogApi, type DocumentTypeRow } from "@/lib/api/hr-catalog";

/** Administra los tipos de documento del expediente laboral. */
export default function TiposDocumentoContent() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["document-types"],
    queryFn: () => hrCatalogApi.listDocumentTypes(),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentTypeRow | null>(null);
  const [name, setName] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [hasExpiry, setHasExpiry] = useState(false);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        return hrCatalogApi.updateDocumentType(editing.id, {
          name: name.trim(),
          isMandatory,
          hasExpiry,
        });
      }
      return hrCatalogApi.createDocumentType({
        name: name.trim(),
        isMandatory,
        hasExpiry,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-types"] });
      setOpen(false);
      toast.success("Tipo guardado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar"),
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Tipos de documento"
        description="Catálogo del expediente laboral"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setName("");
              setIsMandatory(true);
              setHasExpiry(false);
              setOpen(true);
            }}
          >
            Nuevo tipo
          </Button>
        }
      />

      <Card>
        <CardContent className="table-container pt-6">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : query.isError ? (
            <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
          <table className="data-table">
            <thead className="data-table__head">
              <tr className="data-table__row">
                <th className="data-table__cell data-table__cell--heading">Nombre</th>
                <th className="data-table__cell data-table__cell--heading">Obligatorio</th>
                <th className="data-table__cell data-table__cell--heading">Vence</th>
                <th  className="data-table__cell data-table__cell--heading"/>
              </tr>
            </thead>
            <tbody className="data-table__body">
              {(query.data ?? []).map((t) => (
                <tr key={t.id} className="data-table__row">
                  <td className="data-table__cell">{t.name}</td>
                  <td className="data-table__cell">{t.isMandatory ? "Sí" : "No"}</td>
                  <td className="data-table__cell">{t.hasExpiry ? "Sí" : "No"}</td>
                  <td className="text-right data-table__cell">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(t);
                        setName(t.name);
                        setIsMandatory(t.isMandatory);
                        setHasExpiry(t.hasExpiry);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </td>
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
        title={editing ? "Editar tipo" : "Nuevo tipo"}
        size="md"
      >
        <form
          className="grid gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            saveMut.mutate();
          }}
        >
          <label className="grid gap-1 text-sm">
            <span>Nombre *</span>
            <input
              required
              className="h-10 rounded-md border border-border px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
            />
            Obligatorio
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasExpiry}
              onChange={(e) => setHasExpiry(e.target.checked)}
            />
            Tiene vencimiento
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMut.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
