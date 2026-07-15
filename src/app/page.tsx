/**
 * Entrada `/` del AdminWeb.
 * Redirige al dashboard para que la raíz no quede como página vacía.
 */

import { redirect } from "next/navigation";

/** Envía al operador al dashboard administrativo. */
export default function HomePage() {
  redirect("/dashboard");
}
