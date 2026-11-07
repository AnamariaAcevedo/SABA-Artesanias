"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { confirmar } from "@/components/dialogos/Dialogos";
import { ACCESO } from "@/lib/access";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import { ApiError } from "@/lib/api";
import { formatearFechaHora } from "@/lib/pedidos";
import { eliminarPublicacion, listarMisPublicaciones, urlFotoPublicacion } from "@/services/publicacionService";
import type { Pagination } from "@/types/api";
import type { Publicacion } from "@/types/Publicacion";

// Publicaciones de la propia tienda, incluidas las vencidas: al público ya no se
// le muestran, pero acá se pueden editar para volver a publicarlas.
export default function MisPublicacionesPage() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eliminando, setEliminando] = useState<number | null>(null);

  const perPage = 10;

  const cargarPublicaciones = useCallback(async () => {
    try {
      const { data, pagination: paginacion } = await listarMisPublicaciones(page, perPage);
      setPublicaciones(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las publicaciones.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // Refetch intencional al cambiar de página; setState solo ocurre dentro de
    // cargarPublicaciones después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPublicaciones();
  }, [cargarPublicaciones]);

  async function eliminar(publicacion: Publicacion) {
    if (eliminando !== null) return;
    const confirmado = await confirmar({
      titulo: `¿Eliminar "${publicacion.titulo}"?`,
      mensaje: "La publicación y sus fotos dejan de estar disponibles.",
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!confirmado) return;

    setEliminando(publicacion.id);
    setError("");
    try {
      await eliminarPublicacion(publicacion.id);
      // Si se vació la última página, se vuelve a la anterior (eso ya recarga).
      if (publicaciones.length === 1 && page > 1) setPage(page - 1);
      else await cargarPublicaciones();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos eliminar la publicación.");
    } finally {
      setEliminando(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Mis publicaciones</h2>
        <ConPermiso permisos={ACCESO.crearMisPublicaciones}>
          <Link href="/mi-tienda/publicaciones/nuevo" className={styles.buttonPrimary}>
            + Nueva publicación
          </Link>
        </ConPermiso>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <span className={styles.visuallyHidden}>Foto</span>
              </th>
              <th>Publicación</th>
              <th>Publicada</th>
              <th>Disponible hasta</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  Cargando publicaciones…
                </td>
              </tr>
            )}
            {!loading && publicaciones.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  Todavía no hiciste publicaciones.
                </td>
              </tr>
            )}
            {!loading &&
              publicaciones.map((publicacion) => (
                <tr key={publicacion.id}>
                  <td>
                    {publicacion.idsArchivos.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={urlFotoPublicacion(publicacion.idsArchivos[0])}
                        alt=""
                        className={miTiendaStyles.miniatura}
                      />
                    ) : (
                      <span className={miTiendaStyles.miniaturaVacia} aria-hidden="true">
                        Sin foto
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{publicacion.titulo}</strong>
                  </td>
                  <td>{formatearFechaHora(publicacion.createdAt)}</td>
                  <td>{publicacion.fechaExpiracion ? formatearFechaHora(publicacion.fechaExpiracion) : "Sin vencimiento"}</td>
                  <td>
                    <span className={`${styles.badge} ${publicacion.vigente ? styles.badgeActivo : styles.badgeInactivo}`}>
                      {publicacion.vigente ? "Disponible" : "Vencida"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <ConPermiso permisos={ACCESO.editarMisPublicaciones}>
                        <Link href={`/mi-tienda/publicaciones/${publicacion.id}/editar`} className={styles.linkAction}>
                          Editar
                        </Link>
                      </ConPermiso>
                      <ConPermiso permisos={ACCESO.eliminarMisPublicaciones}>
                        <button
                          type="button"
                          disabled={eliminando !== null}
                          onClick={() => void eliminar(publicacion)}
                          className={`${styles.linkAction} ${styles.linkActionDanger}`}
                        >
                          {eliminando === publicacion.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      </ConPermiso>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} publicaciones` : ""}
        </span>
        <div className={styles.paginationButtons}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((actual) => Math.max(1, actual - 1))}
            className={styles.buttonGhost}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPaginas}
            onClick={() => setPage((actual) => actual + 1)}
            className={styles.buttonGhost}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
