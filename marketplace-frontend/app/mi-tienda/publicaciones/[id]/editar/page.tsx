"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import PublicacionForm from "@/components/mi-tienda/PublicacionForm";
import { ApiError } from "@/lib/api";
import { obtenerMiPublicacion } from "@/services/publicacionService";
import type { Publicacion } from "@/types/Publicacion";

export default function EditarPublicacionPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Link href="/mi-tienda/publicaciones" className={styles.backLink}>
        ← Volver a mis publicaciones
      </Link>
      <h2 className={styles.pageTitle}>Editar publicación</h2>
      {/* `key` fuerza un remount por cada id, para que el estado de carga
          arranque limpio sin reasignarlo dentro del efecto. */}
      <EditarPublicacionContenido key={id} id={id} />
    </div>
  );
}

function EditarPublicacionContenido({ id }: { id: string }) {
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarPublicacion() {
      try {
        const data = await obtenerMiPublicacion(id);
        if (!cancelado) setPublicacion(data);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar la publicación.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargarPublicacion();
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (loading) return <p className={styles.notice}>Cargando publicación…</p>;
  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }
  if (!publicacion) return null;

  return <PublicacionForm modo="editar" publicacion={publicacion} />;
}
