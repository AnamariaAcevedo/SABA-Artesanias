import styles from "@/app/home/home.module.css";
import type { Producto } from "@/types/Producto";
import ProductoCard from "./ProductoCard";

// Cantidad máxima de tarjetas por sección antes de colapsar el resto en "Ver todos".
export const LIMITE_VISTA_PREVIA = 6;

interface Props {
  titulo: string;
  productos: Producto[];
  expandida: boolean;
  alVerTodos: () => void;
}

/*
 * Sección del catálogo agrupada por categoría. Si tiene más de
 * LIMITE_VISTA_PREVIA productos, muestra una vista previa y una tarjeta
 * "Ver todos" que lleva a la categoría completa.
 */
export default function SeccionCategoria({ titulo, productos, expandida, alVerTodos }: Props) {
  const hayMas = !expandida && productos.length > LIMITE_VISTA_PREVIA;
  // Se reserva el último lugar de la fila para la tarjeta "Ver todos".
  const visibles = hayMas ? productos.slice(0, LIMITE_VISTA_PREVIA - 1) : productos;

  return (
    <section className={styles.categorySection}>
      <header className={styles.categorySectionHeader}>
        <div>
          <h4 className={styles.categorySectionTitle}>{titulo}</h4>
          <span className={styles.categorySectionCount}>
            {productos.length} {productos.length === 1 ? "pieza" : "piezas"}
          </span>
        </div>

        {hayMas && (
          <button type="button" className={styles.categorySectionLink} onClick={alVerTodos}>
            Ver todos
            <FlechaDerecha />
          </button>
        )}
      </header>

      <div className={`${styles.products} ${hayMas ? styles.productsPreview : ""}`}>
        {visibles.map((producto) => (
          <ProductoCard key={producto.id} producto={producto} />
        ))}

        {hayMas && (
          <button
            type="button"
            className={styles.verMasCard}
            onClick={alVerTodos}
            aria-label={`Ver los ${productos.length} productos de ${titulo}`}
          >
            <span className={styles.verMasIcono}>
              <FlechaDerecha tamanio={22} />
            </span>
            <span className={styles.verMasTexto}>Ver más productos</span>
            <span className={styles.verMasDetalle}>
              {productos.length} piezas en {titulo}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}

function FlechaDerecha({ tamanio = 16 }: { tamanio?: number }) {
  return (
    <svg
      width={tamanio}
      height={tamanio}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
