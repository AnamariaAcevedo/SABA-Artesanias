"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import { useSesion } from "@/components/auth/SesionProvider";
import { ApiError } from "@/lib/api";
import type { Pagination } from "@/types/api";
import type { Cupon } from "@/types/cupon";
import { eliminarCupon, listarCupones } from "@/services/cuponService";

export default function MisCuponesPage() {
  const { sesion } = useSesion();
  const esDueno = sesion?.vinculoTienda === "PRINCIPAL";

  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eliminando, setEliminando] = useState<number | null>(null);

  const perPage = 10;

  const cargarCupones = useCallback(async () => {
    try {
      const { data, pagination: paginacion } = await listarCupones(page, perPage);
      setCupones(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los cupones.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCupones();
  }, [cargarCupones]);

  async function eliminar(cupon: Cupon) {
    if (!window.confirm(`¿Eliminar el cupón "${cupon.codigo}"? Deja de poder usarse de inmediato.`)) return;
    setEliminando(cupon.id);
    setError("");
    try {
      await eliminarCupon(cupon.id);
      if (cupones.length === 1 && page > 1) {
        setPage((actual) => actual - 1);
      } else {
        await cargarCupones();
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos eliminar el cupón.");
    } finally {
      setEliminando(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Cupones</h2>
        <Link href="/mi-tienda/cupones/nuevo" className={styles.buttonPrimary}>
          + Nuevo cupón
        </Link>
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
              <th>Código</th>
              <th>Nombre</th>
              <th>Descuento</th>
              <th>Vigencia</th>
              <th>Usos</th>
              {esDueno && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={esDueno ? 6 : 5} className={styles.emptyRow}>
                  Cargando cupones…
                </td>
              </tr>
            )}
            {!loading && cupones.length === 0 && (
              <tr>
                <td colSpan={esDueno ? 6 : 5} className={styles.emptyRow}>
                  Todavía no creaste ningún cupón.
                </td>
              </tr>
            )}
            {!loading &&
              cupones.map((cupon) => (
                <tr key={cupon.id}>
                  <td>
                    <strong>{cupon.codigo}</strong>
                  </td>
                  <td>{cupon.nombre}</td>
                  <td>{cupon.porcentaje}%</td>
                  <td>
                    {cupon.fechaInicio} al {cupon.fechaFin}
                  </td>
                  <td>{cupon.cantidadUsos}</td>
                  {esDueno && (
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          disabled={eliminando === cupon.id}
                          onClick={() => eliminar(cupon)}
                          className={`${styles.linkAction} ${styles.linkActionDanger}`}
                        >
                          {eliminando === cupon.id ? "Eliminando…" : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} cupones` : ""}
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
