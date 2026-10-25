"use client";

import { useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import resumenStyles from "@/components/mi-tienda/resumenTienda.module.css";
import { useSesion } from "@/components/auth/SesionProvider";
import { ApiError, apiFetchConPaginacion } from "@/lib/api";
import type { Producto } from "@/types/Producto";

type Resumen = {
  productos: number;
  sinStock: number;
};

// Primera pantalla de "Mi tienda": resumen de la tienda vinculada al usuario.
// El layout ya garantiza que la sesión tiene una tienda.
export default function MiTiendaInicioPage() {
  const { sesion } = useSesion();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarResumen() {
      try {
        // "Sin stock" se calcula sobre los primeros 100; el total sale de la paginación.
        const productos = await apiFetchConPaginacion<Producto[]>("/mi-tienda/productos?page=1&perPage=100");
        if (cancelado) return;
        setResumen({
          productos: productos.pagination?.total ?? productos.data.length,
          sinStock: productos.data.filter((producto) => producto.cantidadDisponible <= 0).length,
        });
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el resumen.");
      }
    }
    cargarResumen();
    return () => {
      cancelado = true;
    };
  }, []);

  const valor = (numero: number | undefined) => (numero === undefined ? "…" : numero.toLocaleString("es-PY"));

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Dashboard vendedor</h2>
      <p className={styles.pageSubtitle}>
        Bienvenido{sesion ? `, ${sesion.nombre}` : ""}. Desde acá gestionás los productos de tu tienda.
      </p>

      {sesion?.idTienda != null && (
        <section className={resumenStyles.miTienda} aria-labelledby="mi-tienda-titulo">
          <h3 id="mi-tienda-titulo" className={resumenStyles.miTiendaTitulo}>
            Mi tienda
          </h3>
          <strong className={resumenStyles.miTiendaNombre}>{sesion.nombreTienda}</strong>
        </section>
      )}

      {error ? (
        <p role="alert" className={`${styles.error} ${resumenStyles.spaced}`}>
          {error}
        </p>
      ) : (
        <div className={resumenStyles.stats} aria-busy={!resumen}>
          <div className={resumenStyles.stat}>
            <span className={resumenStyles.statValue}>{valor(resumen?.productos)}</span>
            <span className={resumenStyles.statLabel}>Productos publicados</span>
          </div>
          <div className={resumenStyles.stat}>
            <span className={resumenStyles.statValue}>{valor(resumen?.sinStock)}</span>
            <span className={resumenStyles.statLabel}>Productos sin stock</span>
          </div>
        </div>
      )}
    </div>
  );
}
