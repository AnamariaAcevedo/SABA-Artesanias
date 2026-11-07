"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useSesion } from "@/components/auth/SesionProvider";
import { confirmar } from "@/components/dialogos/Dialogos";
import { ApiError } from "@/lib/api";
import { useHaySesion } from "@/lib/auth";
import { formatearFechaHora } from "@/lib/pedidos";
import {
  comentar,
  eliminarComentario,
  listarComentarios,
  moderarComentario,
  quitarReaccion,
  reaccionar,
} from "@/services/publicacionService";
import type { ComentarioPublicacion, Publicacion } from "@/types/Publicacion";
import styles from "./publicaciones.module.css";

const POR_PAGINA = 10;

function mensajeDeError(cause: unknown, porDefecto: string): string {
  return cause instanceof ApiError ? cause.message : porDefecto;
}

// "Me gusta" y comentarios de una publicación. Cada acción se ofrece según los
// permisos del rol del usuario, los mismos que exige el backend; un invitado
// puede leer los comentarios y se lo invita a iniciar sesión. Quien gestiona la
// tienda que publicó puede borrar cualquier comentario, si su rol tiene el permiso.
export default function InteraccionPublicacion({ publicacion }: { publicacion: Publicacion }) {
  const idCampo = useId();
  const haySesion = useHaySesion();
  const { sesion } = useSesion();
  const permisos = sesion?.permisos ?? [];

  const [reaccionada, setReaccionada] = useState(publicacion.reaccionada);
  const [cantidadReacciones, setCantidadReacciones] = useState(publicacion.cantidadReacciones);
  const [reaccionando, setReaccionando] = useState(false);

  const [abierto, setAbierto] = useState(false);
  const [comentarios, setComentarios] = useState<ComentarioPublicacion[] | null>(null);
  const [cantidadComentarios, setCantidadComentarios] = useState(publicacion.cantidadComentarios);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [error, setError] = useState("");

  const puedeAlternarReaccion = permisos.includes(reaccionada ? "DELETE_REACCIONES" : "CREATE_REACCIONES");
  const puedeComentar = permisos.includes("CREATE_COMENTARIOS");
  const puedeEliminarPropios = permisos.includes("DELETE_COMENTARIOS");
  const puedeModerar = sesion?.idTienda === publicacion.idTienda && permisos.includes("DELETE_COMENTARIOS_TIENDA");

  async function alternarReaccion() {
    setReaccionando(true);
    setError("");
    try {
      setCantidadReacciones(await (reaccionada ? quitarReaccion(publicacion.id) : reaccionar(publicacion.id)));
      setReaccionada(!reaccionada);
    } catch (cause) {
      setError(mensajeDeError(cause, "No pudimos registrar tu reacción."));
    } finally {
      setReaccionando(false);
    }
  }

  async function cargarComentarios(siguiente: number) {
    setCargando(true);
    setError("");
    try {
      const { data, pagination } = await listarComentarios(publicacion.id, siguiente, POR_PAGINA);
      // Si alguien comentó mientras tanto, la página corre y puede repetir elementos.
      setComentarios((actuales) => [
        ...(actuales ?? []),
        ...data.filter((nuevo) => !actuales?.some((actual) => actual.id === nuevo.id)),
      ]);
      if (pagination) setCantidadComentarios(pagination.total);
      setPagina(siguiente);
    } catch (cause) {
      setError(mensajeDeError(cause, "No pudimos cargar los comentarios."));
    } finally {
      setCargando(false);
    }
  }

  function alternarComentarios() {
    setAbierto(!abierto);
    if (!abierto && comentarios === null) void cargarComentarios(1);
  }

  async function enviarComentario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    setEnviando(true);
    setError("");
    try {
      const creado = await comentar(publicacion.id, contenido);
      setComentarios((actuales) => [creado, ...(actuales ?? [])]);
      setCantidadComentarios((actual) => actual + 1);
      setTexto("");
    } catch (cause) {
      setError(mensajeDeError(cause, "No pudimos publicar tu comentario."));
    } finally {
      setEnviando(false);
    }
  }

  async function quitarComentario(comentario: ComentarioPublicacion) {
    const esPropio = comentario.idUsuario === sesion?.id;
    const confirmado = await confirmar({
      titulo: esPropio ? "¿Eliminar tu comentario?" : `¿Eliminar el comentario de ${comentario.nombreUsuario}?`,
      textoConfirmar: "Eliminar",
      peligro: true,
    });
    if (!confirmado) return;

    setEliminando(comentario.id);
    setError("");
    try {
      await (puedeModerar ? moderarComentario(publicacion.id, comentario.id) : eliminarComentario(comentario.id));
      setComentarios((actuales) => actuales?.filter((otro) => otro.id !== comentario.id) ?? null);
      setCantidadComentarios((actual) => Math.max(0, actual - 1));
    } catch (cause) {
      setError(mensajeDeError(cause, "No pudimos eliminar el comentario."));
    } finally {
      setEliminando(null);
    }
  }

  const etiquetaReacciones = `${cantidadReacciones} me gusta`;

  return (
    <div className={styles.interaccion}>
      <div className={styles.acciones}>
        {puedeAlternarReaccion ? (
          <button
            type="button"
            className={styles.accion}
            aria-pressed={reaccionada}
            onClick={() => void alternarReaccion()}
            disabled={reaccionando}
          >
            <span aria-hidden="true">{reaccionada ? "♥" : "♡"}</span> {etiquetaReacciones}
          </button>
        ) : haySesion === false ? (
          <Link href="/login" className={styles.accion}>
            <span aria-hidden="true">♡</span> {etiquetaReacciones}
          </Link>
        ) : (
          <span className={styles.accionFija}>
            <span aria-hidden="true">{reaccionada ? "♥" : "♡"}</span> {etiquetaReacciones}
          </span>
        )}

        <button type="button" className={styles.accion} aria-expanded={abierto} onClick={alternarComentarios}>
          {cantidadComentarios} {cantidadComentarios === 1 ? "comentario" : "comentarios"}
        </button>
      </div>

      {error && (
        <p className={styles.alerta} role="alert">
          {error}
        </p>
      )}

      {abierto && (
        <div className={styles.comentarios}>
          {comentarios === null && cargando && (
            <p className={styles.invitacion} role="status">
              Cargando comentarios...
            </p>
          )}

          {comentarios?.length === 0 && !cargando && !error && (
            <p className={styles.invitacion}>Todavía no hay comentarios.</p>
          )}

          {comentarios && pagina * POR_PAGINA < cantidadComentarios && (
            <button
              type="button"
              className={styles.verMas}
              onClick={() => void cargarComentarios(pagina + 1)}
              disabled={cargando}
            >
              {cargando ? "Cargando…" : "Ver comentarios anteriores"}
            </button>
          )}

          {comentarios && comentarios.length > 0 && (
            <ul className={styles.listaComentarios}>
              {/* Se guardan del más nuevo al más viejo, como los entrega el backend, y se
                  muestran al revés: los recientes quedan junto al campo para escribir. */}
              {[...comentarios].reverse().map((comentario) => (
                <li key={comentario.id} className={styles.comentario}>
                  <div className={styles.comentarioCabecera}>
                    <strong>{comentario.nombreUsuario}</strong>
                    <time dateTime={comentario.createdAt}>{formatearFechaHora(comentario.createdAt)}</time>
                    {(puedeModerar || (comentario.idUsuario === sesion?.id && puedeEliminarPropios)) && (
                      <button
                        type="button"
                        className={styles.eliminarComentario}
                        onClick={() => void quitarComentario(comentario)}
                        disabled={eliminando !== null}
                      >
                        {eliminando === comentario.id ? "Eliminando…" : "Eliminar"}
                      </button>
                    )}
                  </div>
                  <p>{comentario.contenido}</p>
                </li>
              ))}
            </ul>
          )}

          {puedeComentar && (
            <form className={styles.nuevoComentario} onSubmit={enviarComentario}>
              <label className={styles.oculto} htmlFor={idCampo}>
                Escribí un comentario
              </label>
              <textarea
                id={idCampo}
                required
                rows={2}
                maxLength={1000}
                placeholder="Escribí un comentario..."
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                disabled={enviando}
              />
              <button type="submit" className={styles.enviar} disabled={enviando || !texto.trim()}>
                {enviando ? "Publicando…" : "Comentar"}
              </button>
            </form>
          )}

          {haySesion === false && (
            <p className={styles.invitacion}>
              <Link href="/login">Iniciá sesión</Link> para reaccionar o comentar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
