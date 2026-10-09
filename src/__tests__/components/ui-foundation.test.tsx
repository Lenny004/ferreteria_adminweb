/** Pruebas de accesibilidad y contratos de la base de componentes compartidos. */

import { fireEvent, render, screen } from "@testing-library/react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableContainer } from "@/components/ui/table-container";
import { Textarea } from "@/components/ui/textarea";

describe("componentes UI base", () => {
  it("asocia FormField con su control y comunica requerido, ayuda y error", () => {
    render(
      <FormField
        label="Correo"
        name="email"
        required
        placeholder="nombre@empresa.com"
        help="Usa el correo corporativo"
        error="Ingrese un correo válido"
        constraints={{ type: "email", maxLength: 100 }}
      >
        <Input />
      </FormField>,
    );

    const input = screen.getByLabelText(/Correo/);
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("required");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("maxLength", "100");
    expect(input.getAttribute("aria-describedby")).toMatch(/-help/);
    expect(input.getAttribute("aria-describedby")).toMatch(/-error/);
    expect(input.getAttribute("aria-describedby")).toMatch(/-placeholder/);
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Campo obligatorio")).toHaveClass("sr-only");
  });

  it("mantiene los wrappers nativos y sus referencias", () => {
    render(
      <>
        <label htmlFor="kind">Tipo</label>
        <Select id="kind" aria-invalid="true" defaultValue="a">
          <option value="a">A</option>
        </Select>
        <label htmlFor="notes">Notas</label>
        <Textarea id="notes" />
      </>,
    );

    expect(screen.getByLabelText("Tipo")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Notas")).toBeInTheDocument();
  });

  it("conserva el id definido por el control hijo en FormField", () => {
    render(
      <FormField label="Código">
        <Input id="codigo-existente" />
      </FormField>,
    );

    expect(screen.getByLabelText("Código")).toHaveAttribute("id", "codigo-existente");
  });

  it("deshabilita un botón en loading y expone aria-busy", () => {
    render(<Button loading>Guardar</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
    expect(button.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("conserva el único hijo al usar asChild durante loading", () => {
    render(
      <Button asChild loading>
        <a href="/destino">Continuar</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Continuar" });
    expect(link).toHaveAttribute("aria-busy", "true");
    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).not.toHaveAttribute("disabled");
  });

  it("separa el pie del área desplazable y coloca cancelar antes de la acción", () => {
    const onOpenChange = jest.fn();
    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        title="Editar"
        footer={
          <ModalFooter>
            <Button variant="outline">Cancelar</Button>
            <Button>Guardar</Button>
          </ModalFooter>
        }
      >
        Contenido
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["", "Cancelar", "Guardar"]);
    expect(dialog.querySelector(".overflow-y-auto")).not.toContainElement(screen.getByText("Guardar"));

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("mantiene xl en max-w-xl y conserva 2xl como alias heredado", () => {
    const { rerender } = render(
      <Modal open onOpenChange={jest.fn()} title="Detalle" size="xl">
        Contenido
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveClass("max-w-xl");

    rerender(
      <Modal open onOpenChange={jest.fn()} title="Detalle" size="2xl">
        Contenido
      </Modal>,
    );

    expect(screen.getByRole("dialog")).toHaveClass("max-w-2xl");
  });

  it("confirma y cancela con ConfirmDialog", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Eliminar registro"
        description="Esta acción no se puede deshacer."
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("alertdialog").querySelector(".overflow-y-auto")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("enfoca la acción principal o Cancelar según el carácter destructivo", () => {
    const { unmount } = render(
      <ConfirmDialog
        open
        title="Confirmar"
        description="Descripción"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Confirmar" })).toHaveFocus();

    unmount();
    render(
      <ConfirmDialog
        open
        title="Eliminar"
        description="Descripción"
        destructive
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it("bloquea Escape y cierre durante loading", () => {
    const onCancel = jest.fn();
    render(
      <ConfirmDialog
        open
        title="Eliminar"
        description="Descripción"
        destructive
        loading
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
  });

  it("expone un error y permite reintentar", () => {
    const onRetry = jest.fn();
    render(
      <ErrorState
        description="Intenta de nuevo en unos segundos."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("No se pudieron cargar los datos")).toBeInTheDocument();
    expect(screen.getByText("Intenta de nuevo en unos segundos.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("mapea estados a texto español y variantes compartidas", () => {
    render(<StatusBadge status="EN_REVISION" />);
    expect(screen.getByText("En revisión")).toBeInTheDocument();
    expect(screen.getByText("En revisión")).toHaveClass("text-warning");
  });

  it("expone estados accesibles de tabla", () => {
    render(
      <>
        <TableContainer data-testid="table-container" />
        <LoadingState />
        <EmptyState />
      </>,
    );
    expect(screen.getByTestId("table-container")).toHaveClass("table-container");
    expect(screen.getByRole("status", { name: "Cargando…" })).toBeInTheDocument();
    expect(screen.getByText("No hay registros para mostrar")).toBeInTheDocument();
  });
});
