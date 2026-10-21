"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { ACCESO } from "@/lib/access";
import { ApiError, apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { Pagination } from "@/types/api";
import type { Producto } from "@/types/Producto";
import type { Tienda } from "@/types/Tienda";

export default function ProductosVendedorPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [nombreBuscado, setNombreBuscado] = useState("");
  const [idTienda, setIdTienda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);

  const perPage = 10;

  // Igual que en usuarios: los refetch no vuelven a `loading = true`
  // para evitar parpadeos y setState síncronos dentro del efecto.
  const cargarProductos = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (nombreBuscado.trim()) params.set("nombre", nombreBuscado.trim());
      if (idTienda) params.set("idTienda", idTienda);

      const { data, pagination: paginacion } = await apiFetchConPaginacion<Producto[]>(
        `/productos?${params.toString()}`,
      );
      setProductos(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, [page, nombreBuscado, idTienda]);

  useEffect(() => {
    // Refetch intencional al cambiar página/filtros; setState solo ocurre
    // dentro de cargarProductos después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarProductos();
  }, [cargarProductos]);

  useEffect(() => {
    let cancelado = false;
    async function cargarTiendas() {
      try {
        const data = await apiFetch<Tienda[]>("/tiendas?page=1&perPage=100");
        if (!cancelado) setTiendas(data);
      } catch {
        // Sin tiendas el filtro queda solo con "Todas"; el listado sigue funcionando.
      }
    }
    cargarTiendas();
    return () => {
      cancelado = true;
    };
  }, []);

  function buscar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setNombreBuscado(nombre);
  }

  async function eliminar(producto: Producto) {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setAccionEnCurso(producto.id);
    setError("");
    try {
      await apiFetch(`/productos/${producto.id}`, { method: "DELETE" });
      await cargarProductos();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos eliminar el producto.");
    } finally {
      setAccionEnCurso(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Gestión de productos</h2>
        <ConPermiso permisos={ACCESO.crearProducto}>
          <Link href="/vendedor/productos/nuevo" className={styles.buttonPrimary}>
            + Nuevo producto
          </Link>
        </ConPermiso>
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
        <div className={styles.field}>
          <label htmlFor="idTienda">Tienda</label>
          <select
            id="idTienda"
            value={idTienda}
            onChange={(event) => {
              setIdTienda(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas</option>
            {tiendas.map((tienda) => (
              <option key={tienda.id} value={tienda.id}>
                {tienda.nombre}
              </option>
            ))}
          </select>
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
              <th>Tienda</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Imagen</th>
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
                  No se encontraron productos.
                </td>
              </tr>
            )}
            {!loading &&
              productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.nombre}</td>
                  <td>{producto.nombreTienda}</td>
                  <td>{producto.precio.toLocaleString("es-PY")} GS</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        producto.cantidadDisponible > 0 ? styles.badgeActivo : styles.badgeInactivo
                      }`}
                    >
                      {producto.cantidadDisponible > 0 ? producto.cantidadDisponible : "Sin stock"}
                    </span>
                  </td>
                  <td>{producto.idImagenPrincipal ? "Sí" : "Sin imagen"}</td>
                  <td>
                    <div className={styles.rowActions}>
                      <ConPermiso permisos={ACCESO.editarProducto}>
                        <Link href={`/vendedor/productos/${producto.id}/editar`} className={styles.linkAction}>
                          Editar
                        </Link>
                      </ConPermiso>

                      <ConPermiso permisos={ACCESO.subirImagenes}>
                        <Link
                          href={`/vendedor/productos/${producto.id}/editar#imagenes`}
                          className={styles.linkAction}
                        >
                          Imágenes
                        </Link>
                      </ConPermiso>

                      <ConPermiso permisos={ACCESO.eliminarProducto}>
                        <button
                          type="button"
                          disabled={accionEnCurso === producto.id}
                          onClick={() => eliminar(producto)}
                          className={`${styles.linkAction} ${styles.linkActionDanger}`}
                        >
                          Eliminar
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
