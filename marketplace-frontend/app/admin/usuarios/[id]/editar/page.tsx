"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import UsuarioForm from "@/components/admin/usuarios/UsuarioForm";
import { ApiError, apiFetch } from "@/lib/api";
import type { Usuario } from "@/types/usuario";

export default function EditarUsuarioPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Link href="/admin/usuarios" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <h2 className={styles.pageTitle}>Editar usuario</h2>
      {/* `key` fuerza un remount por cada id, para que el estado de carga
          arranque limpio sin reasignarlo dentro del efecto. */}
      <EditarUsuarioContenido key={id} id={id} />
    </div>
  );
}

function EditarUsuarioContenido({ id }: { id: string }) {
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarUsuario() {
      try {
        const data = await apiFetch<Usuario>(`/usuarios/${id}`);
        if (!cancelado) setUsuarioActual(data);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el usuario.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargarUsuario();
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (loading) return <p className={styles.notice}>Cargando usuario…</p>;
  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }
  if (!usuarioActual) return null;

  return <UsuarioForm modo="editar" usuarioId={usuarioActual.id} valoresIniciales={usuarioActual} />;
}
