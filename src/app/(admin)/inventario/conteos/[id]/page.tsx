/** Detalle de un conteo físico de inventario. */

import ConteoDetalleContent from "./conteo-detalle-content";

type ConteoDetallePageProps = { params: Promise<{ id: string }> };

/** Renderiza el detalle con captura, revisión, aplicación y exportación. */
export default async function ConteoDetallePage({ params }: ConteoDetallePageProps) {
  const { id } = await params;
  return <ConteoDetalleContent id={id} />;
}
