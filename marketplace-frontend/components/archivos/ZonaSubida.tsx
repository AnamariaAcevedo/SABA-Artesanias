"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import styles from "./zonaSubida.module.css";

type Props = {
  // Recibe los archivos elegidos (por clic o arrastrando). Si devuelve false,
  // la selección se descarta del <input>.
  onArchivos: (archivos: File[]) => void | boolean;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  // Mientras es true muestra "Subiendo…" y bloquea la zona.
  cargando?: boolean;
  titulo?: string;
  ayuda?: string;
  // Solo para selección única: archivo elegido que se muestra debajo.
  archivoSeleccionado?: File | null;
  // Mantiene el archivo en el <input> (necesario para que `required` funcione).
  conservarSeleccion?: boolean;
};

function formatearTamanio(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/*
 * Zona para subir archivos: se puede hacer clic para elegir o arrastrar y soltar.
 * Usa un <input type="file"> real (oculto visualmente) para conservar la
 * accesibilidad del teclado y la validación nativa del formulario.
 */
export default function ZonaSubida({
  onArchivos,
  accept,
  multiple = false,
  required = false,
  disabled = false,
  cargando = false,
  titulo,
  ayuda,
  archivoSeleccionado,
  conservarSeleccion = false,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const bloqueada = disabled || cargando;

  function entregar(archivos: File[]) {
    if (archivos.length === 0) return;
    const resultado = onArchivos(multiple ? archivos : archivos.slice(0, 1));
    if (inputRef.current && (resultado === false || !conservarSeleccion)) {
      inputRef.current.value = "";
    }
  }

  function alCambiar(evento: ChangeEvent<HTMLInputElement>) {
    entregar(Array.from(evento.target.files ?? []));
  }

  function alSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    setArrastrando(false);
    if (bloqueada) return;

    // Solo se aceptan los tipos indicados en `accept` (p. ej. "image/png,image/jpeg").
    const tipos = accept.split(",").map((tipo) => tipo.trim());
    const archivos = Array.from(evento.dataTransfer.files).filter((archivo) => tipos.includes(archivo.type));
    if (archivos.length === 0) return;

    // Se copian al <input> para que la validación nativa (required) los vea.
    if (inputRef.current && conservarSeleccion) {
      const transferencia = new DataTransfer();
      (multiple ? archivos : archivos.slice(0, 1)).forEach((archivo) => transferencia.items.add(archivo));
      inputRef.current.files = transferencia.files;
    }
    entregar(archivos);
  }

  const textoTitulo = cargando
    ? "Subiendo…"
    : titulo ?? (multiple ? "Arrastrá tus imágenes acá" : "Arrastrá el archivo acá");

  return (
    <div className={styles.contenedor}>
      <label
        htmlFor={id}
        className={`${styles.zona} ${arrastrando ? styles.zonaActiva : ""} ${bloqueada ? styles.zonaBloqueada : ""}`}
        onDragOver={(evento) => {
          evento.preventDefault();
          if (!bloqueada) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        aria-busy={cargando}
      >
        <span className={styles.icono} aria-hidden="true">
          {cargando ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4" />
              <path d="m7 9 5-5 5 5" />
              <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          )}
        </span>

        <span className={styles.textos}>
          <strong>{textoTitulo}</strong>
          {!cargando && (
            <span>
              o <span className={styles.enlace}>elegí {multiple ? "archivos" : "un archivo"}</span> de tu equipo
            </span>
          )}
          {ayuda && <small>{ayuda}</small>}
        </span>

        <input
          ref={inputRef}
          id={id}
          type="file"
          className={styles.input}
          accept={accept}
          multiple={multiple}
          required={required}
          disabled={bloqueada}
          onChange={alCambiar}
        />
      </label>

      {archivoSeleccionado && (
        <div className={styles.seleccionado}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="m9 14 2 2 4-4" />
          </svg>
          <span className={styles.seleccionadoNombre}>{archivoSeleccionado.name}</span>
          <span className={styles.seleccionadoTamanio}>{formatearTamanio(archivoSeleccionado.size)}</span>
        </div>
      )}
    </div>
  );
}
