"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./carrusel.module.css";
import type { Producto } from "@/types/Producto";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

// Tiempo que se muestra cada pieza antes de pasar a la siguiente.
const INTERVALO_MS = 6000;

/*
 * "Conocé las artesanías": carrusel con las piezas que tienen foto. Avanza solo
 * (salvo con el mouse encima o si el usuario prefiere menos movimiento) y se
 * puede navegar con las flechas o los puntos.
 */
export default function CarruselDestacados({ productos }: { productos: Producto[] }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);

  const total = productos.length;
  const indice = total > 0 ? actual % total : 0;

  useEffect(() => {
    if (pausado || total < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const temporizador = window.setTimeout(() => {
      setActual((previo) => (previo + 1) % total);
    }, INTERVALO_MS);

    return () => window.clearTimeout(temporizador);
  }, [indice, pausado, total]);

  if (total === 0) return null;

  const irA = (nuevo: number) => setActual((nuevo + total) % total);

  return (
    <section
      className={styles.carrusel}
      aria-roledescription="carrusel"
      aria-label="Conocé las artesanías"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      {productos.map((producto, i) => {
        const activo = i === indice;
        const tieneDescuento = producto.precioFinal < producto.precio;

        return (
          <article
            key={producto.id}
            className={`${styles.slide} ${activo ? styles.slideActivo : ""}`}
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${total}`}
            aria-hidden={!activo}
          >
            <div className={styles.texto}>
              <p className={styles.eyebrow}>Conocé las artesanías</p>

              <h2 className={styles.nombre}>{producto.nombre}</h2>

              <p className={styles.tienda}>
                por{" "}
                <Link href={`/tiendas/${producto.idTienda}`} tabIndex={activo ? 0 : -1}>
                  {producto.nombreTienda}
                </Link>
              </p>

              {producto.descripcion && <p className={styles.descripcion}>{producto.descripcion}</p>}

              <div className={styles.pie}>
                <span className={styles.precio}>
                  {producto.precioFinal.toLocaleString("es-PY")} Gs.
                  {tieneDescuento && <s>{producto.precio.toLocaleString("es-PY")} Gs.</s>}
                </span>

                <Link
                  href={`/productos/${producto.id}`}
                  className={styles.boton}
                  tabIndex={activo ? 0 : -1}
                >
                  Ver pieza
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                </Link>
              </div>
            </div>

            <Link
              href={`/productos/${producto.id}`}
              className={styles.imagen}
              tabIndex={-1}
              aria-hidden="true"
            >
              {/* Imagen servida por el backend (URL dinámica): no pasa por el optimizador de next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_URL}/imagenes/${producto.idImagenPrincipal}`}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
              />
            </Link>
          </article>
        );
      })}

      {total > 1 && (
        <div className={styles.controles}>
          <button type="button" className={styles.flecha} onClick={() => irA(indice - 1)} aria-label="Anterior">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>

          <div className={styles.puntos}>
            {productos.map((producto, i) => (
              <button
                key={producto.id}
                type="button"
                className={`${styles.punto} ${i === indice ? styles.puntoActivo : ""}`}
                onClick={() => irA(i)}
                aria-label={`Ver ${producto.nombre}`}
                aria-current={i === indice}
              />
            ))}
          </div>

          <button type="button" className={styles.flecha} onClick={() => irA(indice + 1)} aria-label="Siguiente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
