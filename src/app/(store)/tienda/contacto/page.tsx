"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { contactApi } from "@/lib/api/contact";

const empty = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactoPage() {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await contactApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      toast.success("Mensaje enviado. Te contactaremos pronto.");
      setForm(empty);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo enviar el mensaje");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contáctanos</h1>
        <p className="text-sm text-muted-foreground">
          Envíanos tu consulta y te responderemos a la brevedad.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formulario</CardTitle>
          <CardDescription>Todos los campos marcados son obligatorios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <label className="grid gap-1 text-sm">
              <span>Nombre *</span>
              <input
                required
                minLength={2}
                className="h-10 rounded-md border border-border px-3"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Correo *</span>
              <input
                type="email"
                required
                className="h-10 rounded-md border border-border px-3"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Teléfono (opcional)</span>
              <input
                className="h-10 rounded-md border border-border px-3"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Asunto *</span>
              <input
                required
                minLength={3}
                className="h-10 rounded-md border border-border px-3"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span>Mensaje *</span>
              <textarea
                required
                minLength={10}
                rows={5}
                className="rounded-md border border-border px-3 py-2"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar mensaje"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
