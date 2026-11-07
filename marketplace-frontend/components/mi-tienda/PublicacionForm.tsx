"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import { avisar, confirmar } from "@/components/dialogos/Dialogos";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import { errorDeImagen, VistaPreviaImagen } from "@/components/mi-tienda/ProductoForm";
import { ApiError } from "@/lib/api";
import { formatearFechaHora } from "@/lib/pedidos";
import {
  actualizarPublicacion,
  crearPublicacion,
  quitarFotoPublicacion,
  subirFotoPublicacion,
  urlFotoPublicacion,
} from "@/services/publicacionService";
import type { Publicacion, PublicacionInput } from "@/types/Publicacion";

const MAXIMO_FOTOS = 10;
const LISTADO = "/mi-tienda/publicaciones";

interface PublicacionFormProps {
  modo: "crear" | "editar";
  publicacion?: Publicacion;
}

export default function PublicacionForm({ modo, publicacion }: PublicacionFormProps) {
  const router = useRouter();
  const enviandoRef = useRef(false);

  const [titulo, setTitulo] = useState(publicacion?.titulo ?? "");
  const [contenido, setContenido] = useState(publicacion?.contenido ?? "");
  // Al editar arranca vacío: solo cambia el vencimiento si se completa.
  const [duracionDias, setDuracionDias] = useState(modo === "crear" ? "7" : "");

  // Crear: fotos elegidas que se suben después de crear la publicación.
  const [fotosNuevas, setFotosNuevas] = useState<File[]>([]);
  // Editar: fotos ya guardadas, que se suben o quitan al momento.
  const [fotos, setFotos] = useState<number[]>(publicacion?.idsArchivos ?? []);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [errorFotos, setErrorFotos] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function elegirFotos(event: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(event.target.files ?? []);
    event.target.value = "";
    setErrorFotos("");
    if (archivos.length === 0) return;

    const invalido = archivos.map(errorDeImagen).find((mensaje) => mensaje !== null);
    if (invalido) {
      setErrorFotos(invalido);
      return;
    }
    if (fotos.length + fotosNuevas.length + archivos.length > MAXIMO_FOTOS) {
      setErrorFotos(`Una publicación puede tener hasta ${MAXIMO_FOTOS} fotos.`);
      return;
    }

    if (modo === "crear" || !publicacion) {
      setFotosNuevas((actual) => [...actual, ...archivos]);
      return;
    }

    setProcesandoFoto(true);
    try {
      for (const archivo of archivos) {
        const subida = await subirFotoPublicacion(publicacion.id, archivo);
        setFotos((actual) => [...actual, subida.id]);
      }
    } catch (cause) {
      setErrorFotos(cause instanceof ApiError ? cause.message : "No pudimos subir la foto.");
    } finally {
      setProcesandoFoto(false);
    }
  }

  async function quitarFoto(idArchivo: number) {
    if (!publicacion) return;
    const confirmado = await confirmar({
      titulo: "¿Quitar esta foto de la publicación?",
      textoConfirmar: "Quitar",
      peligro: true,
    });
    if (!confirmado) return;

    setProcesandoFoto(true);
    setErrorFotos("");
    try {
      await quitarFotoPublicacion(publicacion.id, idArchivo);
      setFotos((actual) => actual.filter((otra) => otra !== idArchivo));
    } catch (cause) {
      setErrorFotos(cause instanceof ApiError ? cause.message : "No pudimos quitar la foto.");
    } finally {
      setProcesandoFoto(false);
    }
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    if (!titulo.trim() || !contenido.trim()) {
      setError("Completá el título y el texto de la publicación.");
      return;
    }
    const dias = duracionDias ? Number(duracionDias) : undefined;
    if (modo === "crear" && dias === undefined) {
      setError("Indicá cuántos días va a estar disponible la publicación.");
      return;
    }
    if (dias !== undefined && (dias < 1 || dias > 365)) {
      setError("La duración debe ser de 1 a 365 días.");
      return;
    }

    const datos: PublicacionInput = { titulo: titulo.trim(), contenido: contenido.trim(), duracionDias: dias };

    enviandoRef.current = true;
    setEnviando(true);
    try {
      if (modo === "crear") {
        const creada = await crearPublicacion(datos);

        try {
          for (const archivo of fotosNuevas) await subirFotoPublicacion(creada.id, archivo);
        } catch {
          // La publicación ya existe: se abre su edición para reintentar las fotos.
          await avisar({
            titulo: "Faltaron fotos",
            mensaje: "La publicación se creó, pero no pudimos subir todas las fotos. Podés volver a intentarlo desde la edición.",
          });
          router.push(`${LISTADO}/${creada.id}/editar`);
          return;
        }
      } else if (publicacion) {
        await actualizarPublicacion(publicacion.id, datos);
      }
      router.push(LISTADO);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar la publicación.");
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  const ocupado = enviando || procesandoFoto;

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <form onSubmit={enviar} className={styles.form} aria-busy={ocupado}>
        <div className={styles.field}>
          <label htmlFor="titulo">Título</label>
          <input id="titulo" required maxLength={150} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label htmlFor="contenido">Texto</label>
          <textarea
            id="contenido"
            required
            maxLength={2000}
            className={miTiendaStyles.textarea}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            aria-describedby="contenido-ayuda"
          />
          <small id="contenido-ayuda" className={miTiendaStyles.ayuda}>
            {contenido.length}/2000 caracteres
          </small>
        </div>

        <div className={styles.field}>
          <label htmlFor="duracionDias">{modo === "crear" ? "Disponible durante (días)" : "Nueva duración (días)"}</label>
          <input
            id="duracionDias"
            required={modo === "crear"}
            inputMode="numeric"
            maxLength={3}
            value={duracionDias}
            onChange={(e) => setDuracionDias(e.target.value.replace(/\D/g, ""))}
            aria-describedby="duracion-ayuda"
          />
          <small id="duracion-ayuda" className={miTiendaStyles.ayuda}>
            {modo === "crear" ? "De 1 a 365 días, contados desde que la publicás." : <AyudaVencimiento publicacion={publicacion} />}
          </small>
        </div>

        <h3 className={styles.sectionSubtitle}>Fotos</h3>
        <p className={miTiendaStyles.ayuda}>Opcional. Hasta {MAXIMO_FOTOS} fotos PNG o JPG de hasta 5 MB cada una.</p>

        <div className={miTiendaStyles.galeria}>
          {modo === "editar" &&
            fotos.map((idArchivo, indice) => (
              <div key={idArchivo} className={miTiendaStyles.imagen}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlFotoPublicacion(idArchivo)} alt={`Foto ${indice + 1} de la publicación`} />
                <button
                  type="button"
                  className={`${styles.linkAction} ${styles.linkActionDanger} ${miTiendaStyles.quitarImagen}`}
                  onClick={() => void quitarFoto(idArchivo)}
                  disabled={ocupado}
                >
                  Quitar
                </button>
              </div>
            ))}
          {modo === "crear" &&
            fotosNuevas.map((archivo, indice) => (
              <VistaPreviaImagen
                key={`${archivo.name}-${indice}`}
                archivo={archivo}
                principal={false}
                deshabilitado={ocupado}
                onQuitar={() => setFotosNuevas((actual) => actual.filter((_, otro) => otro !== indice))}
              />
            ))}
        </div>

        <label className={miTiendaStyles.subirImagen}>
          <span>{procesandoFoto ? "Procesando foto…" : "Agregar fotos:"}</span>
          <input type="file" accept="image/png,image/jpeg" multiple onChange={elegirFotos} disabled={ocupado} />
        </label>

        {errorFotos && (
          <p role="alert" className={styles.error}>
            {errorFotos}
          </p>
        )}

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.buttonOutline} onClick={() => router.push(LISTADO)} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" disabled={ocupado} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : modo === "crear" ? "Publicar" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AyudaVencimiento({ publicacion }: { publicacion?: Publicacion }) {
  const fecha = publicacion?.fechaExpiracion;
  const actual = !fecha
    ? "No tiene vencimiento."
    : publicacion.vigente
      ? `Disponible hasta el ${formatearFechaHora(fecha)}.`
      : `Venció el ${formatearFechaHora(fecha)}.`;

  return <>{actual} Dejalo vacío para no cambiarlo; si lo completás, se cuenta desde hoy.</>;
}
