"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, apiFetchConPaginacion } from "@/lib/api";
import styles from "@/components/admin/admin.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { ACCESO } from "@/lib/access";
import type { Categoria } from "@/types/Categoria";

type SubcategoriaDeCategoria = {
  subcategoriaId: number;
  subcategoriaNombre: string;
};

async function obtenerTodos<T>(ruta: string): Promise<T[]> {
  const elementos: T[] = [];
  let pagina = 1;

  while (true) {
    const separador = ruta.includes("?") ? "&" : "?";
    const respuesta = await apiFetchConPaginacion<T[]>(
      `${ruta}${separador}page=${pagina}&perPage=100`
    );

    elementos.push(...respuesta.data);

    if (
      respuesta.data.length === 0 ||
      (respuesta.pagination
        ? elementos.length >= respuesta.pagination.total
        : respuesta.data.length < 100)
    ) {
      return elementos;
    }

    pagina++;
  }
}

function mensajeError(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : "No pudimos completar la operación.";
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<Categoria | null>(null);
  const [subcategorias, setSubcategorias] = useState<
    SubcategoriaDeCategoria[]
  >([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoSubcategorias, setCargandoSubcategorias] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [revision, setRevision] = useState(0);

  const [formularioActivo, setFormularioActivo] = useState<
    "categoria" | "subcategoria" | null
  >(null);

  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState("");
  const [nombreNuevaSubcategoria, setNombreNuevaSubcategoria] = useState("");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [guardandoSubcategoria, setGuardandoSubcategoria] = useState(false);

  useEffect(() => {
    let vigente = true;

    obtenerTodos<Categoria>("/categorias")
      .then((categoriasRecibidas) => {
        if (vigente) setCategorias(categoriasRecibidas);
      })
      .catch((cause) => {
        if (vigente) setError(mensajeError(cause));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [revision]);

  useEffect(() => {
    if (!categoriaSeleccionada) {
      setSubcategorias([]);
      return;
    }

    let vigente = true;
    setCargandoSubcategorias(true);

    obtenerTodos<SubcategoriaDeCategoria>(
      `/categorias/${categoriaSeleccionada.id}/subcategorias`
    )
      .then((subcategoriasRecibidas) => {
        if (vigente) setSubcategorias(subcategoriasRecibidas);
      })
      .catch((cause) => {
        if (vigente) setError(mensajeError(cause));
      })
      .finally(() => {
        if (vigente) setCargandoSubcategorias(false);
      });

    return () => {
      vigente = false;
    };
  }, [categoriaSeleccionada, revision]);

  function recargar() {
    setCargando(true);
    setError("");
    setRevision((valor) => valor + 1);
  }

  function seleccionarCategoria(categoria: Categoria) {
    setError("");
    setAviso("");
    setFormularioActivo(null);
    setCategoriaSeleccionada(categoria);
  }

  async function crearCategoria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nombre = nombreNuevaCategoria.trim();

    if (!nombre) {
      setError("Escribí un nombre para la categoría.");
      return;
    }

    setGuardandoCategoria(true);
    setError("");
    setAviso("");

    try {
      await apiFetch("/categorias", {
        method: "POST",
        body: JSON.stringify({ nombre }),
      });

      setNombreNuevaCategoria("");
      setFormularioActivo(null);
      setAviso("Categoría creada correctamente.");
      recargar();
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setGuardandoCategoria(false);
    }
  }

  async function crearSubcategoria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!categoriaSeleccionada) {
      setError("Primero seleccioná una categoría.");
      return;
    }

    const nombre = nombreNuevaSubcategoria.trim();

    if (!nombre) {
      setError("Escribí un nombre para la subcategoría.");
      return;
    }

    setGuardandoSubcategoria(true);
    setError("");
    setAviso("");

    try {
      const subcategoriaCreada = await apiFetch<{ id: number }>(
        "/subcategorias",
        {
          method: "POST",
          body: JSON.stringify({ nombre }),
        }
      );

      await apiFetch(
        `/categorias/${categoriaSeleccionada.id}/subcategorias`,
        {
          method: "POST",
          body: JSON.stringify({
            subcategoriaId: subcategoriaCreada.id,
          }),
        }
      );

      setNombreNuevaSubcategoria("");
      setFormularioActivo(null);
      setAviso("Subcategoría creada y asignada correctamente.");
      recargar();
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setGuardandoSubcategoria(false);
    }
  }

  async function eliminarCategoria(categoria: Categoria) {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseás eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmado) return;

    setError("");
    setAviso("");

    try {
      await apiFetch(`/categorias/${categoria.id}`, {
        method: "DELETE",
      });

      if (categoriaSeleccionada?.id === categoria.id) {
        setCategoriaSeleccionada(null);
        setFormularioActivo(null);
      }

      setAviso("Categoría eliminada correctamente.");
      recargar();
    } catch (cause) {
      setError(mensajeError(cause));
    }
  }

  async function eliminarSubcategoria(
    subcategoria: SubcategoriaDeCategoria
  ) {
    const confirmado = window.confirm(
      `¿Estás seguro de que deseás eliminar la subcategoría "${subcategoria.subcategoriaNombre}"?`
    );

    if (!confirmado) return;

    setError("");
    setAviso("");

    try {
      await apiFetch(`/subcategorias/${subcategoria.subcategoriaId}`, {
        method: "DELETE",
      });

      setAviso("Subcategoría eliminada correctamente.");
      recargar();
    } catch (cause) {
      setError(mensajeError(cause));
    }
  }

  return (
    <section className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.title}>
            Gestión de categorías y subcategorías
          </h1>
        </div>

        <ConPermiso permisos={ACCESO.crearCategorias}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              setError("");
              setAviso("");
              setFormularioActivo("categoria");
            }}
          >
            + Nueva categoría
          </button>
        </ConPermiso>
      </div>

      {aviso && (
        <p className={styles.notice} role="status">
          {aviso}
        </p>
      )}

      {error && (
        <div className={styles.error} role="alert">
          <p>{error}</p>
        </div>
      )}

      {formularioActivo === "categoria" && (
        <ConPermiso permisos={ACCESO.crearCategorias}>
          <form onSubmit={crearCategoria} className={styles.form}>
            <h2 className={styles.pageTitle}>Nueva categoría</h2>

            <div className={styles.field}>
              <label htmlFor="nueva-categoria">
                Nombre de la categoría
              </label>

              <input
                id="nueva-categoria"
                value={nombreNuevaCategoria}
                onChange={(event) =>
                  setNombreNuevaCategoria(event.target.value)
                }
                required
                maxLength={100}
                placeholder="Por ejemplo: Cestería"
              />
            </div>

            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={guardandoCategoria}
            >
              {guardandoCategoria ? "Guardando…" : "Crear categoría"}
            </button>

            <button
              type="button"
              className={styles.buttonGhost}
              disabled={guardandoCategoria}
              onClick={() => setFormularioActivo(null)}
            >
              Cancelar
            </button>
          </form>
        </ConPermiso>
      )}

      <h2 className={styles.pageTitle}>Categorías</h2>

      {cargando && <p role="status">Cargando categorías…</p>}

      {!cargando && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td>{categoria.nombre}</td>

                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        className={styles.linkAction}
                        onClick={() => seleccionarCategoria(categoria)}
                      >
                        Gestionar subcategorías
                      </button>

                      <ConPermiso permisos={ACCESO.eliminarCategorias}>
                        <button
                          type="button"
                          className={styles.linkAction}
                          onClick={() => void eliminarCategoria(categoria)}
                        >
                          Eliminar
                        </button>
                      </ConPermiso>
                    </div>
                  </td>
                </tr>
              ))}

              {categorias.length === 0 && (
                <tr>
                  <td colSpan={2} className={styles.emptyRow}>
                    No hay categorías registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {categoriaSeleccionada && (
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.pageTitle}>
              Subcategorías de: {categoriaSeleccionada.nombre}
            </h2>

            <ConPermiso permisos={ACCESO.crearCategorias}>
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={() => {
                  setError("");
                  setAviso("");
                  setFormularioActivo("subcategoria");
                }}
              >
                + Nueva subcategoría
              </button>
            </ConPermiso>
          </div>

          {formularioActivo === "subcategoria" && (
            <ConPermiso permisos={ACCESO.crearCategorias}>
              <form onSubmit={crearSubcategoria} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="nueva-subcategoria">
                    Nombre de la subcategoría
                  </label>

                  <input
                    id="nueva-subcategoria"
                    value={nombreNuevaSubcategoria}
                    onChange={(event) =>
                      setNombreNuevaSubcategoria(event.target.value)
                    }
                    required
                    maxLength={100}
                    placeholder="Por ejemplo: Canastos"
                  />
                </div>

                <button
                  type="submit"
                  className={styles.buttonPrimary}
                  disabled={guardandoSubcategoria}
                >
                  {guardandoSubcategoria
                    ? "Guardando…"
                    : "Crear y asignar"}
                </button>

                <button
                  type="button"
                  className={styles.buttonGhost}
                  disabled={guardandoSubcategoria}
                  onClick={() => setFormularioActivo(null)}
                >
                  Cancelar
                </button>
              </form>
            </ConPermiso>
          )}

          {cargandoSubcategorias && (
            <p role="status">Cargando subcategorías…</p>
          )}

          {!cargandoSubcategorias && (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {subcategorias.map((subcategoria) => (
                    <tr key={subcategoria.subcategoriaId}>
                      <td>{subcategoria.subcategoriaNombre}</td>

                      <td>
                        <ConPermiso permisos={ACCESO.eliminarCategorias}>
                          <button
                            type="button"
                            className={styles.linkAction}
                            onClick={() =>
                              void eliminarSubcategoria(subcategoria)
                            }
                          >
                            Eliminar
                          </button>
                        </ConPermiso>
                      </td>
                    </tr>
                  ))}

                  {subcategorias.length === 0 && (
                    <tr>
                      <td colSpan={2} className={styles.emptyRow}>
                        Esta categoría todavía no tiene subcategorías.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  );
}