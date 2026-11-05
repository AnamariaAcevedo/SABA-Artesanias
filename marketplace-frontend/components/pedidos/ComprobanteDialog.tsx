"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import { ApiError } from "@/lib/api";
import { formatearPrecio } from "@/lib/carrito";
import { ACCIONES_TIENDA, obtenerComprobanteTienda, type AccionTienda } from "@/lib/pedidos";
import type { Pedido } from "@/types/pedido";
import pedidosStyles from "./pedidos.module.css";

const EXTENSIONES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/pdf": "pdf",
};

interface ComprobanteDialogProps {
  pedido: Pedido;
  procesando: AccionTienda | null;
  onAccion: (accion: AccionTienda) => void;
  onCerrar: () => void;
}

// Muestra el comprobante de un pedido junto a su total, para que la tienda pueda
// compararlos y, si sigue pendiente, confirmarlo o cancelarlo desde acá mismo.
export default function ComprobanteDialog({ pedido, procesando, onAccion, onCerrar }: ComprobanteDialogProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [archivo, setArchivo] = useState<{ url: string; tipo: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
  }, []);

  useEffect(() => {
    let cancelado = false;
    let url: string | null = null;

    obtenerComprobanteTienda(pedido.id)
      .then((blob) => {
        if (cancelado) return;
        url = URL.createObjectURL(blob);
        setArchivo({ url, tipo: blob.type });
      })
      .catch((cause) => {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el comprobante.");
      });

    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [pedido.id]);

  return (
    <dialog
      ref={dialogo}
      className={pedidosStyles.comprobante}
      aria-labelledby="titulo-comprobante"
      onClose={onCerrar}
    >
      <div className={styles.sectionHeader}>
        <div>
          <h3 id="titulo-comprobante" className={styles.sectionSubtitle}>
            Comprobante del pedido N.º {pedido.numero}
          </h3>
          <span className={pedidosStyles.secundario}>
            {pedido.nombreReceptor} · Total del pedido: <strong>{formatearPrecio(pedido.total)}</strong>
          </span>
        </div>
        <button type="button" className={styles.linkAction} onClick={onCerrar}>
          ✕ Cerrar
        </button>
      </div>

      {!archivo && !error && <p role="status">Cargando comprobante…</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {archivo &&
        (archivo.tipo.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={archivo.url} alt={`Comprobante del pedido N.º ${pedido.numero}`} className={pedidosStyles.comprobanteArchivo} />
        ) : (
          <iframe src={archivo.url} title={`Comprobante del pedido N.º ${pedido.numero}`} className={pedidosStyles.comprobanteArchivo} />
        ))}

      <div className={styles.rowActions}>
        {archivo && (
          <a
            href={archivo.url}
            download={`comprobante-pedido-${pedido.numero}.${EXTENSIONES[archivo.tipo] ?? "bin"}`}
            className={styles.linkAction}
          >
            Descargar
          </a>
        )}
        {pedido.estado === "PENDIENTE" && (
          <>
            <button
              type="button"
              className={styles.linkAction}
              disabled={procesando !== null}
              onClick={() => onAccion("confirmar")}
            >
              {procesando === "confirmar" ? ACCIONES_TIENDA.confirmar.enCurso : "Confirmar pedido"}
            </button>
            <button
              type="button"
              className={`${styles.linkAction} ${styles.linkActionDanger}`}
              disabled={procesando !== null}
              onClick={() => onAccion("cancelar")}
            >
              {procesando === "cancelar" ? ACCIONES_TIENDA.cancelar.enCurso : "Cancelar pedido"}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
