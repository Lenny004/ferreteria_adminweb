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
import { ApiError } from "@/lib/api";
import { employeeDetailApi } from "@/lib/api/employee-detail";
import { hrCatalogApi } from "@/lib/api/hr-catalog";
import { EmployeeBankAccountConstraints } from "@/lib/constraints";

/** Administra las cuentas bancarias asociadas a un empleado. */
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
        <CardContent className="table-container pt-6">
          {accounts.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : accounts.isError ? (
            <QueryErrorState error={accounts.error} onRetry={() => void accounts.refetch()} />
          ) : (accounts.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin cuentas.</p>
          ) : (
            <table className="data-table">
              <thead className="data-table__head data-table__head">
                <tr className="data-table__row data-table__row">
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Banco</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Tipo</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Número</th>
                  <th className="data-table__cell data-table__cell--heading data-table__cell data-table__cell--heading">Principal</th>
                </tr>
              </thead>
              <tbody className="data-table__body data-table__body">
                {(accounts.data ?? []).map((a) => (
                  <tr key={a.id} className="data-table__row data-table__row">
                    <td className="data-table__cell data-table__cell">{a.bank?.name ?? a.bankId}</td>
                    <td className="data-table__cell data-table__cell">{a.accountType}</td>
                    <td className="font-mono text-xs data-table__cell data-table__cell">{a.accountNumber}</td>
                    <td className="data-table__cell data-table__cell">{a.isPrimary ? "Sí" : "No"}</td>
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
        title="Nueva cuenta"
        size="md"
        footer={
          <ModalFooter
            cancel={<Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>}
            action={<Button type="submit" form="employee-bank-form" loading={createMut.isPending} loadingText="Guardando…">Guardar</Button>}
          />
        }
      >
        <form
          id="employee-bank-form"
          className="grid gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <FormField label="Banco" required id="employee-bank" placeholder="Selecciona un banco">
            <>
            <Select
              id="employee-bank"
              required
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
            >
              <option value="">{banks.isError ? "Error al cargar" : "—"}</option>
              {(banks.data ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            {banks.isError ? <p className="text-xs text-danger">No se pudieron cargar los bancos. Reintenta la página.</p> : null}
            </>
          </FormField>
          <FormField label="Tipo de cuenta" id="employee-account-type" constraints={EmployeeBankAccountConstraints.accountType}>
            <Select
              id="employee-account-type"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="CUENTA_DE_AHORRO">Ahorro</option>
              <option value="CUENTA_CORRIENTE">Corriente</option>
              <option value="CUENTA_SALARIO">Salario</option>
            </Select>
          </FormField>
          <FormField label="Número de cuenta" required id="employee-account-number" placeholder="000123456789" constraints={EmployeeBankAccountConstraints.accountNumber}>
            <Input
              id="employee-account-number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <Input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Principal
          </label>
        </form>
      </Modal>
    </div>
  );
}
