"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import { ApiError, apiFetch } from "@/lib/api";
import { obtenerCategorias, obtenerSubcategoriasPorCategoria } from "@/services/categoriaService";
import type { Categoria } from "@/types/Categoria";
import type { Producto } from "@/types/Producto";
import type { Subcategoria } from "@/types/Subcategoria";
import { urlImagen, type ImagenProducto, type MiProductoInput } from "@/types/miTienda";

const TIPOS_IMAGEN = ["image/png", "image/jpeg"];
const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

type CategoriaConSubcategorias = {
  categoria: Categoria;
  subcategorias: Subcategoria[];
};

interface ProductoFormProps {
  modo: "crear" | "editar";
  producto?: Producto;
}

// Valida un archivo de imagen antes de subirlo (mismas reglas que el backend).
function errorDeImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return `"${archivo.name}" no es PNG ni JPG.`;
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) return `"${archivo.name}" supera los 5 MB.`;
  return null;
}

async function subirImagen(idProducto: number, archivo: File): Promise<ImagenProducto> {
  const datos = new FormData();
  datos.append("archivo", archivo);
  return apiFetch<ImagenProducto>(`/mi-tienda/productos/${idProducto}/imagenes`, {
    method: "POST",
    body: datos,
  });
}

export default function ProductoForm({ modo, producto }: ProductoFormProps) {
  const router = useRouter();
  const enviandoRef = useRef(false);

  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [precio, setPrecio] = useState(producto ? String(Math.round(producto.precio)) : "");
  const [descuento, setDescuento] = useState(producto?.descuento ? String(producto.descuento) : "");
  const [stock, setStock] = useState(producto ? String(producto.cantidadDisponible) : "");
  const [idsSubcategorias, setIdsSubcategorias] = useState<Set<number>>(
    () => new Set(producto?.idsSubcategorias ?? []),
  );

  const [categorias, setCategorias] = useState<CategoriaConSubcategorias[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  // Crear: imágenes elegidas que se suben después de crear el producto.
  const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
  // Editar: imágenes ya guardadas, que se suben o quitan al momento.
  const [imagenes, setImagenes] = useState<ImagenProducto[]>([]);
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [errorImagenes, setErrorImagenes] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarCategorias() {
      try {
        const respuesta = await obtenerCategorias();
        const conSubcategorias = await Promise.all(
          respuesta.data.map(async (categoria) => ({
            categoria,
            subcategorias: (await obtenerSubcategoriasPorCategoria(categoria.id)).data,
          })),
        );
        if (!cancelado) setCategorias(conSubcategorias.filter((grupo) => grupo.subcategorias.length > 0));
      } catch {
        if (!cancelado) setError("No pudimos cargar las categorías. Podés guardar el producto y asignarlas después.");
      } finally {
        if (!cancelado) setCargandoCategorias(false);
      }
    }
    cargarCategorias();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (modo !== "editar" || !producto) return;
    let cancelado = false;
    apiFetch<ImagenProducto[]>(`/mi-tienda/productos/${producto.id}/imagenes`)
      .then((data) => {
        if (!cancelado) setImagenes(data);
      })
      .catch(() => {
        if (!cancelado) setErrorImagenes("No pudimos cargar las imágenes del producto.");
      });
    return () => {
      cancelado = true;
    };
  }, [modo, producto]);

  function alternarSubcategoria(idSubcategoria: number) {
    setIdsSubcategorias((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(idSubcategoria)) siguiente.delete(idSubcategoria);
      else siguiente.add(idSubcategoria);
      return siguiente;
    });
  }

  async function elegirImagenes(event: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(event.target.files ?? []);
    event.target.value = "";
    setErrorImagenes("");
    if (archivos.length === 0) return;

    const invalido = archivos.map(errorDeImagen).find((mensaje) => mensaje !== null);
    if (invalido) {
      setErrorImagenes(invalido);
      return;
    }

    if (modo === "crear" || !producto) {
      setImagenesNuevas((actual) => [...actual, ...archivos]);
      return;
    }

    setProcesandoImagen(true);
    try {
      for (const archivo of archivos) {
        const subida = await subirImagen(producto.id, archivo);
        setImagenes((actual) => [...actual, subida]);
      }
    } catch (cause) {
      setErrorImagenes(cause instanceof ApiError ? cause.message : "No pudimos subir la imagen.");
    } finally {
      setProcesandoImagen(false);
    }
  }

  async function quitarImagen(imagen: ImagenProducto) {
    if (!producto || !window.confirm("¿Quitar esta imagen del producto?")) return;
    setProcesandoImagen(true);
    setErrorImagenes("");
    try {
      await apiFetch(`/mi-tienda/productos/${producto.id}/imagenes/${imagen.id}`, { method: "DELETE" });
      setImagenes((actual) => actual.filter((otra) => otra.id !== imagen.id));
    } catch (cause) {
      setErrorImagenes(cause instanceof ApiError ? cause.message : "No pudimos quitar la imagen.");
    } finally {
      setProcesandoImagen(false);
    }
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    if (!nombre.trim() || !descripcion.trim() || !precio || !stock) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    const descuentoNumero = descuento ? Number(descuento) : 0;
    if (descuentoNumero < 0 || descuentoNumero > 100) {
      setError("El descuento debe estar entre 0 y 100%.");
      return;
    }

    const datos: MiProductoInput = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precio),
      descuento: descuentoNumero,
      cantidadDisponible: Number(stock),
      idsSubcategorias: [...idsSubcategorias],
    };

    enviandoRef.current = true;
    setEnviando(true);
    try {
      if (modo === "crear") {
        const creado = await apiFetch<Producto>("/mi-tienda/productos", {
          method: "POST",
          body: JSON.stringify(datos),
        });

        try {
          for (const archivo of imagenesNuevas) await subirImagen(creado.id, archivo);
        } catch {
          // El producto ya existe: se abre su edición para reintentar las imágenes.
          window.alert("El producto se creó, pero no pudimos subir todas las imágenes. Podés volver a intentarlo desde la edición.");
          router.push(`/mi-tienda/productos/${creado.id}/editar`);
          return;
        }
      } else if (producto) {
        await apiFetch(`/mi-tienda/productos/${producto.id}`, {
          method: "PUT",
          body: JSON.stringify(datos),
        });
      }
      router.push("/mi-tienda");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el producto.");
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  const ocupado = enviando || procesandoImagen;

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <form onSubmit={enviar} className={styles.form} aria-busy={ocupado}>
        <h3 className={styles.sectionSubtitle}>Datos del producto</h3>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            required
            maxLength={255}
            className={miTiendaStyles.textarea}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            aria-describedby="descripcion-ayuda"
          />
          <small id="descripcion-ayuda" className={miTiendaStyles.ayuda}>
            {descripcion.length}/255 caracteres
          </small>
        </div>

        <div className={styles.rowQuad}>
          <div className={styles.field}>
            <label htmlFor="precio">Precio (Gs)</label>
            <input
              id="precio"
              required
              inputMode="numeric"
              maxLength={12}
              value={precio}
              onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="descuento">Descuento (%)</label>
            <input
              id="descuento"
              inputMode="numeric"
              maxLength={3}
              placeholder="0"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="stock">Stock disponible</label>
            <input
              id="stock"
              required
              inputMode="numeric"
              maxLength={9}
              value={stock}
              onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>

        <fieldset className={miTiendaStyles.grupoSubcategorias}>
          <legend>Subcategorías</legend>
          {cargandoCategorias && <p role="status">Cargando categorías…</p>}
          {!cargandoCategorias && categorias.length === 0 && <p>No hay categorías disponibles.</p>}
          <div className={miTiendaStyles.listaCategorias}>
            {categorias.map(({ categoria, subcategorias }) => (
              <div key={categoria.id} className={miTiendaStyles.categoria}>
                <strong>{categoria.nombre}</strong>
                {subcategorias.map((subcategoria) => (
                  <label key={subcategoria.subcategoriaId} className={miTiendaStyles.opcionSubcategoria}>
                    <input
                      type="checkbox"
                      checked={idsSubcategorias.has(subcategoria.subcategoriaId)}
                      onChange={() => alternarSubcategoria(subcategoria.subcategoriaId)}
                    />
                    {subcategoria.subcategoriaNombre}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </fieldset>

        <h3 className={styles.sectionSubtitle}>Imágenes</h3>
        <p className={miTiendaStyles.ayuda}>
          PNG o JPG de hasta 5 MB. La primera imagen es la que se muestra en el catálogo.
        </p>

        <div className={miTiendaStyles.galeria}>
          {modo === "editar" &&
            imagenes.map((imagen, indice) => (
              <div key={imagen.id} className={miTiendaStyles.imagen}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlImagen(imagen.id)} alt={`Imagen ${indice + 1} del producto`} />
                {indice === 0 && <span className={miTiendaStyles.imagenPrincipal}>Principal</span>}
                <button
                  type="button"
                  className={`${styles.linkAction} ${styles.linkActionDanger} ${miTiendaStyles.quitarImagen}`}
                  onClick={() => quitarImagen(imagen)}
                  disabled={ocupado}
                >
                  Quitar
                </button>
              </div>
            ))}
          {modo === "crear" &&
            imagenesNuevas.map((archivo, indice) => (
              <VistaPreviaImagen
                key={`${archivo.name}-${indice}`}
                archivo={archivo}
                principal={indice === 0}
                deshabilitado={ocupado}
                onQuitar={() => setImagenesNuevas((actual) => actual.filter((_, otro) => otro !== indice))}
              />
            ))}
        </div>

        <label className={miTiendaStyles.subirImagen}>
          <span>{procesandoImagen ? "Procesando imagen…" : "Agregar imágenes:"}</span>
          <input type="file" accept="image/png,image/jpeg" multiple onChange={elegirImagenes} disabled={ocupado} />
        </label>

        {errorImagenes && (
          <p role="alert" className={styles.error}>
            {errorImagenes}
          </p>
        )}

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.buttonOutline} onClick={() => router.push("/mi-tienda")} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" disabled={ocupado} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : modo === "crear" ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Vista previa local de una imagen todavía no subida (modo crear).
function VistaPreviaImagen({
  archivo,
  principal,
  deshabilitado,
  onQuitar,
}: {
  archivo: File;
  principal: boolean;
  deshabilitado: boolean;
  onQuitar: () => void;
}) {
  const [url] = useState(() => URL.createObjectURL(archivo));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className={miTiendaStyles.imagen}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Vista previa de ${archivo.name}`} />
      {principal && <span className={miTiendaStyles.imagenPrincipal}>Principal</span>}
      <button
        type="button"
        className={`${styles.linkAction} ${styles.linkActionDanger} ${miTiendaStyles.quitarImagen}`}
        onClick={onQuitar}
        disabled={deshabilitado}
      >
        Quitar
      </button>
    </div>
  );
}
