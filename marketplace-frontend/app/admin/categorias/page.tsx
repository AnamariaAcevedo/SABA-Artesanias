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

  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState<number | null>(
    null
  );
  const [nombreCategoriaEditada, setNombreCategoriaEditada] = useState("");
  const [subcategoriaEnEdicion, setSubcategoriaEnEdicion] = useState<
    number | null
  >(null);
  const [nombreSubcategoriaEditada, setNombreSubcategoriaEditada] =
    useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState<
    "categoria" | "subcategoria" | null
  >(null);

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
    cancelarEdiciones();
    setCategoriaSeleccionada(categoria);
  }

  function cancelarEdiciones() {
    setCategoriaEnEdicion(null);
    setNombreCategoriaEditada("");
    setSubcategoriaEnEdicion(null);
    setNombreSubcategoriaEditada("");
  }

  function comenzarEdicionCategoria(categoria: Categoria) {
    setError("");
    setAviso("");
    setFormularioActivo(null);
    setSubcategoriaEnEdicion(null);
    setNombreSubcategoriaEditada("");
    setCategoriaEnEdicion(categoria.id);
    setNombreCategoriaEditada(categoria.nombre);
  }

  function comenzarEdicionSubcategoria(
    subcategoria: SubcategoriaDeCategoria
  ) {
    setError("");
    setAviso("");
    setFormularioActivo(null);
    setCategoriaEnEdicion(null);
    setNombreCategoriaEditada("");
    setSubcategoriaEnEdicion(subcategoria.subcategoriaId);
    setNombreSubcategoriaEditada(subcategoria.subcategoriaNombre);
  }

  async function editarCategoria(
    event: FormEvent<HTMLFormElement>,
    categoria: Categoria
  ) {
    event.preventDefault();

    const nombre = nombreCategoriaEditada.trim();

    if (!nombre) {
      setError("Escribí un nombre para la categoría.");
      return;
    }

    if (nombre === categoria.nombre) {
      cancelarEdiciones();
      return;
    }

    setGuardandoEdicion("categoria");
    setError("");
    setAviso("");

    try {
      await apiFetch(`/categorias/${categoria.id}`, {
        method: "PUT",
        body: JSON.stringify({ nombre }),
      });

      setCategorias((actuales) =>
        actuales.map((actual) =>
          actual.id === categoria.id ? { ...actual, nombre } : actual
        )
      );
      setCategoriaSeleccionada((actual) =>
        actual?.id === categoria.id ? { ...actual, nombre } : actual
      );
      cancelarEdiciones();
      setAviso("Categoría actualizada correctamente.");
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setGuardandoEdicion(null);
    }
  }

  async function editarSubcategoria(
    event: FormEvent<HTMLFormElement>,
    subcategoria: SubcategoriaDeCategoria
  ) {
    event.preventDefault();

    const nombre = nombreSubcategoriaEditada.trim();

    if (!nombre) {
      setError("Escribí un nombre para la subcategoría.");
      return;
    }

    if (nombre === subcategoria.subcategoriaNombre) {
      cancelarEdiciones();
      return;
    }

    setGuardandoEdicion("subcategoria");
    setError("");
    setAviso("");

    try {
      await apiFetch(`/subcategorias/${subcategoria.subcategoriaId}`, {
        method: "PUT",
        body: JSON.stringify({ nombre }),
      });

      setSubcategorias((actuales) =>
        actuales.map((actual) =>
          actual.subcategoriaId === subcategoria.subcategoriaId
            ? { ...actual, subcategoriaNombre: nombre }
            : actual
        )
      );
      cancelarEdiciones();
      setAviso("Subcategoría actualizada correctamente.");
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setGuardandoEdicion(null);
    }
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
            Categorías y subcategorías
          </h1>
        </div>

        <ConPermiso permisos={ACCESO.crearCategorias}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              setError("");
              setAviso("");
              cancelarEdiciones();
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
                  <td>
                    {categoriaEnEdicion === categoria.id ? (
                      <form
                        className={styles.inlineEdit}
                        onSubmit={(event) =>
                          void editarCategoria(event, categoria)
                        }
                      >
                        <label
                          className={styles.visuallyHidden}
                          htmlFor={`editar-categoria-${categoria.id}`}
                        >
                          Nuevo nombre de la categoría
                        </label>
                        <input
                          id={`editar-categoria-${categoria.id}`}
                          className={styles.inlineEditInput}
                          value={nombreCategoriaEditada}
                          onChange={(event) =>
                            setNombreCategoriaEditada(event.target.value)
                          }
                          maxLength={100}
                          required
                          autoFocus
                          disabled={guardandoEdicion === "categoria"}
                        />
                        <div className={styles.inlineEditActions}>
                          <button
                            type="submit"
                            className={styles.inlineSaveButton}
                            disabled={guardandoEdicion === "categoria"}
                          >
                            {guardandoEdicion === "categoria"
                              ? "Guardando…"
                              : "Guardar"}
                          </button>
                          <button
                            type="button"
                            className={styles.inlineCancelButton}
                            onClick={cancelarEdiciones}
                            disabled={guardandoEdicion === "categoria"}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      categoria.nombre
                    )}
                  </td>

                  <td>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.linkAction}
                        onClick={() => seleccionarCategoria(categoria)}
                      >
                        Gestionar subcategorías
                      </button>

                      <ConPermiso permisos={ACCESO.editarCategorias}>
                        <button
                          type="button"
                          className={styles.linkAction}
                          onClick={() => comenzarEdicionCategoria(categoria)}
                          disabled={categoriaEnEdicion === categoria.id}
                        >
                          Editar
                        </button>
                      </ConPermiso>

                      <ConPermiso permisos={ACCESO.eliminarCategorias}>
                        <button
                          type="button"
                          className={`${styles.linkAction} ${styles.linkActionDanger}`}
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
                  cancelarEdiciones();
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
                      <td>
                        {subcategoriaEnEdicion ===
                        subcategoria.subcategoriaId ? (
                          <form
                            className={styles.inlineEdit}
                            onSubmit={(event) =>
                              void editarSubcategoria(event, subcategoria)
                            }
                          >
                            <label
                              className={styles.visuallyHidden}
                              htmlFor={`editar-subcategoria-${subcategoria.subcategoriaId}`}
                            >
                              Nuevo nombre de la subcategoría
                            </label>
                            <input
                              id={`editar-subcategoria-${subcategoria.subcategoriaId}`}
                              className={styles.inlineEditInput}
                              value={nombreSubcategoriaEditada}
                              onChange={(event) =>
                                setNombreSubcategoriaEditada(event.target.value)
                              }
                              maxLength={100}
                              required
                              autoFocus
                              disabled={guardandoEdicion === "subcategoria"}
                            />
                            <div className={styles.inlineEditActions}>
                              <button
                                type="submit"
                                className={styles.inlineSaveButton}
                                disabled={guardandoEdicion === "subcategoria"}
                              >
                                {guardandoEdicion === "subcategoria"
                                  ? "Guardando…"
                                  : "Guardar"}
                              </button>
                              <button
                                type="button"
                                className={styles.inlineCancelButton}
                                onClick={cancelarEdiciones}
                                disabled={guardandoEdicion === "subcategoria"}
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        ) : (
                          subcategoria.subcategoriaNombre
                        )}
                      </td>

                      <td>
                        <div className={styles.rowActions}>
                          <ConPermiso permisos={ACCESO.editarCategorias}>
                            <button
                              type="button"
                              className={styles.linkAction}
                              onClick={() =>
                                comenzarEdicionSubcategoria(subcategoria)
                              }
                              disabled={
                                subcategoriaEnEdicion ===
                                subcategoria.subcategoriaId
                              }
                            >
                              Editar
                            </button>
                          </ConPermiso>

                          <ConPermiso permisos={ACCESO.eliminarCategorias}>
                            <button
                              type="button"
                              className={`${styles.linkAction} ${styles.linkActionDanger}`}
                              onClick={() =>
                                void eliminarSubcategoria(subcategoria)
                              }
                            >
                              Eliminar
                            </button>
                          </ConPermiso>
                        </div>
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
