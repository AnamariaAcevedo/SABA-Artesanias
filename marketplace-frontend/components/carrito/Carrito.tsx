"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  formatearPrecio,
  limpiarCarrito,
  quitarDelCarrito,
  useCarrito,
} from "@/lib/carrito";
import styles from "./carrito.module.css";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

// Botón del carrito para los headers del catálogo. Al hacer clic despliega la
// lista de productos agregados, cada uno con una ✕ para quitarlo, el total y
// las acciones "Realizar compra" y "Limpiar carrito".
export default function Carrito() {
  const router = useRouter();
  const { items, cantidadTotal, total } = useCarrito();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;

    function cerrarFuera(event: PointerEvent) {
      if (!contenedor.current?.contains(event.target as Node)) {
        setAbierto(false);
      }
    }

    document.addEventListener("pointerdown", cerrarFuera);
    return () => document.removeEventListener("pointerdown", cerrarFuera);
  }, [abierto]);

  function limpiar() {
    if (!window.confirm("¿Querés quitar todos los productos del carrito?")) return;
    limpiarCarrito();
  }

  function realizarCompra() {
    setAbierto(false);
    router.push("/carrito/confirmar");
  }

  return (
    <div
      ref={contenedor}
      className={styles.contenedor}
      onKeyDown={(event) => {
        if (event.key === "Escape" && abierto) {
          event.preventDefault();
          setAbierto(false);
          boton.current?.focus();
        }
      }}
    >
      <button
        ref={boton}
        type="button"
        className={styles.disparador}
        aria-expanded={abierto}
        aria-controls={`${id}-panel`}
        aria-label={`Carrito, ${cantidadTotal} ${cantidadTotal === 1 ? "producto" : "productos"}`}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.76L20.5 8H6.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9.5" cy="19.5" r="1.4" fill="currentColor" />
          <circle cx="17" cy="19.5" r="1.4" fill="currentColor" />
        </svg>
        {cantidadTotal > 0 && <span className={styles.contador}>{cantidadTotal}</span>}
      </button>

      {abierto && (
        <div id={`${id}-panel`} className={styles.panel} role="region" aria-label="Carrito de compras">
          <h2 className={styles.titulo}>Tu carrito</h2>

          {items.length === 0 ? (
            <p className={styles.vacio}>Todavía no agregaste productos.</p>
          ) : (
            <>
              <ul className={styles.lista}>
                {items.map((item) => (
                  <li key={item.idProducto} className={styles.item}>
                    <div className={styles.miniatura}>
                      {item.idImagenPrincipal ? (
                        <img src={`${API_URL}/imagenes/${item.idImagenPrincipal}`} alt="" />
                      ) : (
                        <span aria-hidden="true">{item.nombre.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className={styles.detalle}>
                      <Link
                        href={`/productos/${item.idProducto}`}
                        className={styles.nombre}
                        onClick={() => setAbierto(false)}
                      >
                        {item.nombre}
                      </Link>
                      <small>{item.nombreTienda}</small>
                      <span>
                        {item.cantidad} × {formatearPrecio(item.precioUnitario)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={styles.quitar}
                      aria-label={`Quitar ${item.nombre} del carrito`}
                      title="Quitar del carrito"
                      onClick={() => quitarDelCarrito(item.idProducto)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>

              <p className={styles.total}>
                <span>Total</span>
                <strong>{formatearPrecio(total)}</strong>
              </p>

              <div className={styles.acciones}>
                <button type="button" className={styles.botonPrincipal} onClick={realizarCompra}>
                  Realizar compra
                </button>
                <button type="button" className={styles.botonSecundario} onClick={limpiar}>
                  Limpiar carrito
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
