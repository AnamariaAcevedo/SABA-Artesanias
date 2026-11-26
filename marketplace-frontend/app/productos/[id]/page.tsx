"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import homeStyles from "@/app/home/home.module.css";
import styles from "../producto.module.css";

import { Producto } from "@/types/Producto";
import { obtenerImagenesProducto, obtenerProductoPorId, obtenerProductos } from "@/services/productoService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import BotonInicio from "@/components/catalogo/BotonInicio";
import ProductoCard from "@/components/catalogo/ProductoCard";
import Carrito from "@/components/carrito/Carrito";
import { useHaySesion } from "@/lib/auth";
import { agregarAlCarrito, formatearPrecio, useCarrito } from "@/lib/carrito";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

// Cantidad de productos de la misma tienda que se sugieren debajo.
const CANTIDAD_RELACIONADOS = 4;
// Desde esta cantidad para abajo se avisa que quedan pocas unidades.
const UMBRAL_POCAS_UNIDADES = 5;

export default function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>();

  return <ProductoDetalleContenido key={id} id={Number(id)} />;
}

function ProductoDetalleContenido({ id }: { id: number }) {
  const haySesion = useHaySesion();
  const { items } = useCarrito();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [imagenes, setImagenes] = useState<number[]>([]);
  const [imagenActiva, setImagenActiva] = useState<number | null>(null);
  const [relacionados, setRelacionados] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [aviso, setAviso] = useState<{ tipo: "exito" | "info"; texto: string } | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [productoRespuesta, imagenesRespuesta] = await Promise.all([
          obtenerProductoPorId(id),
          obtenerImagenesProducto(id).catch(() => null),
        ]);
        if (cancelado) return;

        const datos = productoRespuesta.data;
        const idsImagenes = imagenesRespuesta?.data.map((imagen) => imagen.id) ?? [];
        if (datos.idImagenPrincipal && !idsImagenes.includes(datos.idImagenPrincipal)) {
          idsImagenes.unshift(datos.idImagenPrincipal);
        }

        setProducto(datos);
        setImagenes(idsImagenes);
        setImagenActiva(datos.idImagenPrincipal ?? idsImagenes[0] ?? null);

        // Sugerencias: otros productos de la misma tienda (si falla, no se muestran).
        const deLaTienda = await obtenerProductos(undefined, datos.idTienda).catch(() => null);
        if (cancelado || !deLaTienda) return;
        setRelacionados(
          deLaTienda.data.filter((otro) => otro.id !== datos.id).slice(0, CANTIDAD_RELACIONADOS),
        );
      } catch (error) {
        if (cancelado) return;
        console.error("Error cargando el producto:", error);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [id]);

  const enCarrito = items.find((item) => item.idProducto === id)?.cantidad ?? 0;
  // Un producto desactivado por la tienda se muestra (p. ej. desde un pedido viejo),
  // pero no se puede comprar: para la compra cuenta como sin stock.
  const aLaVenta = producto?.activo !== false && producto?.tiendaActiva !== false;
  const stock = aLaVenta ? (producto?.cantidadDisponible ?? 0) : 0;
  const disponibleParaAgregar = Math.max(0, stock - enCarrito);
  const cantidadValida = Math.min(Math.max(cantidad, 1), Math.max(disponibleParaAgregar, 1));

  function cambiarCantidad(nueva: number) {
    setAviso(null);
    setCantidad(Math.min(Math.max(nueva, 1), Math.max(disponibleParaAgregar, 1)));
  }

  function agregar() {
    if (!producto) return;

    const agregadas = agregarAlCarrito(producto, cantidadValida);
    if (agregadas === 0) {
      setAviso({ tipo: "info", texto: "No hay más stock disponible de este producto." });
      return;
    }

    setAviso({
      tipo: "exito",
      texto: agregadas === 1 ? "Se agregó 1 unidad al carrito." : `Se agregaron ${agregadas} unidades al carrito.`,
    });
    setCantidad(1);
  }

  function moverImagen(paso: number) {
    if (imagenes.length < 2) return;
    const actual = Math.max(0, imagenes.indexOf(imagenActiva ?? imagenes[0]));
    setImagenActiva(imagenes[(actual + paso + imagenes.length) % imagenes.length]);
  }

  const precioFinal = producto ? (producto.precioFinal ?? producto.precio) : 0;
  const tieneDescuento = producto !== null && precioFinal < producto.precio;

  // Estado del stock como etiqueta de color.
  const estadoStock = !aLaVenta
    ? { clase: styles.estadoAgotado, texto: "No disponible" }
    : stock === 0
      ? { clase: styles.estadoAgotado, texto: "Sin stock" }
      : stock <= UMBRAL_POCAS_UNIDADES
        ? { clase: styles.estadoPocas, texto: `Últimas ${stock} ${stock === 1 ? "unidad" : "unidades"}` }
        : { clase: styles.estadoDisponible, texto: `En stock · ${stock} disponibles` };

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
        {cargando && <p className={styles.statusMessage}>Cargando producto...</p>}

        {!cargando && !producto && (
          <p className={styles.statusMessage}>No encontramos este producto.</p>
        )}

        {!cargando && producto && (
          <>
            <nav className={styles.migas} aria-label="Ubicación">
              <Link href="/home">Catálogo</Link>
              <span aria-hidden="true">›</span>
              <Link href={`/tiendas/${producto.idTienda}`}>{producto.nombreTienda}</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">{producto.nombre}</span>
            </nav>

            <section className={styles.detalle}>
              <div className={styles.galeria}>
                <div className={styles.imagenPrincipal}>
                  {imagenActiva ? (
                    // Imagen servida por el backend (URL dinámica): no pasa por el optimizador de next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${API_URL}/imagenes/${imagenActiva}`} alt={producto.nombre} />
                  ) : (
                    <span className={styles.sinFoto}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden="true">
                        <path d="M8 3h8M9 3v3c-2.8 1.2-4.5 3.9-4.5 7 0 4.4 3.4 8 7.5 8s7.5-3.6 7.5-8c0-3.1-1.7-5.8-4.5-7V3" />
                        <path d="M5 13h14" />
                      </svg>
                      Sin fotografía
                    </span>
                  )}

                  {tieneDescuento && producto.descuento !== null && (
                    <span className={styles.etiquetaDescuento}>−{producto.descuento}%</span>
                  )}

                  {imagenes.length > 1 && (
                    <>
                      <button type="button" className={`${styles.flecha} ${styles.flechaAnterior}`} onClick={() => moverImagen(-1)} aria-label="Foto anterior">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
                      </button>
                      <button type="button" className={`${styles.flecha} ${styles.flechaSiguiente}`} onClick={() => moverImagen(1)} aria-label="Foto siguiente">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                      </button>
                    </>
                  )}
                </div>

                {imagenes.length > 1 && (
                  <div className={styles.miniaturas}>
                    {imagenes.map((idImagen, indice) => (
                      <button
                        key={idImagen}
                        type="button"
                        className={styles.miniatura}
                        aria-pressed={idImagen === imagenActiva}
                        aria-label={`Ver foto ${indice + 1}`}
                        onClick={() => setImagenActiva(idImagen)}
                      >
                        {/* Imagen servida por el backend (URL dinámica): no pasa por el optimizador de next/image. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${API_URL}/imagenes/${idImagen}`} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.info}>
                <Link href={`/tiendas/${producto.idTienda}`} className={styles.tienda}>
                  {producto.nombreTienda}
                </Link>

                <h2 className={styles.nombre}>{producto.nombre}</h2>

                {producto.puntuacion !== null && (
                  <p className={styles.puntuacion}>
                    <span aria-hidden="true">★</span> {producto.puntuacion}
                  </p>
                )}

                <div className={styles.precio}>
                  <strong>{formatearPrecio(precioFinal)}</strong>
                  {tieneDescuento && <s>{formatearPrecio(producto.precio)}</s>}
                </div>
                {tieneDescuento && (
                  <p className={styles.ahorro}>
                    Ahorrás {formatearPrecio(producto.precio - precioFinal)}
                    {producto.descuento !== null && ` (−${producto.descuento}%)`}
                  </p>
                )}

                <span className={`${styles.estadoStock} ${estadoStock.clase}`}>{estadoStock.texto}</span>

                {producto.descripcion && (
                  <div className={styles.bloque}>
                    <h3>Descripción</h3>
                    <p>{producto.descripcion}</p>
                  </div>
                )}

                {producto.nombresSubcategorias?.length > 0 && (
                  <div className={homeStyles.productCategories}>
                    {producto.nombresSubcategorias.map((nombreSubcategoria) => (
                      <span key={nombreSubcategoria}>{nombreSubcategoria}</span>
                    ))}
                  </div>
                )}

                {stock > 0 && (
                  <div className={styles.compra}>
                    <div className={styles.cantidad} role="group" aria-label="Cantidad">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(cantidadValida - 1)}
                        disabled={disponibleParaAgregar === 0 || cantidadValida <= 1}
                        aria-label="Bajar cantidad"
                      >
                        −
                      </button>
                      <span aria-live="polite">{cantidadValida}</span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(cantidadValida + 1)}
                        disabled={disponibleParaAgregar === 0 || cantidadValida >= disponibleParaAgregar}
                        aria-label="Subir cantidad"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.botonAgregar}
                      onClick={agregar}
                      disabled={disponibleParaAgregar === 0}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 4h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" />
                        <circle cx="9.5" cy="19.5" r="1.2" />
                        <circle cx="17" cy="19.5" r="1.2" />
                      </svg>
                      Añadir al carrito
                    </button>
                  </div>
                )}

                {enCarrito > 0 && (
                  <p className={styles.enCarrito}>
                    Tenés {enCarrito} en tu carrito ·{" "}
                    <Link href="/carrito/confirmar">Finalizar compra →</Link>
                  </p>
                )}

                {stock > 0 && disponibleParaAgregar === 0 && (
                  <p className={styles.aviso} role="status">
                    Ya tenés en el carrito todo el stock disponible de este producto.
                  </p>
                )}

                {!aLaVenta && (
                  <p className={styles.aviso} role="status">
                    Este producto ya no está a la venta.
                  </p>
                )}

                {aLaVenta && stock === 0 && (
                  <p className={styles.aviso} role="status">
                    Este producto no tiene stock, por lo que no se puede pedir por ahora.
                  </p>
                )}

                {aviso && (
                  <p className={`${styles.aviso} ${aviso.tipo === "exito" ? styles.avisoExito : ""}`} role="status">
                    {aviso.texto}
                  </p>
                )}

                <Link href={`/tiendas/${producto.idTienda}`} className={styles.fichaTienda}>
                  <span className={styles.fichaAvatar} aria-hidden="true">
                    {producto.nombreTienda.charAt(0).toUpperCase()}
                  </span>
                  <span className={styles.fichaTexto}>
                    <small>Hecho por</small>
                    <strong>{producto.nombreTienda}</strong>
                  </span>
                  <span className={styles.fichaVer}>
                    Ver tienda
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </Link>
              </div>
            </section>

            {relacionados.length > 0 && (
              <section className={styles.relacionados} aria-labelledby="relacionados-titulo">
                <header className={styles.relacionadosCabecera}>
                  <h3 id="relacionados-titulo">Más de {producto.nombreTienda}</h3>
                  <Link href={`/tiendas/${producto.idTienda}`}>Ver todo →</Link>
                </header>
                {/* storeSection activa las columnas adaptables del catálogo (container query). */}
                <div className={homeStyles.storeSection}>
                  <div className={homeStyles.products}>
                    {relacionados.map((otro) => (
                      <ProductoCard key={otro.id} producto={otro} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
