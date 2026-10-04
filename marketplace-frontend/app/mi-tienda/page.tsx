"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import { ApiError, apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { Pagination } from "@/types/api";
import type { Producto } from "@/types/Producto";
import { urlImagen } from "@/types/miTienda";

export default function MisProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [nombreBuscado, setNombreBuscado] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eliminando, setEliminando] = useState<number | null>(null);

  const perPage = 10;

  const cargarProductos = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (nombreBuscado.trim()) params.set("nombre", nombreBuscado.trim());

      const { data, pagination: paginacion } = await apiFetchConPaginacion<Producto[]>(
        `/mi-tienda/productos?${params.toString()}`,
      );
      setProductos(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, [page, nombreBuscado]);

  useEffect(() => {
    // Refetch intencional al cambiar página/búsqueda; setState solo ocurre
    // dentro de cargarProductos después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarProductos();
  }, [cargarProductos]);

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setNombreBuscado(nombre);
  }

  async function eliminar(producto: Producto) {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setEliminando(producto.id);
    setError("");
    try {
      await apiFetch(`/mi-tienda/productos/${producto.id}`, { method: "DELETE" });
      // Si era el último de la página, retrocede una para no quedar en una vacía.
      if (productos.length === 1 && page > 1) {
        setPage((actual) => actual - 1);
      } else {
        await cargarProductos();
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos eliminar el producto.");
    } finally {
      setEliminando(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Mis productos</h2>
        <Link href="/mi-tienda/productos/nuevo" className={styles.buttonPrimary}>
          + Nuevo producto
        </Link>
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
              <th>
                <span className={styles.visuallyHidden}>Imagen</span>
              </th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Descuento</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  Cargando productos…
                </td>
              </tr>
            )}
            {!loading && productos.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  {nombreBuscado ? "No se encontraron productos." : "Todavía no cargaste productos."}
                </td>
              </tr>
            )}
            {!loading &&
              productos.map((producto) => (
                <tr key={producto.id}>
                  <td>
                    {producto.idImagenPrincipal ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urlImagen(producto.idImagenPrincipal)} alt="" className={miTiendaStyles.miniatura} />
                    ) : (
                      <span className={miTiendaStyles.miniaturaVacia} aria-hidden="true">
                        Sin foto
                      </span>
                    )}
                  </td>
                  <td>
                    <strong>{producto.nombre}</strong>
                    {producto.nombresSubcategorias.length > 0 && (
                      <div className={miTiendaStyles.subcategorias}>{producto.nombresSubcategorias.join(" · ")}</div>
                    )}
                  </td>
                  <td>{producto.precio.toLocaleString("es-PY")} Gs</td>
                  <td>{producto.descuento ? `${producto.descuento}%` : "—"}</td>
                  <td>
                    {producto.cantidadDisponible === 0 ? (
                      <span className={`${styles.badge} ${styles.badgeInactivo}`}>Sin stock</span>
                    ) : (
                      producto.cantidadDisponible
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/mi-tienda/productos/${producto.id}/editar`} className={styles.linkAction}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        disabled={eliminando === producto.id}
                        onClick={() => eliminar(producto)}
                        className={`${styles.linkAction} ${styles.linkActionDanger}`}
                      >
                        {eliminando === producto.id ? "Eliminando…" : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} productos` : ""}
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
