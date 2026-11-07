"use client";

import { FormEvent, useState } from "react";

import styles from "./ModalCupon.module.css";
import { validarCupon } from "@/services/cuponService";
import type { CuponPreview } from "@/types/cupon";

interface ModalCuponProps {
  idTienda: number;
  onAplicar: (cupon: CuponPreview) => void;
  onCerrar: () => void;
}

export default function ModalCupon({ idTienda, onAplicar, onCerrar }: ModalCuponProps) {
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const codigoLimpio = codigo.trim();
    if (!codigoLimpio || cargando) return;

    setCargando(true);
    setError("");
    try {
      const preview = await validarCupon(idTienda, codigoLimpio);
      onAplicar(preview);
      onCerrar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos validar el cupón.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Utilizar cupón de descuento">
      <div className={styles.dialogo}>
        <div className={styles.cabecera}>
          <h3>Utilizar cupón</h3>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={confirmar}>
          <label className={styles.campo}>
            Código de cupón
            <input
              value={codigo}
              onChange={(evento) => setCodigo(evento.target.value)}
              placeholder="Ej.: VERANO20"
              autoFocus
              disabled={cargando}
            />
          </label>

          {error && (
            <p className={styles.alerta} role="alert">
              {error}
            </p>
          )}

          <div className={styles.acciones}>
            <button type="button" className={styles.botonSecundario} onClick={onCerrar} disabled={cargando}>
              Cancelar
            </button>
            <button type="submit" className={styles.botonPrincipal} disabled={cargando || !codigo.trim()}>
              {cargando ? "Validando…" : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
