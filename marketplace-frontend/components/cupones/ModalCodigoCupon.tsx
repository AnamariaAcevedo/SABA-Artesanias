"use client";

import { useState } from "react";

import styles from "./ModalCodigoCupon.module.css";
import type { CuponPublico } from "@/types/cupon";

interface ModalCodigoCuponProps {
  cupon: CuponPublico;
  onCerrar: () => void;
}

// Modal que muestra el código de un cupón ya obtenido, con copiado al
// portapapeles. No valida nada: eso pasa al aplicarlo en el checkout.
export default function ModalCodigoCupon({ cupon, onCerrar }: ModalCodigoCuponProps) {
  const [copiado, setCopiado] = useState(false);

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(cupon.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error("Error copiando el código:", error);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Código del cupón">
      <div className={styles.dialogo}>
        <div className={styles.cabecera}>
          <h3>Código del cupón</h3>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <p className={styles.mensaje}>
          {cupon.nombre} · −{cupon.porcentaje}% en {cupon.nombreTienda}. Solo podrás utilizarlo en una compra en{" "}
          {cupon.nombreTienda}.
        </p>

        <div className={styles.codigoBox}>
          <span className={styles.codigo}>{cupon.codigo}</span>
          <button type="button" className={styles.copyButton} onClick={copiarCodigo}>
            {copiado ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  );
}
