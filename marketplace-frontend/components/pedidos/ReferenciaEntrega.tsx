import { separarReferencia } from "@/lib/mapa";
import styles from "./pedidos.module.css";

// Referencia del pedido; si el cliente marcó el punto en el mapa, el link de
// Google Maps se muestra aparte como "Ver en el mapa".
export default function ReferenciaEntrega({ referencia }: { referencia: string | null }) {
  const { texto, linkMapa } = separarReferencia(referencia);
  if (!texto && !linkMapa) return null;

  return (
    <>
      {texto && <span className={styles.secundario}>Ref.: {texto}</span>}
      {linkMapa && (
        <a className={styles.linkMapa} href={linkMapa} target="_blank" rel="noreferrer">
          Ver en el mapa ↗
        </a>
      )}
    </>
  );
}
