"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import homeStyles from "@/app/home/home.module.css";
import styles from "./tiendas.module.css";

import { Producto } from "@/types/Producto";
import { Tienda } from "@/types/Tienda";
import type { CuponPublico } from "@/types/cupon";
import { obtenerTiendas } from "@/services/tiendaService";
import { obtenerProductos } from "@/services/productoService";
import { listarCuponesPublicos } from "@/services/cuponService";
import ModalCodigoCupon from "@/components/cupones/ModalCodigoCupon";
import MenuUsuario from "@/components/auth/MenuUsuario";
import Carrito from "@/components/carrito/Carrito";
import BotonBuscar from "@/components/catalogo/BotonBuscar";
import BuscadorConSugerencias, { coincide } from "@/components/buscador/BuscadorConSugerencias";
import BotonInicio from "@/components/catalogo/BotonInicio";
import { useHaySesion } from "@/lib/auth";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

const CANTIDAD_RECAP = 4;

export default function TiendasPage() {
  const router = useRouter();
  const haySesion = useHaySesion();

  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [productosPorTienda, setProductosPorTienda] = useState<Record<number, Producto[]>>({});
  const [cuponPorTienda, setCuponPorTienda] = useState<Record<number, CuponPublico>>({});
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  // Filtro aplicado al listado: cambia con Enter o al vaciar el buscador.
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  // Cupón cuyo modal con el código está abierto (botón "Obtener cupón").
  const [cuponAbierto, setCuponAbierto] = useState<CuponPublico | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarTiendas() {
      try {
        const respuesta = await obtenerTiendas();
        if (cancelado) return;

        setTiendas(respuesta.data);
        if (respuesta.data.length === 0) {
          setMensaje("No hay tiendas disponibles.");
          return;
        }

        // Recap: traemos algunos productos de cada tienda para mostrar
        // una vista previa en el listado.
        const resultados = await Promise.all(
          respuesta.data.map((tienda) =>
            obtenerProductos(undefined, tienda.id).catch(() => ({ data: [] as Producto[] }))
          )
        );
        if (cancelado) return;

        const mapa: Record<number, Producto[]> = {};
        respuesta.data.forEach((tienda, indice) => {
          mapa[tienda.id] = resultados[indice].data;
        });
        setProductosPorTienda(mapa);

        // Cupón vigente de cada tienda (si tiene más de uno, se muestra el primero).
        try {
          const cupones = await listarCuponesPublicos(1, 50);
          if (cancelado) return;
          const mapaCupones: Record<number, CuponPublico> = {};
          cupones.data.forEach((cupon) => {
            if (!mapaCupones[cupon.idTienda]) mapaCupones[cupon.idTienda] = cupon;
          });
          setCuponPorTienda(mapaCupones);
        } catch (error) {
          console.error("Error cargando cupones:", error);
        }
      } catch (error) {
        if (cancelado) return;
        console.error("Error cargando tiendas:", error);
        setMensaje("No pudimos cargar las tiendas.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarTiendas();
    return () => {
      cancelado = true;
    };
  }, []);

  const tiendasFiltradas = useMemo(() => {
    if (!busquedaAplicada.trim()) return tiendas;
    return tiendas.filter((tienda) => coincide(tienda.nombre, busquedaAplicada));
  }, [tiendas, busquedaAplicada]);

  function buscarTienda(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBusquedaAplicada(busqueda);
  }

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor);
    if (valor.trim() === "") setBusquedaAplicada("");
  }

  // Las tiendas ya están cargadas: las sugerencias se calculan sin ir al servidor.
  function sugerirTiendas(texto: string) {
    return tiendas
      .filter((tienda) => coincide(tienda.nombre, texto))
      .map((tienda) => ({ clave: tienda.id, texto: tienda.nombre, detalle: tienda.direccionCompleta }));
  }

  // El botón vive dentro del <Link> de la tienda: evita que el click navegue.
  function obtenerCupon(evento: MouseEvent, cupon: CuponPublico) {
    evento.preventDefault();
    evento.stopPropagation();
    setCuponAbierto(cupon);
  }

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <BotonInicio />

        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        <form className={homeStyles.searchBar} onSubmit={buscarTienda}>
          <BuscadorConSugerencias
            claseContenedor={homeStyles.searchField}
            placeholder="Buscar tiendas..."
            aria-label="Buscar tiendas"
            valor={busqueda}
            alCambiar={cambiarBusqueda}
            obtenerSugerencias={sugerirTiendas}
            alSeleccionar={(sugerencia) => router.push(`/tiendas/${sugerencia.clave}`)}
            suppressHydrationWarning
          />

          <BotonBuscar />
        </form>

        <Link href="/cupones" className={homeStyles.navButton}>
          Cupones
        </Link>

        <Link href="/canal" className={homeStyles.navButton}>
          Canal
        </Link>

        {haySesion === undefined ? null : haySesion ? (
          <MenuUsuario />
        ) : (
          <Link href="/login" className={homeStyles.logoutButton} style={{ marginLeft: "auto" }}>
            Iniciar sesión
          </Link>
        )}

        <Carrito />
      </header>

      <div className={styles.content}>
        <header className={styles.encabezado}>
          <p className={styles.eyebrow}>Nuestros artesanos</p>
          <h2 className={styles.pageTitle}>Tiendas</h2>
        </header>

        {cargando && <p className={styles.statusMessage}>Cargando tiendas...</p>}
        {!cargando && mensaje && <p className={styles.statusMessage}>{mensaje}</p>}
        {!cargando && !mensaje && tiendasFiltradas.length === 0 && (
          <p className={styles.statusMessage}>No encontramos tiendas con ese nombre.</p>
        )}

        {!cargando && tiendasFiltradas.length > 0 && (
          <div className={styles.tiendasGrid}>
            {tiendasFiltradas.map((tienda) => {
              const productosTienda = productosPorTienda[tienda.id] ?? [];
              // Portada: mosaico con las fotos de hasta 4 productos de la tienda.
              const fotos = productosTienda
                .filter((producto) => producto.idImagenPrincipal !== null)
                .slice(0, CANTIDAD_RECAP);
              const cupon = cuponPorTienda[tienda.id];

              return (
                <Link key={tienda.id} href={`/tiendas/${tienda.id}`} className={styles.tiendaCard}>
                  <div className={styles.tiendaPortada} data-fotos={fotos.length} aria-hidden="true">
                    {fotos.map((producto) => (
                      // Imagen servida por el backend (URL dinámica): no pasa por el optimizador de next/image.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={producto.id}
                        src={`${API_URL}/imagenes/${producto.idImagenPrincipal}`}
                        alt=""
                        loading="lazy"
                      />
                    ))}
                  </div>

                  <div className={styles.tiendaCuerpo}>
                    <span className={styles.tiendaAvatar} aria-hidden="true">
                      {tienda.nombre.charAt(0).toUpperCase()}
                    </span>

                    <h3 className={styles.tiendaNombre}>{tienda.nombre}</h3>
                    {tienda.descripcion && <p className={styles.tiendaDescripcion}>{tienda.descripcion}</p>}

                    <span className={styles.tiendaDireccion}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                        <circle cx="12" cy="9.5" r="2.5" />
                      </svg>
                      {tienda.nombreDireccion}
                    </span>

                    <div className={styles.tiendaPie}>
                      <span className={styles.tiendaPiezas}>
                        {productosTienda.length} {productosTienda.length === 1 ? "pieza" : "piezas"}
                      </span>

                      {cupon && (
                        <button
                          type="button"
                          className={styles.obtenerButton}
                          onClick={(evento) => obtenerCupon(evento, cupon)}
                        >
                          Cupón −{cupon.porcentaje}%
                        </button>
                      )}

                      <span className={styles.tiendaVer}>
                        Ver tienda
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {cuponAbierto && <ModalCodigoCupon cupon={cuponAbierto} onCerrar={() => setCuponAbierto(null)} />}
    </main>
  );
}
