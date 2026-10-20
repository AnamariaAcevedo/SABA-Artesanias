"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import { ApiError, apiFetchConPaginacion } from "@/lib/api";
import type { Pagination } from "@/types/api";
import type { Tienda } from "@/types/Tienda";

export default function TiendasVendedorPage() {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [nombreBuscado, setNombreBuscado] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const perPage = 10;

  const cargarTiendas = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (nombreBuscado.trim()) params.set("nombre", nombreBuscado.trim());

      const { data, pagination: paginacion } = await apiFetchConPaginacion<Tienda[]>(
        `/tiendas?${params.toString()}`,
      );
      setTiendas(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las tiendas.");
    } finally {
      setLoading(false);
    }
  }, [page, nombreBuscado]);

  useEffect(() => {
    // Refetch intencional al cambiar página/filtros; setState solo ocurre
    // dentro de cargarTiendas después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTiendas();
  }, [cargarTiendas]);

  function buscar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setNombreBuscado(nombre);
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Gestión de tiendas</h2>
      </div>

      <form onSubmit={buscar} className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>
        <button type="submit" className={styles.buttonGhost}>
          Buscar
        </button>
      </form>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Dirección</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className={styles.emptyRow}>
                  Cargando tiendas…
                </td>
              </tr>
            )}
            {!loading && tiendas.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.emptyRow}>
                  No se encontraron tiendas.
                </td>
              </tr>
            )}
            {!loading &&
              tiendas.map((tienda) => (
                <tr key={tienda.id}>
                  <td>{tienda.nombre}</td>
                  <td>{tienda.descripcion}</td>
                  <td>{tienda.nombreDireccion || "—"}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/vendedor/tiendas/${tienda.id}/editar`} className={styles.linkAction}>
                        Editar
                      </Link>
                      <Link href={`/tiendas/${tienda.id}`} className={styles.linkAction}>
                        Ver tienda
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} tiendas` : ""}
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
            onClick={() => setPage((actual) => Math.min(totalPaginas, actual + 1))}
            className={styles.buttonGhost}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
