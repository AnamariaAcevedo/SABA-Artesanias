"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import dashboardStyles from "@/components/admin/dashboard.module.css";
import EstadoPedidoBadge from "@/components/pedidos/EstadoPedidoBadge";
import { ApiError } from "@/lib/api";
import { obtenerResumenDashboard } from "@/lib/dashboard";
import { formatearFechaHora } from "@/lib/pedidos";
import type { DashboardResumen } from "@/types/dashboard";

const PERIODOS = [7, 30, 90] as const;

function formatearMonto(valor: number): string {
  return `Gs. ${Math.round(valor).toLocaleString("es-PY")}`;
}

function formatearFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AdminPage() {
  const [periodo, setPeriodo] = useState(30);
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setResumen(await obtenerResumenDashboard(periodo));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el resumen del dashboard.");
    } finally {
      setCargando(false);
    }
  }, [periodo]);

  useEffect(() => {
    // Refetch intencional al cambiar el período.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const maximoDiario = Math.max(0, ...(resumen?.ventasDiarias.map((venta) => venta.total) ?? []));
  const cadaCuantasEtiquetas = periodo <= 7 ? 1 : periodo <= 30 ? 5 : 15;

  return (
    <div className={dashboardStyles.dashboard}>
      <div className={dashboardStyles.encabezado}>
        <div>
          <h2 className={styles.title}>Resumen general</h2>
          <p className={styles.pageSubtitle}>Estado de pedidos, ventas y alertas del marketplace.</p>
        </div>
        <div className={dashboardStyles.periodos} aria-label="Período del resumen">
          {PERIODOS.map((dias) => (
            <button
              key={dias}
              type="button"
              className={`${dashboardStyles.periodo} ${periodo === dias ? dashboardStyles.periodoActivo : ""}`}
              aria-pressed={periodo === dias}
              disabled={cargando}
              onClick={() => setPeriodo(dias)}
            >
              {dias} días
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.buttonGhost} onClick={() => void cargar()}>Reintentar</button>
        </div>
      )}
      {cargando && !resumen && <p className={styles.notice} role="status">Cargando resumen…</p>}

      {resumen && (
        <>
          <section className={dashboardStyles.metricas} aria-label="Indicadores principales">
            <article className={dashboardStyles.metrica}>
              <span>Pedidos pendientes</span><strong>{resumen.pedidosPendientes}</strong><small>Esperan confirmación</small>
            </article>
            <article className={dashboardStyles.metrica}>
              <span>Ventas de hoy</span><strong>{formatearMonto(resumen.ventasHoy)}</strong><small>Pedidos activos</small>
            </article>
            <article className={dashboardStyles.metrica}>
              <span>Ventas del mes</span><strong>{formatearMonto(resumen.ventasMes)}</strong><small>Desde el día 1</small>
            </article>
            <article className={dashboardStyles.metrica}>
              <span>Ventas en {resumen.periodoDias} días</span><strong>{formatearMonto(resumen.ventasPeriodo)}</strong><small>{resumen.pedidosPeriodo} pedidos</small>
            </article>
            <article className={dashboardStyles.metrica}>
              <span>Ticket promedio</span><strong>{formatearMonto(resumen.ticketPromedio)}</strong><small>Promedio del período</small>
            </article>
            <article className={dashboardStyles.metrica}>
              <span>Entregados</span><strong>{resumen.pedidosEntregadosPeriodo}</strong><small>Durante el período</small>
            </article>
            <article className={dashboardStyles.metrica}>
              <span>Cancelados</span><strong>{resumen.pedidosCanceladosPeriodo}</strong><small>Durante el período</small>
            </article>
          </section>

          <div className={dashboardStyles.dosColumnas}>
            <section className={dashboardStyles.panel} aria-labelledby="titulo-ventas-diarias">
              <div className={dashboardStyles.panelCabecera}>
                <h3 id="titulo-ventas-diarias">Ventas diarias</h3>
                <span>{formatearFecha(resumen.desde)} al {formatearFecha(resumen.hasta)}</span>
              </div>
              <div className={dashboardStyles.graficoScroll}>
                <ol className={dashboardStyles.grafico}>
                  {resumen.ventasDiarias.map((venta, indice) => {
                    const altura = maximoDiario === 0 ? 0 : Math.max(2, (venta.total / maximoDiario) * 100);
                    const mostrarEtiqueta = indice % cadaCuantasEtiquetas === 0 || indice === resumen.ventasDiarias.length - 1;
                    return (
                      <li
                        key={venta.fecha}
                        className={dashboardStyles.barraItem}
                        aria-label={`${formatearFecha(venta.fecha)}: ${formatearMonto(venta.total)}, ${venta.pedidos} pedidos`}
                        title={`${formatearFecha(venta.fecha)} · ${formatearMonto(venta.total)} · ${venta.pedidos} pedidos`}
                      >
                        <span className={dashboardStyles.barra} style={{ height: `${altura}%` }} />
                        <span className={`${dashboardStyles.etiquetaFecha} ${mostrarEtiqueta ? "" : dashboardStyles.sinEtiqueta}`}>
                          {formatearFecha(venta.fecha)}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
              <p className={dashboardStyles.leyenda}>Incluye pedidos confirmados, enviados y entregados.</p>
            </section>

            <section className={dashboardStyles.panel} aria-labelledby="titulo-alertas">
              <div className={dashboardStyles.panelCabecera}><h3 id="titulo-alertas">Alertas</h3></div>
              <div className={dashboardStyles.alertas}>
                <Link href="/admin/general" className={dashboardStyles.alerta}>
                  <span>Productos con 5 unidades o menos</span><strong>{resumen.productosStockBajo}</strong>
                </Link>
                <Link href="/admin/solicitudes-vendedor" className={dashboardStyles.alerta}>
                  <span>Solicitudes de vendedor pendientes</span><strong>{resumen.solicitudesVendedorPendientes}</strong>
                </Link>
                <div className={dashboardStyles.alerta}>
                  <span>Pedidos pendientes de confirmación</span><strong>{resumen.pedidosPendientes}</strong>
                </div>
              </div>
            </section>
          </div>

          <section className={dashboardStyles.panel} aria-labelledby="titulo-tiendas">
            <div className={dashboardStyles.panelCabecera}>
              <h3 id="titulo-tiendas">Resumen por tienda</h3><span>Hasta 5 tiendas con mayor venta</span>
            </div>
            {resumen.tiendas.length === 0 ? <p className={dashboardStyles.vacio}>Todavía no hay tiendas registradas.</p> : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Tienda</th><th>Pedidos</th><th>Total vendido</th><th>Pendientes</th></tr></thead>
                  <tbody>{resumen.tiendas.map((tienda) => (
                    <tr key={tienda.idTienda}>
                      <td><Link href={`/tiendas/${tienda.idTienda}`} className={dashboardStyles.tablaEnlace}>{tienda.nombreTienda}</Link></td>
                      <td>{tienda.pedidos}</td><td>{formatearMonto(tienda.totalVendido)}</td><td>{tienda.pendientes}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className={dashboardStyles.panel} aria-labelledby="titulo-recientes">
            <div className={dashboardStyles.panelCabecera}>
              <h3 id="titulo-recientes">Pedidos recientes</h3>
            </div>
            {resumen.pedidosRecientes.length === 0 ? <p className={dashboardStyles.vacio}>Todavía no hay pedidos.</p> : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Pedido</th><th>Tienda</th><th>Cliente</th><th>Total</th><th>Fecha</th><th>Estado</th></tr></thead>
                  <tbody>{resumen.pedidosRecientes.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>N.º {pedido.numero}</td><td>{pedido.nombreTienda}</td><td>{pedido.nombreReceptor}</td>
                      <td>{formatearMonto(pedido.total)}</td><td>{formatearFechaHora(pedido.fechaPedido)}</td>
                      <td><EstadoPedidoBadge estado={pedido.estado} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
