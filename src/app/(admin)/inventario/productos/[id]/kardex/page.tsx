/** Kardex de un producto: historial de movimientos con saldo valorado. */

import KardexContent from "./kardex-content";

type KardexPageProps = { params: Promise<{ id: string }> };

/** Resuelve el id de la ruta y delega la consulta al componente cliente. */
export default async function KardexPage({ params }: KardexPageProps) {
  const { id } = await params;
  return <KardexContent productId={id} />;
}
