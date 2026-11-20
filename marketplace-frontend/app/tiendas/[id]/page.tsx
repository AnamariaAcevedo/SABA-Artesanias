"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import homeStyles from "@/app/home/home.module.css";
import styles from "../tiendas.module.css";

import { Producto } from "@/types/Producto";
import { Tienda } from "@/types/Tienda";
import { obtenerTiendaPorId } from "@/services/tiendaService";
import { obtenerProductos } from "@/services/productoService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import Carrito from "@/components/carrito/Carrito";
import BotonInicio from "@/components/catalogo/BotonInicio";
import ProductoCard from "@/components/catalogo/ProductoCard";
import FeedPublicaciones from "@/components/publicaciones/FeedPublicaciones";
import { useHaySesion } from "@/lib/auth";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

// Cantidad de fotos de productos que forman la portada de la tienda.
const FOTOS_PORTADA = 5;

export default function TiendaDetallePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <TiendaDetalleContenido key={id} id={id} />
  );
}

function TiendaDetalleContenido({ id }: { id: string }) {
  const haySesion = useHaySesion();
  const idTienda = Number(id);

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [seccion, setSeccion] = useState<"productos" | "publicaciones">("productos");

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [tiendaRespuesta, productosRespuesta] = await Promise.all([
          obtenerTiendaPorId(idTienda),
          obtenerProductos(undefined, idTienda),
        ]);
        if (cancelado) return;

        setTienda(tiendaRespuesta.data);
        setProductos(productosRespuesta.data);
        if (productosRespuesta.data.length === 0) {
          setMensaje("Esta tienda todavía no tiene productos publicados.");
        }
      } catch (error) {
        if (cancelado) return;
        console.error("Error cargando la tienda:", error);
        setMensaje("No pudimos cargar esta tienda.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [idTienda]);

  const fotosPortada = productos
    .filter((producto) => producto.idImagenPrincipal !== null)
    .slice(0, FOTOS_PORTADA);

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <BotonInicio />

        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        <Link href="/tiendas" className={homeStyles.navButton}>
          Tiendas
        </Link>

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
        {cargando && <p className={styles.statusMessage}>Cargando tienda...</p>}

        {!cargando && tienda && tienda.activo === false && (
          <p className={styles.statusMessage}>Esta tienda no está disponible por el momento.</p>
        )}

        {!cargando && tienda && tienda.activo !== false && (
          <>
            <section className={styles.perfilTienda}>
              {/* Portada en mosaico con las fotos de sus productos. */}
              <div className={styles.perfilPortada} data-fotos={fotosPortada.length} aria-hidden="true">
                {fotosPortada.map((producto) => (
                  // Imagen servida por el backend (URL dinámica): no pasa por el optimizador de next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={producto.id} src={`${API_URL}/imagenes/${producto.idImagenPrincipal}`} alt="" />
                ))}
              </div>

              <div className={styles.perfilCuerpo}>
                <span className={styles.perfilAvatar} aria-hidden="true">
                  {tienda.nombre.charAt(0).toUpperCase()}
                </span>

                <div className={styles.perfilInfo}>
                  <p className={styles.eyebrow}>Taller artesanal</p>
                  <h2 className={styles.perfilNombre}>{tienda.nombre}</h2>
                  {tienda.descripcion && <p className={styles.perfilDescripcion}>{tienda.descripcion}</p>}

                  <div className={styles.perfilDatos}>
                    <span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                        <circle cx="12" cy="9.5" r="2.5" />
                      </svg>
                      {tienda.direccionCompleta}
                    </span>
                    <span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 3h6M10 3v3c-3 1.2-5 4-5 7.2C5 17.5 8.1 21 12 21s7-3.5 7-7.8C19 10 17 7.2 14 6V3" />
                      </svg>
                      {productos.length} {productos.length === 1 ? "pieza" : "piezas"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className={styles.secciones} role="tablist" aria-label="Contenido de la tienda">
              <button
                type="button"
                role="tab"
                className={styles.seccion}
                aria-selected={seccion === "productos"}
                onClick={() => setSeccion("productos")}
              >
                Productos
                <span className={styles.seccionContador}>{productos.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                className={styles.seccion}
                aria-selected={seccion === "publicaciones"}
                onClick={() => setSeccion("publicaciones")}
              >
                Publicaciones
              </button>
            </div>

            {seccion === "publicaciones" ? (
              <FeedPublicaciones
                idTienda={idTienda}
                textoVacio="Esta tienda no tiene publicaciones disponibles."
              />
            ) : (
              <>
                {mensaje && <p className={styles.statusMessage}>{mensaje}</p>}

                {productos.length > 0 && (
                  // storeSection activa las columnas adaptables del catálogo (container query).
                  <div className={homeStyles.storeSection}>
                    <div className={homeStyles.products}>
                      {productos.map((producto) => (
                        <ProductoCard key={producto.id} producto={producto} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!cargando && !tienda && (
          <p className={styles.statusMessage}>No encontramos esta tienda.</p>
        )}
      </div>
    </main>
  );
}
