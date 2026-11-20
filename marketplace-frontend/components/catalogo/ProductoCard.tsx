import Link from "next/link";
import styles from "@/app/home/home.module.css";
import type { Producto } from "@/types/Producto";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

function formatearPrecio(valor: number) {
  return `${valor.toLocaleString("es-PY")} Gs.`;
}

export default function ProductoCard({ producto }: { producto: Producto }) {
  const tieneDescuento = producto.precioFinal < producto.precio;
  const sinStock = producto.cantidadDisponible <= 0;
  const pocoStock = !sinStock && producto.cantidadDisponible <= 5;

  return (
    <article className={styles.productCard}>
      <Link href={`/productos/${producto.id}`} className={styles.productImage} aria-label={`Ver ${producto.nombre}`}>
        {producto.idImagenPrincipal ? (
          // Imagen servida por el backend (URL dinámica): no pasa por el optimizador de next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_URL}/imagenes/${producto.idImagenPrincipal}`}
            alt={producto.nombre}
            className={styles.productImageImg}
            loading="lazy"
          />
        ) : (
          <span className={styles.productImagePlaceholder}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden="true">
              <path d="M8 3h8M9 3v3c-2.8 1.2-4.5 3.9-4.5 7 0 4.4 3.4 8 7.5 8s7.5-3.6 7.5-8c0-3.1-1.7-5.8-4.5-7V3" />
              <path d="M5 13h14" />
            </svg>
            <span>Sin fotografía</span>
          </span>
        )}

        {tieneDescuento && producto.descuento !== null && (
          <span className={styles.productBadge}>−{producto.descuento}%</span>
        )}
        {sinStock && <span className={`${styles.productBadge} ${styles.productBadgeMuted}`}>Agotado</span>}
      </Link>

      <div className={styles.productBody}>
        <Link href={`/tiendas/${producto.idTienda}`} className={styles.productStore}>
          {producto.nombreTienda}
        </Link>

        <h4 className={styles.productName}>
          <Link href={`/productos/${producto.id}`}>{producto.nombre}</Link>
        </h4>

        {producto.descripcion && (
          <p className={styles.productDescription}>{producto.descripcion}</p>
        )}

        {producto.nombresSubcategorias && producto.nombresSubcategorias.length > 0 && (
          <div className={styles.productCategories}>
            {producto.nombresSubcategorias.map((nombreSubcategoria) => (
              <span key={nombreSubcategoria}>{nombreSubcategoria}</span>
            ))}
          </div>
        )}

        <div className={styles.productFooter}>
          <div className={styles.productPrice}>
            <strong>{formatearPrecio(producto.precioFinal)}</strong>
            {tieneDescuento && <s>{formatearPrecio(producto.precio)}</s>}
          </div>

          <div className={styles.productExtra}>
            {producto.puntuacion !== null && <span>★ {producto.puntuacion}</span>}
            {pocoStock && <span>Últimas {producto.cantidadDisponible}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
