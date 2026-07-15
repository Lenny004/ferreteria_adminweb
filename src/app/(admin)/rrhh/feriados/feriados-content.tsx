"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { hrCatalogApi } from "@/lib/api/hr-catalog";

export default function FeriadosContent() {
  const yearNow = new Date().getFullYear();
  const [year, setYear] = useState(yearNow);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["holidays", year],
    queryFn: () => hrCatalogApi.listHolidays(year),
  });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(`${year}-01-01`);
  const [isMandatory, setIsMandatory] = useState(true);

  const createMut = useMutation({
    mutationFn: () =>
      hrCatalogApi.createHoliday({
        name: name.trim(),
        date,
        year: Number(date.slice(0, 4)) || year,
        isMandatory,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      setOpen(false);
      toast.success("Feriado creado");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feriados</h1>
          <p className="text-sm text-muted-foreground">Calendario laboral para planilla</p>
          <Link className="mt-2 inline-block text-sm text-primary underline" href="/rrhh/bancos">
            ← Bancos
          </Link>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            className="h-10 w-24 rounded-md border border-border px-2"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Button onClick={() => setOpen(true)}>Nuevo feriado</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Año {year}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (query.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin feriados (¿API holidays disponible?).
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Fecha</th>
                  <th className="pb-2 pr-3 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Obligatorio</th>
                </tr>
              </thead>
              <tbody>
                {(query.data ?? []).map((h) => (
                  <tr key={h.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{h.date.slice(0, 10)}</td>
                    <td className="py-2 pr-3">{h.name}</td>
                    <td className="py-2">{h.isMandatory ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nuevo feriado</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  createMut.mutate();
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
                <label className="grid gap-1 text-sm">
                  <span>Fecha *</span>
                  <input
                    type="date"
                    required
                    className="h-10 rounded-md border border-border px-3"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cerrar
                  </Button>
                  <Button type="submit" disabled={createMut.isPending}>
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
