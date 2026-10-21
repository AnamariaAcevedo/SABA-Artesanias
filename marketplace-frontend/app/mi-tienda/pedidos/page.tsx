"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import pedidosStyles from "@/components/pedidos/pedidos.module.css";
import EstadoPedidoBadge from "@/components/pedidos/EstadoPedidoBadge";
import { ApiError } from "@/lib/api";
import { formatearPrecio } from "@/lib/carrito";
import {
  ACCIONES_TIENDA,
  accionesDisponibles,
  aplicarAccionTienda,
  etiquetaEstado,
  formatearFechaHora,
  listarPedidosTienda,
  sugerirPedidosTienda,
  type AccionTienda,
} from "@/lib/pedidos";
import BuscadorConSugerencias, { type Sugerencia } from "@/components/buscador/BuscadorConSugerencias";
import type { Pagination } from "@/types/api";
import type { Pedido } from "@/types/pedido";

// Pedidos recibidos por la tienda, del más nuevo al más viejo. Cada fila ofrece
// solo las transiciones válidas para su estado; el backend vuelve a validarlas.
export default function PedidosTiendaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState<{ id: number; accion: AccionTienda } | null>(null);
  // `numero` es lo que se escribe; `numeroBuscado` el filtro aplicado al buscar.
  const [numero, setNumero] = useState("");
  const [numeroBuscado, setNumeroBuscado] = useState<number | undefined>(undefined);

  const perPage = 10;

  const cargarPedidos = useCallback(async () => {
    try {
      const { data, pagination: paginacion } = await listarPedidosTienda(page, perPage, numeroBuscado);
      setPedidos(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los pedidos.");
    } finally {
      setLoading(false);
    }
  }, [page, numeroBuscado]);

  useEffect(() => {
    // Refetch intencional al cambiar de página; setState solo ocurre dentro de
    // cargarPedidos después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPedidos();
  }, [cargarPedidos]);

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valor = Number(numero.trim());
    setPage(1);
    setNumeroBuscado(Number.isInteger(valor) && valor > 0 ? valor : undefined);
  }

  // Al vaciar el buscador se vuelven a listar todos los pedidos.
  function cambiarNumero(valor: string) {
    const digitos = valor.replace(/\D/g, "");
    setNumero(digitos);
    if (digitos === "" && numeroBuscado !== undefined) {
      setPage(1);
      setNumeroBuscado(undefined);
    }
  }

  // Mientras se escribe: pedidos cuyo número empieza con esos dígitos ("1" → 1, 10, 12…).
  async function sugerirNumeros(texto: string): Promise<Sugerencia[]> {
    const pedidosSugeridos = await sugerirPedidosTienda(texto);
    return pedidosSugeridos.map((pedido) => ({
      clave: pedido.numero,
      texto: `N.º ${pedido.numero}`,
      detalle: `${pedido.nombreReceptor} · ${etiquetaEstado(pedido.estado)} · ${formatearPrecio(pedido.total)}`,
    }));
  }

  function elegirPedido(sugerencia: Sugerencia) {
    setNumero(String(sugerencia.clave));
    setPage(1);
    setNumeroBuscado(Number(sugerencia.clave));
  }

  async function aplicar(pedido: Pedido, accion: AccionTienda) {
    if (procesando !== null) return;
    if (!window.confirm(ACCIONES_TIENDA[accion].pregunta.replace("{numero}", String(pedido.numero)))) return;

    setProcesando({ id: pedido.id, accion });
    setError("");
    try {
      const actualizado = await aplicarAccionTienda(pedido.id, accion);
      setPedidos((actuales) => actuales.map((actual) => (actual.id === actualizado.id ? actualizado : actual)));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos actualizar el pedido.");
    } finally {
      setProcesando(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Pedidos</h2>
        <button type="button" className={styles.buttonGhost} onClick={() => void cargarPedidos()}>
          Actualizar
        </button>
      </div>

      <form onSubmit={buscar} className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="numero-pedido">Número de pedido</label>
          <BuscadorConSugerencias
            id="numero-pedido"
            inputMode="numeric"
            pattern="[0-9]*"
            minimo={1}
            valor={numero}
            alCambiar={cambiarNumero}
            obtenerSugerencias={sugerirNumeros}
            alSeleccionar={elegirPedido}
            placeholder="Ej.: 12"
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
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Entrega</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  Cargando pedidos…
                </td>
              </tr>
            )}
            {!loading && pedidos.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  {numeroBuscado !== undefined
                    ? `No hay ningún pedido con el número ${numeroBuscado}.`
                    : "Todavía no recibiste pedidos."}
                </td>
              </tr>
            )}
            {!loading &&
              pedidos.map((pedido) => {
                const acciones = accionesDisponibles(pedido.estado);
                return (
                  <tr key={pedido.id}>
                    <td>
                      <strong>N.º {pedido.numero}</strong>
                      <span className={pedidosStyles.secundario}>{formatearFechaHora(pedido.fechaPedido)}</span>
                    </td>
                    <td>
                      {pedido.nombreReceptor}
                      <span className={pedidosStyles.secundario}>{pedido.telefonoReceptor}</span>
                      <span className={pedidosStyles.secundario}>{pedido.emailReceptor}</span>
                      {pedido.idUsuario === null && <span className={pedidosStyles.secundario}>Invitado</span>}
                    </td>
                    <td>
                      {pedido.direccion}
                      <span className={pedidosStyles.secundario}>{pedido.nombreBarrio}</span>
                      {pedido.referencia && (
                        <span className={pedidosStyles.secundario}>Ref.: {pedido.referencia}</span>
                      )}
                    </td>
                    <td>
                      <ul className={pedidosStyles.items}>
                        {pedido.items.map((item) => (
                          <li key={item.idProducto}>
                            {item.cantidad} × {item.nombreProducto}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className={pedidosStyles.total}>{formatearPrecio(pedido.total)}</td>
                    <td>
                      <EstadoPedidoBadge estado={pedido.estado} />
                      {pedido.fechaEntrega && (
                        <span className={pedidosStyles.secundario}>
                          {formatearFechaHora(pedido.fechaEntrega)}
                        </span>
                      )}
                    </td>
                    <td>
                      {acciones.length === 0 ? (
                        "—"
                      ) : (
                        <div className={styles.rowActions}>
                          {acciones.map((accion) => (
                            <button
                              key={accion}
                              type="button"
                              disabled={procesando !== null}
                              onClick={() => aplicar(pedido, accion)}
                              className={
                                accion === "cancelar"
                                  ? `${styles.linkAction} ${styles.linkActionDanger}`
                                  : styles.linkAction
                              }
                            >
                              {procesando?.id === pedido.id && procesando?.accion === accion
                                ? ACCIONES_TIENDA[accion].enCurso
                                 : ACCIONES_TIENDA[accion].etiqueta}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} pedidos` : ""}
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
