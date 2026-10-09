"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { QueryErrorState } from "@/components/ui/query-error-state";
import { ApiError } from "@/lib/api";
import { hrCatalogApi, type BankRow } from "@/lib/api/hr-catalog";
import { BankConstraints } from "@/lib/constraints";

/** Administra el catálogo de bancos usado por planilla. */
export default function BancosRrhhContent() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["banks"],
    queryFn: () => hrCatalogApi.listBanks(),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankRow | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) {
        return hrCatalogApi.updateBank(editing.id, {
          name: name.trim(),
          code: code.trim() || null,
        });
      }
      return hrCatalogApi.createBank({ name: name.trim(), code: code.trim() || null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banks"] });
      setOpen(false);
      toast.success("Banco guardado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMut.mutate();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Bancos"
        description="Catálogo para depósitos de planilla"
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setName("");
              setCode("");
              setOpen(true);
            }}
          >
            Nuevo banco
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent className="table-container">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : query.isError ? (
            <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (
            <table className="data-table">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Nombre</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Código</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading" />
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {(query.data ?? []).map((b) => (
                  <tr key={b.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{b.name}</td>
                    <td className="data-table__cell data-table__cell">{b.code ?? "—"}</td>
                    <td className="text-right data-table__cell data-table__cell">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(b);
                          setName(b.name);
                          setCode(b.code ?? "");
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
        title={editing ? "Editar banco" : "Nuevo banco"}
        size="md"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="bank-form" loading={saveMut.isPending} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form id="bank-form" className="grid gap-3" onSubmit={onSubmit}>
          <FormField label="Nombre" required id="bank-name" placeholder="Ej. Banco Agrícola" constraints={BankConstraints.name}>
            <Input
              id="bank-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Código" id="bank-code" placeholder="Ej. AGRI" constraints={BankConstraints.code}>
            <Input
              id="bank-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
