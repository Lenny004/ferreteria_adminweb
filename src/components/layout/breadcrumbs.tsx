export function Breadcrumbs() {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-2">
        <li>FlexoCable</li>
        <li aria-hidden="true">/</li>
        <li className="font-medium text-foreground">AdminWeb</li>
      </ol>
    </nav>
  );
}
