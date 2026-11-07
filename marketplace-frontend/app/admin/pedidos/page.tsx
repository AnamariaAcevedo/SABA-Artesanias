"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import pedidosStyles from "@/components/pedidos/pedidos.module.css";
import EstadoPedidoBadge from "@/components/pedidos/EstadoPedidoBadge";
import ReferenciaEntrega from "@/components/pedidos/ReferenciaEntrega";
import { ApiError, apiFetchConPaginacion } from "@/lib/api";
import { formatearPrecio } from "@/lib/carrito";
import { formatearFechaHora, listarPedidosAdministracion } from "@/lib/pedidos";
import type { Pagination } from "@/types/api";
import type { Pedido } from "@/types/pedido";
import type { Tienda } from "@/types/Tienda";

const PEDIDOS_POR_PAGINA = 10;

async function cargarTodasLasTiendas(): Promise<Tienda[]> {
  const tiendas: Tienda[] = [];
  let page = 1;

  while (true) {
    const resultado = await apiFetchConPaginacion<Tienda[]>(`/tiendas?page=${page}&perPage=100`);
    tiendas.push(...resultado.data);
    if (!resultado.pagination || tiendas.length >= resultado.pagination.total || resultado.data.length === 0) {
      return tiendas;
    }
    page++;
  }
}

export default function PedidosAdministracionPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [idTienda, setIdTienda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    async function cargarTiendas() {
      try {
        const resultado = await cargarTodasLasTiendas();
        if (vigente) setTiendas(resultado);
      } catch (cause) {
        if (vigente) {
          setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las tiendas.");
        }
      }
    }

    void cargarTiendas();
    return () => {
      vigente = false;
    };
  }, []);

  const cargarPedidos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const tiendaSeleccionada = idTienda ? Number(idTienda) : undefined;
      const resultado = await listarPedidosAdministracion(page, PEDIDOS_POR_PAGINA, tiendaSeleccionada);
      setPedidos(resultado.data);
      setPagination(resultado.pagination);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, [idTienda, page]);

  useEffect(() => {
    // Refetch intencional al cambiar la tienda o la página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarPedidos();
  }, [cargarPedidos]);

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>Pedidos</h2>
          <p className={styles.pageSubtitle}>Consultá todos los pedidos o filtrá los de una tienda.</p>
        </div>
        <button type="button" className={styles.buttonGhost} disabled={loading} onClick={() => void cargarPedidos()}>
          Actualizar
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="pedidos-tienda">Tienda</label>
          <select
            id="pedidos-tienda"
            value={idTienda}
            onChange={(event) => {
              setIdTienda(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las tiendas</option>
            {tiendas.map((tienda) => (
              <option key={tienda.id} value={tienda.id}>{tienda.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Tienda</th>
              <th>Cliente</th>
              <th>Entrega</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className={styles.emptyRow}>Cargando pedidos…</td></tr>}
            {!loading && pedidos.length === 0 && (
              <tr><td colSpan={7} className={styles.emptyRow}>No hay pedidos para la tienda seleccionada.</td></tr>
            )}
            {!loading && pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>
                  <strong>N.º {pedido.numero}</strong>
                  <span className={pedidosStyles.secundario}>{formatearFechaHora(pedido.fechaPedido)}</span>
                </td>
                <td>{pedido.nombreTienda}</td>
                <td>
                  {pedido.nombreReceptor}
                  <span className={pedidosStyles.secundario}>{pedido.telefonoReceptor}</span>
                  <span className={pedidosStyles.secundario}>{pedido.emailReceptor}</span>
                  {pedido.idUsuario === null && <span className={pedidosStyles.secundario}>Invitado</span>}
                </td>
                <td>
                  {pedido.direccion}
                  <span className={pedidosStyles.secundario}>{pedido.nombreBarrio}</span>
                  <ReferenciaEntrega referencia={pedido.referencia} />
                </td>
                <td>
                  <ul className={pedidosStyles.items}>
                    {pedido.items.map((item) => (
                      <li key={item.idProducto}>{item.cantidad} × {item.nombreProducto}</li>
                    ))}
                  </ul>
                </td>
                <td className={pedidosStyles.total}>{formatearPrecio(pedido.total)}</td>
                <td>
                  <EstadoPedidoBadge estado={pedido.estado} />
                  {pedido.fechaEntrega && (
                    <span className={pedidosStyles.secundario}>{formatearFechaHora(pedido.fechaEntrega)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} pedidos` : ""}</span>
        <div className={styles.paginationButtons}>
          <button
            type="button"
            className={styles.buttonGhost}
            disabled={page <= 1 || loading}
            onClick={() => setPage((actual) => Math.max(1, actual - 1))}
          >
            Anterior
          </button>
          <button
            type="button"
            className={styles.buttonGhost}
            disabled={page >= totalPaginas || loading}
            onClick={() => setPage((actual) => actual + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
