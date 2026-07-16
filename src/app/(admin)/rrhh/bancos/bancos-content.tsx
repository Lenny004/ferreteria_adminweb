"use client";

import { PageHeader } from "@/components/layout/page-header";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { hrCatalogApi, type BankRow } from "@/lib/api/hr-catalog";

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
        actions={<Button
          onClick={() => {
            setEditing(null);
            setName("");
            setCode("");
            setOpen(true);
          }}
        >
          Nuevo banco
        </Button>}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Listado</CardTitle>
        </CardHeader>
        <CardContent className="data-table-wrap">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Nombre</th>
                  <th className="pb-2 pr-3 font-medium">Código</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(query.data ?? []).map((b) => (
                  <tr key={b.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{b.name}</td>
                    <td className="py-2 pr-3">{b.code ?? "—"}</td>
                    <td className="py-2 text-right">
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
      >
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="grid gap-1 text-sm">
            <span>Nombre *</span>
            <input
              required
              className="h-10 rounded-md border border-border px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Código</span>
            <input
              className="h-10 rounded-md border border-border px-3"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
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
