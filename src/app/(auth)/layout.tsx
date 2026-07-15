/**
 * Layout del grupo `(auth)`.
 * Contenedor mínimo para pantallas públicas (login) sin shell admin.
 */

/**
 * Envuelve rutas de autenticación con fondo a pantalla completa.
 */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="min-h-screen bg-background">{children}</main>;
}
