"use client";

import { PageHeader } from "@/components/layout/page-header";
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

export default function EmpleadoBancosContent() {
  const params = useParams<{ id: string }>();
  const employeeId = params.id;
  const qc = useQueryClient();
  const accounts = useQuery({
    queryKey: ["employee-banks", employeeId],
    queryFn: () => employeeDetailApi.listBankAccounts(employeeId),
  });
  const banks = useQuery({
    queryKey: ["banks"],
    queryFn: () => hrCatalogApi.listBanks(),
  });
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("CUENTA_DE_AHORRO");
  const [isPrimary, setIsPrimary] = useState(true);

  const createMut = useMutation({
    mutationFn: () =>
      employeeDetailApi.createBankAccount(employeeId, {
        bankId,
        accountNumber: accountNumber.trim(),
        accountType,
        isPrimary,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-banks", employeeId] });
      setOpen(false);
      toast.success("Cuenta agregada");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar"),
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Cuentas bancarias"
        description="Cuentas para depósito de planilla"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/empleados/${employeeId}/ficha`}>← Ficha</Link>
            </Button>
            <Button onClick={() => setOpen(true)}>Agregar cuenta</Button>
          </div>
        }
      />

      <Card>
        <CardContent className="data-table-wrap pt-6">
          {accounts.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (accounts.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cuentas.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Banco</th>
                  <th className="pb-2 pr-3 font-medium">Tipo</th>
                  <th className="pb-2 pr-3 font-medium">Número</th>
                  <th className="pb-2 font-medium">Principal</th>
                </tr>
              </thead>
              <tbody>
                {(accounts.data ?? []).map((a) => (
                  <tr key={a.id} className="border-b border-border/60">
                    <td className="py-2 pr-3">{a.bank?.name ?? a.bankId}</td>
                    <td className="py-2 pr-3">{a.accountType}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{a.accountNumber}</td>
                    <td className="py-2">{a.isPrimary ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal open={open} onOpenChange={setOpen} title="Nueva cuenta" size="md">
        <form
          className="grid gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <label className="grid gap-1 text-sm">
            <span>Banco *</span>
            <select
              required
              className="h-10 rounded-md border border-border px-3"
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
            >
              <option value="">—</option>
              {(banks.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Tipo</span>
            <select
              className="h-10 rounded-md border border-border px-3"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="CUENTA_DE_AHORRO">Ahorro</option>
              <option value="CUENTA_CORRIENTE">Corriente</option>
              <option value="CUENTA_SALARIO">Salario</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Número *</span>
            <input
              required
              className="h-10 rounded-md border border-border px-3"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Principal
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
      </Modal>
    </div>
  );
}
