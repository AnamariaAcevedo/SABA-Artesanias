import Link from "next/link";
import { formatearFechaHora } from "@/lib/pedidos";
import { urlFotoPublicacion } from "@/services/publicacionService";
import type { Publicacion } from "@/types/Publicacion";
import styles from "./publicaciones.module.css";

// Las fotos abren en otra pestaña en tamaño completo, porque acá se recortan para
// que entren en la grilla.
export default function PublicacionCard({ publicacion }: { publicacion: Publicacion }) {
  const urlTienda = `/tiendas/${publicacion.idTienda}`;

  return (
    <article className={styles.publicacion}>
      <header className={styles.cabecera}>
        <Link href={urlTienda} className={styles.avatar} aria-hidden="true" tabIndex={-1}>
          {publicacion.nombreTienda.charAt(0).toUpperCase()}
        </Link>
        <div className={styles.autor}>
          <Link href={urlTienda}>{publicacion.nombreTienda}</Link>
          <time className={styles.fecha} dateTime={publicacion.createdAt}>
            {formatearFechaHora(publicacion.createdAt)}
          </time>
        </div>
      </header>

      <h3 className={styles.titulo}>{publicacion.titulo}</h3>
      <p className={styles.texto}>{publicacion.contenido}</p>

      {publicacion.idsArchivos.length > 0 && (
        <div className={styles.fotos}>
          {publicacion.idsArchivos.map((idArchivo, indice) => (
            <a key={idArchivo} href={urlFotoPublicacion(idArchivo)} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlFotoPublicacion(idArchivo)}
                alt={`Foto ${indice + 1} de "${publicacion.titulo}"`}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}

      {publicacion.fechaExpiracion && (
        <span className={styles.vigencia}>Disponible hasta el {formatearFechaHora(publicacion.fechaExpiracion)}</span>
      )}
    </article>
  );
}
