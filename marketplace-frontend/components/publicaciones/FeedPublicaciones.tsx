"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { listarPublicaciones } from "@/services/publicacionService";
import type { Publicacion } from "@/types/Publicacion";
import PublicacionCard from "./PublicacionCard";
import styles from "./publicaciones.module.css";

const POR_PAGINA = 10;

function mensajeDeError(cause: unknown): string {
  return cause instanceof ApiError ? cause.message : "No pudimos cargar las publicaciones.";
}

// Publicaciones vigentes, de la más nueva a la más vieja. Con `idTienda` muestra
// solo las de esa tienda; sin él, las de todas (el canal general).
export default function FeedPublicaciones({ idTienda, textoVacio }: { idTienda?: number; textoVacio: string }) {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    listarPublicaciones(1, POR_PAGINA, idTienda)
      .then(({ data, pagination }) => {
        if (cancelado) return;
        setPublicaciones(data);
        setTotal(pagination?.total ?? data.length);
      })
      .catch((cause) => {
        if (!cancelado) setError(mensajeDeError(cause));
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [idTienda]);

  async function verMas() {
    setCargandoMas(true);
    setError("");
    try {
      const siguiente = pagina + 1;
      const { data, pagination } = await listarPublicaciones(siguiente, POR_PAGINA, idTienda);
      // Si se publicó algo mientras tanto, la página corre y puede repetir elementos.
      setPublicaciones((actuales) => [
        ...actuales,
        ...data.filter((nueva) => !actuales.some((actual) => actual.id === nueva.id)),
      ]);
      setTotal(pagination?.total ?? total);
      setPagina(siguiente);
    } catch (cause) {
      setError(mensajeDeError(cause));
    } finally {
      setCargandoMas(false);
    }
  }

  if (cargando) return <p className={styles.mensaje} role="status">Cargando publicaciones...</p>;

  return (
    <div className={styles.feed}>
      {!error && publicaciones.length === 0 && <p className={styles.mensaje}>{textoVacio}</p>}

      {publicaciones.map((publicacion) => (
        <PublicacionCard key={publicacion.id} publicacion={publicacion} />
      ))}

      {error && <p className={styles.alerta} role="alert">{error}</p>}

      {publicaciones.length > 0 && pagina * POR_PAGINA < total && (
        <button type="button" className={styles.verMas} onClick={() => void verMas()} disabled={cargandoMas}>
          {cargandoMas ? "Cargando…" : "Ver más"}
        </button>
      )}
    </div>
  );
}
