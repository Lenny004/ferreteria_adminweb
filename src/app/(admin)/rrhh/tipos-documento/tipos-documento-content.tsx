"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { hrCatalogApi, type DocumentTypeRow } from "@/lib/api/hr-catalog";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tipos de documento</h1>
          <p className="text-sm text-muted-foreground">Catálogo del expediente laboral</p>
          <Link className="mt-2 inline-block text-sm text-primary underline" href="/rrhh/bancos">
            ← Bancos
          </Link>
        </div>
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
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Nombre</th>
                <th className="pb-2 pr-3 font-medium">Obligatorio</th>
                <th className="pb-2 pr-3 font-medium">Vence</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(query.data ?? []).map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="py-2 pr-3">{t.name}</td>
                  <td className="py-2 pr-3">{t.isMandatory ? "Sí" : "No"}</td>
                  <td className="py-2 pr-3">{t.hasExpiry ? "Sí" : "No"}</td>
                  <td className="py-2 text-right">
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
        </CardContent>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editing ? "Editar tipo" : "Nuevo tipo"}</CardTitle>
            </CardHeader>
            <CardContent>
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
                    Cerrar
                  </Button>
                  <Button type="submit" disabled={saveMut.isPending}>
                    Guardar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
