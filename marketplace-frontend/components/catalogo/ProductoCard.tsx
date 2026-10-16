import Link from "next/link";
import styles from "@/app/home/home.module.css";
import type { Producto } from "@/types/Producto";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

export default function ProductoCard({ producto }: { producto: Producto }) {
  return (
    <article className={styles.productCard}>
      <Link href={`/productos/${producto.id}`} className={styles.productImage} aria-label={`Ver ${producto.nombre}`}>
        {producto.idImagenPrincipal ? (
          <img
            src={`${API_URL}/imagenes/${producto.idImagenPrincipal}`}
            alt={producto.nombre}
            className={styles.productImageImg}
          />
        ) : (
          <span>{producto.nombre}</span>
        )}
      </Link>

      <div className={styles.productInfo}>
        <div>
          <h4>
            <Link href={`/productos/${producto.id}`}>{producto.nombre}</Link>
          </h4>

          <small>
            <Link href={`/tiendas/${producto.idTienda}`}>{producto.nombreTienda}</Link>
          </small>
        </div>

        <strong>{producto.precio.toLocaleString("es-PY")} GS</strong>
      </div>

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

      <div className={styles.productExtra}>
        {producto.puntuacion !== null && <span>★ {producto.puntuacion}</span>}
        <span>{producto.cantidadDisponible > 0 ? `Stock: ${producto.cantidadDisponible}` : "Sin stock"}</span>
      </div>
    </article>
  );
}
