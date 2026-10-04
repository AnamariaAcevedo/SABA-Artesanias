"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import ProductoForm from "@/components/mi-tienda/ProductoForm";
import { ApiError, apiFetch } from "@/lib/api";
import type { Producto } from "@/types/Producto";

export default function EditarProductoPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Link href="/mi-tienda" className={styles.backLink}>
        ← Volver a mis productos
      </Link>
      <h2 className={styles.pageTitle}>Editar producto</h2>
      {/* `key` fuerza un remount por cada id, para que el estado de carga
          arranque limpio sin reasignarlo dentro del efecto. */}
      <EditarProductoContenido key={id} id={id} />
    </div>
  );
}

function EditarProductoContenido({ id }: { id: string }) {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarProducto() {
      try {
        const data = await apiFetch<Producto>(`/mi-tienda/productos/${id}`);
        if (!cancelado) setProducto(data);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el producto.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargarProducto();
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (loading) return <p className={styles.notice}>Cargando producto…</p>;
  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }
  if (!producto) return null;

  return <ProductoForm modo="editar" producto={producto} />;
}
