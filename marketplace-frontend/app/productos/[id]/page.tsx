"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import homeStyles from "@/app/home/home.module.css";
import styles from "../producto.module.css";

import { Producto } from "@/types/Producto";
import { obtenerImagenesProducto, obtenerProductoPorId } from "@/services/productoService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import BotonInicio from "@/components/catalogo/BotonInicio";
import Carrito from "@/components/carrito/Carrito";
import { useHaySesion } from "@/lib/auth";
import { agregarAlCarrito, formatearPrecio, useCarrito } from "@/lib/carrito";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

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
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [aviso, setAviso] = useState("");

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
  const stock = producto?.cantidadDisponible ?? 0;
  const disponibleParaAgregar = Math.max(0, stock - enCarrito);
  const cantidadValida = Math.min(Math.max(cantidad, 1), Math.max(disponibleParaAgregar, 1));

  function agregar() {
    if (!producto) return;

    const agregadas = agregarAlCarrito(producto, cantidadValida);
    if (agregadas === 0) {
      setAviso("No hay más stock disponible de este producto.");
      return;
    }

    setAviso(
      agregadas === 1
        ? "Se agregó 1 unidad al carrito."
        : `Se agregaron ${agregadas} unidades al carrito.`,
    );
    setCantidad(1);
  }

  const tieneDescuento =
    producto !== null && producto.descuento !== null && producto.descuento > 0;

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <BotonInicio />

        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

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
          <section className={styles.detalle}>
            <div className={styles.galeria}>
              <div className={styles.imagenPrincipal}>
                {imagenActiva ? (
                  <img src={`${API_URL}/imagenes/${imagenActiva}`} alt={producto.nombre} />
                ) : (
                  <span>{producto.nombre}</span>
                )}
              </div>

              {imagenes.length > 1 && (
                <div className={styles.miniaturas}>
                  {imagenes.map((idImagen) => (
                    <button
                      key={idImagen}
                      type="button"
                      className={styles.miniatura}
                      aria-pressed={idImagen === imagenActiva}
                      aria-label="Ver imagen"
                      onClick={() => setImagenActiva(idImagen)}
                    >
                      <img src={`${API_URL}/imagenes/${idImagen}`} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.info}>
              <h2 className={styles.nombre}>{producto.nombre}</h2>

              <Link href={`/tiendas/${producto.idTienda}`} className={styles.tienda}>
                {producto.nombreTienda}
              </Link>

              <div className={styles.precio}>
                <strong>{formatearPrecio(producto.precioFinal ?? producto.precio)}</strong>
                {tieneDescuento && (
                  <>
                    <s>{formatearPrecio(producto.precio)}</s>
                    <span className={styles.descuento}>-{producto.descuento}%</span>
                  </>
                )}
              </div>

              {producto.puntuacion !== null && (
                <p className={styles.puntuacion}>★ {producto.puntuacion}</p>
              )}

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

              <p className={stock > 0 ? styles.stock : `${styles.stock} ${styles.sinStock}`}>
                {stock > 0 ? `Stock disponible: ${stock}` : "Sin stock"}
                {enCarrito > 0 && ` · ${enCarrito} en tu carrito`}
              </p>

              {stock > 0 && (
                <div className={styles.compra}>
                  <label className={styles.cantidad}>
                    Cantidad
                    <input
                      type="number"
                      min={1}
                      max={Math.max(disponibleParaAgregar, 1)}
                      value={cantidadValida}
                      disabled={disponibleParaAgregar === 0}
                      onChange={(evento) => {
                        setAviso("");
                        setCantidad(Number(evento.target.value) || 1);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.botonAgregar}
                    onClick={agregar}
                    disabled={disponibleParaAgregar === 0}
                  >
                    Añadir al carrito
                  </button>
                </div>
              )}

              {stock > 0 && disponibleParaAgregar === 0 && (
                <p className={styles.aviso} role="status">
                  Ya tenés en el carrito todo el stock disponible de este producto.
                </p>
              )}

              {stock === 0 && (
                <p className={styles.aviso} role="status">
                  Este producto no tiene stock, por lo que no se puede pedir por ahora.
                </p>
              )}

              {aviso && (
                <p className={styles.aviso} role="status">
                  {aviso}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
