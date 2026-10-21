"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import vendedorStyles from "@/components/vendedor/vendedor.module.css";
import { ApiError, apiFetch } from "@/lib/api";
import type { Tienda } from "@/types/Tienda";

export default function EditarTiendaPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <Link href="/vendedor/tiendas" className={styles.backLink}>
        ← Volver al listado
      </Link>
      <h2 className={styles.pageTitle}>Editar tienda</h2>
      {/* `key` fuerza un remount por cada id, para que el estado de carga
          arranque limpio sin reasignarlo dentro del efecto. */}
      <EditarTiendaContenido key={id} id={id} />
    </div>
  );
}

function EditarTiendaContenido({ id }: { id: string }) {
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarTienda() {
      try {
        const data = await apiFetch<Tienda>(`/tiendas/${id}`);
        if (!cancelado) setTienda(data);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar la tienda.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargarTienda();
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (loading) return <p className={styles.notice}>Cargando tienda…</p>;
  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }
  if (!tienda) return null;

  return <TiendaForm tienda={tienda} />;
}

function TiendaForm({ tienda }: { tienda: Tienda }) {
  const router = useRouter();
  const enviandoRef = useRef(false);
  const [nombre, setNombre] = useState(tienda.nombre);
  const [descripcion, setDescripcion] = useState(tienda.descripcion);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    if (!nombre.trim() || !descripcion.trim()) {
      setError("Completá todos los campos obligatorios.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      // La dirección no se envía: se mantiene la que ya tiene la tienda.
      await apiFetch(`/tiendas/${tienda.id}`, {
        method: "PUT",
        body: JSON.stringify({ nombre: nombre.trim(), descripcion: descripcion.trim() }),
      });
      router.push("/vendedor/tiendas");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos guardar la tienda.");
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="nombreTienda">Nombre</label>
            <input
              id="nombreTienda"
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <span className={vendedorStyles.fieldLabel}>Dirección</span>
            <span className={vendedorStyles.readonlyValue}>{tienda.nombreDireccion || "—"}</span>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="descripcionTienda">Descripción</label>
          <textarea
            id="descripcionTienda"
            required
            className={vendedorStyles.textarea}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.buttonOutline}
            onClick={() => router.push("/vendedor/tiendas")}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
