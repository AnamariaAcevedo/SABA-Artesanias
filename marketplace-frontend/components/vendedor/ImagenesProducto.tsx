"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import vendedorStyles from "@/components/vendedor/vendedor.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { ACCESO } from "@/lib/access";
import { ApiError, apiFetch, getApiUrl } from "@/lib/api";

type Imagen = {
  id: number;
  contentType: string;
  idProducto: number;
};

// Mismo límite que spring.servlet.multipart.max-file-size en el backend.
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

function urlImagen(id: number): string {
  try {
    return `${getApiUrl()}/imagenes/${id}`;
  } catch {
    return "";
  }
}

export default function ImagenesProducto({ productoId }: { productoId: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
  const [error, setError] = useState("");

  const cargarImagenes = useCallback(async () => {
    try {
      const data = await apiFetch<Imagen[]>(`/productos/${productoId}/imagenes`);
      // El backend toma como principal la de menor id (la primera subida).
      setImagenes([...data].sort((a, b) => a.id - b.id));
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las imágenes.");
    } finally {
      setLoading(false);
    }
  }, [productoId]);

  useEffect(() => {
    // setState solo ocurre dentro de cargarImagenes después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarImagenes();
  }, [cargarImagenes]);

  async function subir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (subiendo) return;
    setError("");

    const archivo = inputRef.current?.files?.[0];
    if (!archivo) {
      setError("Elegí una imagen para subir.");
      return;
    }
    if (!archivo.type.startsWith("image/")) {
      setError("El archivo tiene que ser una imagen.");
      return;
    }
    if (archivo.size > TAMANHO_MAXIMO) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }

    const datos = new FormData();
    datos.append("archivo", archivo);

    setSubiendo(true);
    try {
      await apiFetch(`/productos/${productoId}/imagenes`, { method: "POST", body: datos });
      if (inputRef.current) inputRef.current.value = "";
      await cargarImagenes();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos subir la imagen.");
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminar(imagen: Imagen) {
    if (!window.confirm("¿Eliminar esta imagen? Esta acción no se puede deshacer.")) return;
    setAccionEnCurso(imagen.id);
    setError("");
    try {
      await apiFetch(`/imagenes/${imagen.id}`, { method: "DELETE" });
      await cargarImagenes();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos eliminar la imagen.");
    } finally {
      setAccionEnCurso(null);
    }
  }

  return (
    <section className={`${styles.card} ${vendedorStyles.imagesCard}`} aria-labelledby="titulo-imagenes">
      <h3 id="titulo-imagenes" className={styles.title}>
        Imágenes
      </h3>
      <p className={styles.pageSubtitle}>La primera imagen que subiste es la que se muestra en el catálogo.</p>

      {error && (
        <p role="alert" className={`${styles.error} ${vendedorStyles.spaced}`}>
          {error}
        </p>
      )}

      {loading ? (
        <p className={`${styles.notice} ${vendedorStyles.spaced}`}>
          Cargando imágenes…
        </p>
      ) : imagenes.length === 0 ? (
        <p className={`${styles.notice} ${vendedorStyles.spaced}`}>
          Este producto todavía no tiene imágenes.
        </p>
      ) : (
        <ul className={vendedorStyles.imageGrid}>
          {imagenes.map((imagen, indice) => (
            <li key={imagen.id} className={vendedorStyles.imageItem}>
              {/* eslint-disable-next-line @next/next/no-img-element -- binario servido por el backend */}
              <img src={urlImagen(imagen.id)} alt={`Imagen ${indice + 1} del producto`} />
              {indice === 0 && <small>Principal</small>}
              <ConPermiso permisos={ACCESO.eliminarImagenes}>
                <button
                  type="button"
                  disabled={accionEnCurso === imagen.id}
                  onClick={() => eliminar(imagen)}
                  className={`${styles.linkAction} ${styles.linkActionDanger}`}
                >
                  Eliminar
                </button>
              </ConPermiso>
            </li>
          ))}
        </ul>
      )}

      <ConPermiso permisos={ACCESO.subirImagenes}>
        <form onSubmit={subir} aria-busy={subiendo}>
          <label htmlFor="archivo" className={styles.visuallyHidden}>
            Imagen del producto
          </label>
          <div className={vendedorStyles.uploadRow}>
            <input
              id="archivo"
              ref={inputRef}
              type="file"
              accept="image/*"
              disabled={subiendo}
              className={vendedorStyles.fileInput}
            />
            <button type="submit" disabled={subiendo} className={styles.buttonPrimary}>
              {subiendo ? "Subiendo…" : "Subir imagen"}
            </button>
          </div>
          <p className={vendedorStyles.hint}>Formatos de imagen, hasta 5 MB.</p>
        </form>
      </ConPermiso>
    </section>
  );
}
