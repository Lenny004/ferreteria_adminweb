/**
 * Migas de pan del shell administrativo.
 * Orientan al usuario dentro del AdminWeb (aún estáticas; se enriquecerán por módulo).
 */

/**
 * Muestra la jerarquía Ferreteria / AdminWeb en el encabezado.
 */
export function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-2">
        <li>Ferreteria</li>
        <li aria-hidden="true">/</li>
        <li className="font-medium text-foreground">AdminWeb</li>
      </ol>
    </nav>
  );
}
