"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "@/components/admin/admin.module.css";
import resumenStyles from "@/components/mi-tienda/resumenTienda.module.css";
import { useSesion } from "@/components/auth/SesionProvider";
import { ACCESO, cumplePermisos } from "@/lib/access";
import { ApiError, apiFetchConPaginacion } from "@/lib/api";
import type { Producto } from "@/types/Producto";

type Resumen = {
  productos: number;
  sinStock: number;
  stockBajo: number;
  inactivos: number;
};

// Se considera "stock bajo" desde esta cantidad para abajo (sin llegar a cero).
const UMBRAL_STOCK_BAJO = 5;

// Primera pantalla de "Mi tienda": resumen de la tienda vinculada al usuario.
// El layout ya garantiza que la sesión tiene una tienda.
export default function MiTiendaInicioPage() {
  const { sesion } = useSesion();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState("");
  const permisos = sesion?.permisos ?? [];
  const veProductos = cumplePermisos(permisos, ACCESO.verMisProductos);

  useEffect(() => {
    if (!veProductos) return;
    let cancelado = false;
    async function cargarResumen() {
      try {
        // Los contadores se calculan sobre los primeros 100; el total sale de la paginación.
        const productos = await apiFetchConPaginacion<Producto[]>("/mi-tienda/productos?page=1&perPage=100");
        if (cancelado) return;
        setResumen({
          productos: productos.pagination?.total ?? productos.data.length,
          sinStock: productos.data.filter((producto) => producto.cantidadDisponible <= 0).length,
          stockBajo: productos.data.filter(
            (producto) => producto.cantidadDisponible > 0 && producto.cantidadDisponible <= UMBRAL_STOCK_BAJO,
          ).length,
          inactivos: productos.data.filter((producto) => producto.activo === false).length,
        });
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el resumen.");
      }
    }
    cargarResumen();
    return () => {
      cancelado = true;
    };
  }, [veProductos]);

  const valor = (numero: number | undefined) => (numero === undefined ? "…" : numero.toLocaleString("es-PY"));

  // Accesos rápidos según los permisos de la sesión.
  const accesos = [
    { href: "/mi-tienda/productos/nuevo", titulo: "Nuevo producto", detalle: "Publicá una pieza en el catálogo", icono: ICONOS.producto, visible: cumplePermisos(permisos, ACCESO.crearMisProductos) },
    { href: "/mi-tienda/publicaciones/nuevo", titulo: "Nueva publicación", detalle: "Contá una novedad en el Canal", icono: ICONOS.publicacion, visible: cumplePermisos(permisos, ACCESO.crearMisPublicaciones) },
    { href: "/mi-tienda/cupones/nuevo", titulo: "Nuevo cupón", detalle: "Creá un descuento para tus clientes", icono: ICONOS.cupon, visible: true },
    { href: "/mi-tienda/pedidos", titulo: "Ver pedidos", detalle: "Revisá y gestioná las compras", icono: ICONOS.pedidos, visible: cumplePermisos(permisos, ACCESO.verPedidosTienda) },
  ].filter((acceso) => acceso.visible);

  const indicadores = [
    { etiqueta: "Productos publicados", valor: resumen?.productos, icono: ICONOS.producto },
    { etiqueta: "Con stock bajo", valor: resumen?.stockBajo, icono: ICONOS.alerta, aviso: (resumen?.stockBajo ?? 0) > 0 },
    { etiqueta: "Sin stock", valor: resumen?.sinStock, icono: ICONOS.vacio, aviso: (resumen?.sinStock ?? 0) > 0 },
    { etiqueta: "Inactivos", valor: resumen?.inactivos, icono: ICONOS.pausa },
  ];

  return (
    <div className={resumenStyles.contenedor}>
      <section className={resumenStyles.bienvenida}>
        <div>
          <p className={resumenStyles.eyebrow}>Mi tienda</p>
          <h2 className={resumenStyles.saludo}>Hola{sesion ? `, ${sesion.nombre}` : ""}</h2>
          <p className={resumenStyles.bajada}>
            Este es el resumen de <strong>{sesion?.nombreTienda}</strong>.
          </p>
        </div>

        {sesion?.idTienda != null && (
          <Link href={`/tiendas/${sesion.idTienda}`} className={resumenStyles.verPublica}>
            Ver mi tienda pública
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7" />
              <path d="M8 7h9v9" />
            </svg>
          </Link>
        )}
      </section>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {veProductos && !error && (
        <section aria-labelledby="indicadores-titulo">
          <h3 id="indicadores-titulo" className={resumenStyles.tituloSeccion}>Tus productos</h3>
          <div className={resumenStyles.stats} aria-busy={!resumen}>
            {indicadores.map((indicador) => (
              <div key={indicador.etiqueta} className={`${resumenStyles.stat} ${indicador.aviso ? resumenStyles.statAviso : ""}`}>
                <span className={resumenStyles.statIcono}>{indicador.icono}</span>
                <span className={resumenStyles.statValue}>{valor(indicador.valor)}</span>
                <span className={resumenStyles.statLabel}>{indicador.etiqueta}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {accesos.length > 0 && (
        <section aria-labelledby="accesos-titulo">
          <h3 id="accesos-titulo" className={resumenStyles.tituloSeccion}>Accesos rápidos</h3>
          <div className={resumenStyles.accesos}>
            {accesos.map((acceso) => (
              <Link key={acceso.href} href={acceso.href} className={resumenStyles.acceso}>
                <span className={resumenStyles.accesoIcono}>{acceso.icono}</span>
                <span className={resumenStyles.accesoTexto}>
                  <strong>{acceso.titulo}</strong>
                  <small>{acceso.detalle}</small>
                </span>
                <svg className={resumenStyles.accesoFlecha} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Icono({ children }: { children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONOS = {
  producto: (
    <Icono>
      <path d="M9 3h6M10 3v3c-3 1.2-5 4-5 7.2C5 17.5 8.1 21 12 21s7-3.5 7-7.8C19 10 17 7.2 14 6V3" />
    </Icono>
  ),
  publicacion: (
    <Icono>
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </Icono>
  ),
  cupon: (
    <Icono>
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z" />
      <path d="M9 15l6-6M9.5 9.5h.01M14.5 14.5h.01" />
    </Icono>
  ),
  pedidos: (
    <Icono>
      <path d="M4 7h16l-1.5 12a2 2 0 0 1-2 1.8h-9a2 2 0 0 1-2-1.8z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </Icono>
  ),
  alerta: (
    <Icono>
      <path d="M12 4 3 20h18z" />
      <path d="M12 10v4M12 17h.01" />
    </Icono>
  ),
  vacio: (
    <Icono>
      <circle cx="12" cy="12" r="8" />
      <path d="M7 17 17 7" />
    </Icono>
  ),
  pausa: (
    <Icono>
      <circle cx="12" cy="12" r="8" />
      <path d="M10 9v6M14 9v6" />
    </Icono>
  ),
};
