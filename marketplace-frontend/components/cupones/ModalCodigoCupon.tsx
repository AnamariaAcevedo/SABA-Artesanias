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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Vale con talón, como las tarjetas de la pantalla Cupones. */}
        <div className={styles.vale}>
          <div className={styles.valeTalon}>
            <span className={styles.valePorcentaje}>{cupon.porcentaje}%</span>
            <span className={styles.valeOff}>de descuento</span>
          </div>
          <div className={styles.valeCuerpo}>
            <small>Tu código</small>
            <span className={styles.codigo}>{cupon.codigo}</span>
          </div>
        </div>

        <p className={styles.mensaje}>
          <strong>{cupon.nombre}</strong>. Solo podrás utilizarlo en una compra en {cupon.nombreTienda}.
        </p>

        <button type="button" className={styles.copyButton} onClick={copiarCodigo} aria-live="polite">
          {copiado ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 5 5 9-10" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="8" y="8" width="12" height="12" rx="2" />
              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          )}
          {copiado ? "¡Copiado!" : "Copiar código"}
        </button>
      </div>
    </div>
  );
}
