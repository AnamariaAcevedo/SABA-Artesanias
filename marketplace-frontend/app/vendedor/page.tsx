"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import vendedorStyles from "@/components/vendedor/vendedor.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { useSesion } from "@/components/auth/SesionProvider";
import { ACCESO } from "@/lib/access";
import { ApiError, apiFetchConPaginacion } from "@/lib/api";
import type { Producto } from "@/types/Producto";
import type { Tienda } from "@/types/Tienda";

type Resumen = {
  productos: number;
  tiendas: number;
  sinStock: number;
};

export default function VendedorPage() {
  const { sesion } = useSesion();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarResumen() {
      try {
        // "Sin stock" se calcula sobre los primeros 100 productos;
        // los totales salen de la paginación.
        const [productos, tiendas] = await Promise.all([
          apiFetchConPaginacion<Producto[]>("/productos?page=1&perPage=100"),
          apiFetchConPaginacion<Tienda[]>("/tiendas?page=1&perPage=1"),
        ]);
        if (cancelado) return;
        setResumen({
          productos: productos.pagination?.total ?? productos.data.length,
          tiendas: tiendas.pagination?.total ?? tiendas.data.length,
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
        Bienvenido{sesion ? `, ${sesion.nombre}` : ""}. Desde acá gestionás tus productos y tiendas.
      </p>

      {error ? (
        <p role="alert" className={`${styles.error} ${vendedorStyles.spaced}`}>
          {error}
        </p>
      ) : (
        <div className={vendedorStyles.stats} aria-busy={!resumen}>
          <div className={vendedorStyles.stat}>
            <span className={vendedorStyles.statValue}>{valor(resumen?.productos)}</span>
            <span className={vendedorStyles.statLabel}>Productos publicados</span>
          </div>
          <div className={vendedorStyles.stat}>
            <span className={vendedorStyles.statValue}>{valor(resumen?.sinStock)}</span>
            <span className={vendedorStyles.statLabel}>Productos sin stock</span>
          </div>
          <div className={vendedorStyles.stat}>
            <span className={vendedorStyles.statValue}>{valor(resumen?.tiendas)}</span>
            <span className={vendedorStyles.statLabel}>Tiendas</span>
          </div>
        </div>
      )}

      <div className={vendedorStyles.quickLinks}>
        <ConPermiso permisos={ACCESO.crearProducto}>
          <Link href="/vendedor/productos/nuevo" className={styles.buttonPrimary}>
            + Nuevo producto
          </Link>
        </ConPermiso>
        <Link href="/vendedor/productos" className={styles.buttonOutline}>
          Ver productos
        </Link>
        <ConPermiso permisos={ACCESO.editarTienda}>
          <Link href="/vendedor/tiendas" className={styles.buttonOutline}>
            Ver tiendas
          </Link>
        </ConPermiso>
      </div>
    </div>
  );
}
