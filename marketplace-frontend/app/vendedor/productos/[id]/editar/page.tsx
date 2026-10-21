"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { useSesion } from "@/components/auth/SesionProvider";
import ImagenesProducto from "@/components/vendedor/ImagenesProducto";
import ProductoForm from "@/components/vendedor/ProductoForm";
import { ACCESO, cumplePermisos } from "@/lib/access";
import { ApiError, apiFetch } from "@/lib/api";
import type { Producto } from "@/types/Producto";

export default function EditarProductoPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Link href="/vendedor/productos" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <h2 className={styles.pageTitle}>Editar producto</h2>
      {/* `key` fuerza un remount por cada id, para que el estado de carga
          arranque limpio sin reasignarlo dentro del efecto. */}
      <EditarProductoContenido key={id} id={id} />
    </div>
  );
}

function EditarProductoContenido({ id }: { id: string }) {
  const { sesion } = useSesion();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarProducto() {
      try {
        const data = await apiFetch<Producto>(`/productos/${id}`);
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

  // Se puede llegar solo con permiso de imágenes: en ese caso se muestra
  // el producto en modo lectura y únicamente se gestionan sus imágenes.
  const puedeEditar = sesion ? cumplePermisos(sesion.permisos, ACCESO.editarProducto) : false;

  return (
    <>
      {puedeEditar ? (
        <ProductoForm modo="editar" productoId={producto.id} valoresIniciales={producto} />
      ) : (
        <div className={styles.card}>
          <h3 className={styles.title}>{producto.nombre}</h3>
          <p className={styles.pageSubtitle}>
            {producto.nombreTienda} · {producto.descripcion}
          </p>
        </div>
      )}

      <ConPermiso permisos={ACCESO.subirImagenes}>
        <div id="imagenes">
          <ImagenesProducto productoId={producto.id} />
        </div>
      </ConPermiso>
    </>
  );
}
