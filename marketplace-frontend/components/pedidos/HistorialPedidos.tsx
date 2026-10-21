"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import EstadoPedidoBadge from "@/components/pedidos/EstadoPedidoBadge";
import { ApiError } from "@/lib/api";
import { formatearPrecio } from "@/lib/carrito";
import {
  ETIQUETA_ESTADO,
  ORDEN_ESTADOS,
  formatearFechaHora,
  listarMisPedidos,
  puedeCancelarCliente,
} from "@/lib/pedidos";
import { cancelarPedidoPropio } from "@/services/pedidoService";
import type { Pagination } from "@/types/api";
import type { Pedido } from "@/types/pedido";
import pedidosStyles from "./pedidos.module.css";

// Historial de pedidos del usuario autenticado (GET /pedidos/mios), del más
// nuevo al más viejo, con su estado y la opción de cancelar mientras se pueda.
// En el perfil se abre con el botón "Mis pedidos"; `onVolver` regresa a los datos.
export default function HistorialPedidos({ onVolver }: { onVolver?: () => void }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelando, setCancelando] = useState<number | null>(null);

  const perPage = 5;

  const cargarPedidos = useCallback(async () => {
    try {
      const { data, pagination: paginacion } = await listarMisPedidos(page, perPage);
      setPedidos(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar tus pedidos.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // Refetch intencional al cambiar de página; setState solo ocurre dentro de
    // cargarPedidos después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPedidos();
  }, [cargarPedidos]);

  async function cancelar(pedido: Pedido) {
    if (cancelando !== null) return;
    if (!window.confirm(`¿Querés cancelar el pedido N.º ${pedido.numero} de ${pedido.nombreTienda}?`)) return;

    setCancelando(pedido.id);
    setError("");
    try {
      const actualizado = await cancelarPedidoPropio(pedido.id);
      setPedidos((actuales) => actuales.map((actual) => (actual.id === actualizado.id ? actualizado : actual)));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cancelar el pedido.");
    } finally {
      setCancelando(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <section className={styles.card} aria-labelledby="titulo-mis-pedidos">
      <div className={styles.sectionHeader}>
        <h3 id="titulo-mis-pedidos" className={styles.sectionSubtitle}>
          Mis pedidos
        </h3>
        {onVolver && (
          <button type="button" className={styles.buttonOutline} onClick={onVolver}>
            Volver al perfil
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {loading && <p className={styles.notice}>Cargando pedidos…</p>}

      {!loading && !error && pedidos.length === 0 && (
        <p className={styles.notice}>
          Todavía no realizaste pedidos. <Link href="/home">Ver el catálogo</Link>
        </p>
      )}

      {!loading && pedidos.length > 0 && (
        <ul className={pedidosStyles.historial}>
          {pedidos.map((pedido) => {
            const paso = ORDEN_ESTADOS.indexOf(pedido.estado as (typeof ORDEN_ESTADOS)[number]);
            return (
              <li key={pedido.id} className={pedidosStyles.pedido}>
                <div className={pedidosStyles.pedidoCabecera}>
                  <h4>
                    Pedido N.º {pedido.numero} · <Link href={`/tiendas/${pedido.idTienda}`}>{pedido.nombreTienda}</Link>
                  </h4>
                  <EstadoPedidoBadge estado={pedido.estado} />
                </div>

                {pedido.estado !== "CANCELADO" && (
                  <ol className={pedidosStyles.progreso} aria-label="Progreso del pedido">
                    {ORDEN_ESTADOS.map((estado, indice) => (
                      <li
                        key={estado}
                        className={indice <= paso ? pedidosStyles.alcanzado : undefined}
                        aria-current={indice === paso ? "step" : undefined}
                      >
                        {ETIQUETA_ESTADO[estado]}
                      </li>
                    ))}
                  </ol>
                )}

                <div className={pedidosStyles.pedidoCuerpo}>
                  <ul className={pedidosStyles.items}>
                    {pedido.items.map((item) => (
                      <li key={item.idProducto}>
                        <Link href={`/productos/${item.idProducto}`}>{item.nombreProducto}</Link> · {item.cantidad} ×{" "}
                        {formatearPrecio(item.precioUnitario)}
                      </li>
                    ))}
                  </ul>
                  <div>
                    Entrega en {pedido.direccion}, {pedido.nombreBarrio}
                    {pedido.referencia && <span className={pedidosStyles.secundario}>Ref.: {pedido.referencia}</span>}
                    <span className={pedidosStyles.secundario}>
                      Realizado el {formatearFechaHora(pedido.fechaPedido)}
                    </span>
                    {pedido.fechaEntrega && (
                      <span className={pedidosStyles.secundario}>
                        Entregado el {formatearFechaHora(pedido.fechaEntrega)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={pedidosStyles.pedidoPie}>
                  <span>
                    Total: <strong>{formatearPrecio(pedido.total)}</strong>
                  </span>
                  {puedeCancelarCliente(pedido.estado) && (
                    <button
                      type="button"
                      className={`${styles.linkAction} ${styles.linkActionDanger}`}
                      onClick={() => cancelar(pedido)}
                      disabled={cancelando !== null}
                    >
                      {cancelando === pedido.id ? "Cancelando…" : "Cancelar pedido"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && pagination && pagination.total > perPage && (
        <div className={styles.pagination}>
          <span>
            Página {page} de {totalPaginas} · {pagination.total} pedidos
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
      )}
    </section>
  );
}
