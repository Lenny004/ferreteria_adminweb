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
import { hrCatalogApi } from "@/lib/api/hr-catalog";
import { HolidayConstraints } from "@/lib/constraints";
import { formatDate } from "@/lib/utils";

/** Consulta y crea feriados del calendario laboral. */
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
    <div className="page-stack">
      <PageHeader
        title="Feriados"
        description="Calendario laboral para planilla"
        actions={
          <div className="flex gap-2">
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <Button onClick={() => setOpen(true)}>Nuevo feriado</Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Año {year}</CardTitle>
        </CardHeader>
        <CardContent className="table-container">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : query.isError ? (
            <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />
          ) : (query.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin feriados (¿API holidays disponible?).
            </p>
          ) : (
            <table className="data-table">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Fecha</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Nombre</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Obligatorio</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {(query.data ?? []).map((h) => (
                  <tr key={h.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{formatDate(h.date)}</td>
                    <td className="data-table__cell data-table__cell">{h.name}</td>
                    <td className="data-table__cell data-table__cell">{h.isMandatory ? "Sí" : "No"}</td>
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
        title="Nuevo feriado"
        size="md"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="holiday-form" loading={createMut.isPending} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form
          id="holiday-form"
          className="grid gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <FormField label="Nombre" required id="holiday-name" placeholder="Ej. Día de la Independencia" constraints={HolidayConstraints.name}>
            <Input
              id="holiday-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Fecha" required id="holiday-date" placeholder="dd/mm/aaaa" constraints={HolidayConstraints.date}>
            <Input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Input
              type="checkbox"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
            />
            Obligatorio
          </label>
        </form>
      </Modal>
    </div>
  );
}
