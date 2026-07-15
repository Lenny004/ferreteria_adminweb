/**
 * Fallback de Suspense del área `(admin)` mientras cargan las rutas hijas.
 */

export default function AdminLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted-foreground">Cargando…</p>
    </div>
  );
}
