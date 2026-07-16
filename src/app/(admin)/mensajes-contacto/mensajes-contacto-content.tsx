"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ApiError } from "@/lib/api";
import {
  contactApi,
  type ContactMessage,
  type ContactStatus,
} from "@/lib/api/contact";
import { formatDateTime } from "@/lib/utils";
import { useSession } from "@/contexts/session-context";

const PAGE_SIZE = 20;

const statusLabel: Record<ContactStatus, string> = {
  NEW: "Nuevo",
  READ: "Leído",
  ARCHIVED: "Archivado",
};

export default function MensajesContactoContent() {
  const { user } = useSession();
  const canManage = user?.role === "ADMIN" || user?.role === "OWNER";
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContactStatus | "">("");
  const [onlyNew, setOnlyNew] = useState(false);
  const [withPhone, setWithPhone] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const query = useQuery({
    queryKey: ["contact-messages", search, status, page],
    queryFn: () =>
      contactApi.list({
        q: search || undefined,
        status: status || undefined,
        take: PAGE_SIZE,
        skip: page * PAGE_SIZE,
      }),
  });

  const updateMut = useMutation({
    mutationFn: (payload: {
      id: string;
      status?: ContactStatus;
      adminNotes?: string | null;
    }) => contactApi.update(payload.id, {
      status: payload.status,
      adminNotes: payload.adminNotes,
    }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["contact-messages"] });
      setSelected(row);
      setAdminNotes(row.adminNotes ?? "");
      toast.success("Mensaje actualizado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar"),
  });

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearch(q.trim());
  }

  function selectRow(row: ContactMessage) {
    setSelected(row);
    setAdminNotes(row.adminNotes ?? "");
  }

  const items = (query.data?.items ?? []).filter((row) =>
    withPhone ? Boolean(row.phone?.trim()) : true,
  );
  const total = query.data?.total ?? 0;

  return (
    <div className="page-stack">
      <PageHeader
        title="Mensajes de contacto"
        description="Consultas enviadas desde la tienda pública."
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={onSearch}
          >
            <label className="grid gap-1 text-sm sm:col-span-2 lg:col-span-1">
              <span className="text-muted-foreground">Búsqueda</span>
              <input
                className="h-10 w-full rounded-md border border-border px-3 text-sm"
                placeholder="Buscar por nombre, correo o asunto"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Estado</span>
              <select
                className="h-10 w-full rounded-md border border-border px-3 text-sm"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as ContactStatus | "");
                  setPage(0);
                }}
              >
                <option value="">Todos los estados</option>
                <option value="NEW">Nuevo</option>
                <option value="READ">Leído</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOnlyNew(checked);
                  if (checked) {
                    setStatus("NEW");
                    setPage(0);
                  }
                }}
              />
              Solo nuevos
            </label>
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={withPhone}
                onChange={(e) => setWithPhone(e.target.checked)}
              />
              Solo con teléfono
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit" variant="outline">
                Buscar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setQ("");
                  setSearch("");
                  setStatus("");
                  setOnlyNew(false);
                  setWithPhone(false);
                  setPage(0);
                }}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Listado</CardTitle>
          </CardHeader>
          <CardContent>
            {query.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay mensajes.</p>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Nombre</th>
                      <th>Asunto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => selectRow(row)}
                      >
                        <td className="whitespace-nowrap">
                          {formatDateTime(row.createdAt)}
                        </td>
                        <td>{row.name}</td>
                        <td>{row.subject}</td>
                        <td>{statusLabel[row.status]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!selected ? (
              <p className="text-muted-foreground">Selecciona un mensaje.</p>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground">De</p>
                  <p className="font-medium">
                    {selected.name} · {selected.email}
                  </p>
                  {selected.phone ? (
                    <p className="text-muted-foreground">{selected.phone}</p>
                  ) : null}
                </div>
                <div>
                  <p className="text-muted-foreground">Asunto</p>
                  <p className="font-medium">{selected.subject}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mensaje</p>
                  <p className="whitespace-pre-wrap">{selected.message}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <p className="font-medium">{statusLabel[selected.status]}</p>
                </div>
                {canManage ? (
                  <label className="block space-y-1">
                    <span className="text-muted-foreground">Notas internas</span>
                    <textarea
                      className="min-h-20 w-full rounded-md border border-border px-3 py-2"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateMut.isPending}
                      onClick={() =>
                        updateMut.mutate({
                          id: selected.id,
                          adminNotes: adminNotes.trim() || null,
                        })
                      }
                    >
                      Guardar notas
                    </Button>
                  </label>
                ) : selected.adminNotes ? (
                  <div>
                    <p className="text-muted-foreground">Notas internas</p>
                    <p className="whitespace-pre-wrap">{selected.adminNotes}</p>
                  </div>
                ) : null}
                {canManage ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateMut.isPending || selected.status === "READ"}
                      onClick={() =>
                        updateMut.mutate({ id: selected.id, status: "READ" })
                      }
                    >
                      Marcar leído
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateMut.isPending || selected.status === "ARCHIVED"}
                      onClick={() =>
                        updateMut.mutate({ id: selected.id, status: "ARCHIVED" })
                      }
                    >
                      Archivar
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Solo ADMIN/OWNER pueden cambiar el estado.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
