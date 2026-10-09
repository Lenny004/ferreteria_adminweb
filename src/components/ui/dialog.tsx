"use client";

/**
 * Modal accesible basado en Radix Dialog: Escape, foco atrapado y overlay.
 */

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Tamaños soportados; `2xl` se conserva como alias de `xl`. */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

/** Props del modal accesible basado en Radix Dialog. */
export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  size?: ModalSize;
  /** Permite usar `alertdialog` para acciones que requieren atención. */
  role?: "dialog" | "alertdialog";
  /** Bloquea Escape, el overlay y el botón de cierre cuando es falso. */
  dismissible?: boolean;
  /** Permite definir el foco inicial conservando la gestión de Radix. */
  onOpenAutoFocus?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>["onOpenAutoFocus"];
};

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

/**
 * Pie común de modal con Cancelar a la izquierda y la acción principal a la derecha.
 * Puede recibir `cancel` y `action` explícitos o usar el primer hijo como cancelación.
 */
export function ModalFooter({
  cancel,
  action,
  children,
  className,
}: {
  cancel?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const parts = React.Children.toArray(children);
  const cancelContent = cancel ?? parts.shift();
  const actionContent = action ?? parts;

  return (
    <div className={cn("flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4", className)}>
      <div className="flex items-center gap-2">{cancelContent}</div>
      <div className="flex items-center gap-2">{actionContent}</div>
    </div>
  );
}

/** Modal reutilizable para formularios, detalles y confirmaciones. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = "lg",
  role = "dialog",
  dismissible = true,
  onOpenAutoFocus,
}: ModalProps) {
  const hasContent = React.Children.count(children) > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-sm" />
        <DialogPrimitive.Content
          role={role}
          onOpenAutoFocus={onOpenAutoFocus}
          onEscapeKeyDown={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-md)]",
            sizeClass[size],
            className,
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold tracking-tight">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : (
                <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button type="button" size="icon" variant="ghost" aria-label="Cerrar" disabled={!dismissible}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {hasContent ? <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div> : null}
          {footer ? footer : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Props del diálogo de confirmación compartido. */
export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  /** Contenido adicional, por ejemplo un campo de motivo o referencia. */
  children?: ReactNode;
  /** Mensaje funcional de la última tentativa fallida, visible dentro del diálogo. */
  error?: string | null;
  /** Deshabilita la acción hasta completar un campo requerido del contenido adicional. */
  confirmDisabled?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Presenta una confirmación accesible en tamaño pequeño.
 * En acciones destructivas, el foco inicial queda en Cancelar.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  error,
  confirmDisabled = false,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onCancel();
      }}
      title={title}
      description={description}
      size="sm"
      role="alertdialog"
      dismissible={!loading}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        (destructive ? cancelRef : confirmRef).current?.focus();
      }}
      footer={
        <ModalFooter
          cancel={
            <Button ref={cancelRef} type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
          }
          action={
            <Button
              ref={confirmRef}
              type="button"
              variant={destructive ? "destructive" : "primary"}
              loading={loading}
              disabled={confirmDisabled}
              loadingText="Confirmando…"
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          }
        />
      }
    >
      {children || error ? (
        <>
          {children}
          {error ? (
            <p className="mt-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </>
      ) : null}
    </Modal>
  );
}
