"use client";

import { Fragment, useEffect, useState, type FormEvent } from "react";
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
      return;
    }

    let vigente = true;

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
    setCargandoSubcategorias(Boolean(categoriaSeleccionada));
    setError("");
    setRevision((valor) => valor + 1);
  }

  function seleccionarCategoria(categoria: Categoria) {
    setError("");
    setAviso("");
    setFormularioActivo(null);
    cancelarEdiciones();
    setSubcategorias([]);
    setCargandoSubcategorias(categoriaSeleccionada?.id !== categoria.id);
    setCategoriaSeleccionada((actual) =>
      actual?.id === categoria.id ? null : categoria
    );
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
                <Fragment key={categoria.id}>
                <tr>
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
                        aria-expanded={
                          categoriaSeleccionada?.id === categoria.id
                        }
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

                {categoriaSeleccionada?.id === categoria.id && (
                  <tr className="subcategory-expanded-row">
                    <td colSpan={2} className="subcategory-cell">
                      <section
                        className="subcategory-panel"
                        aria-label={`Subcategorías de ${categoria.nombre}`}
                      >
                        <div className="subcategory-toolbar">
                          <span className="subcategory-count">
                            {cargandoSubcategorias
                              ? "Cargando…"
                              : `${subcategorias.length} ${
                                  subcategorias.length === 1
                                    ? "subcategoría"
                                    : "subcategorías"
                                }`}
                          </span>

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
                            <form
                              onSubmit={crearSubcategoria}
                              className={styles.form}
                            >
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
                          <div className="subcategory-list">
                            {subcategorias.map((subcategoria) => {
                              const editando =
                                subcategoriaEnEdicion ===
                                subcategoria.subcategoriaId;

                              return (
                                <article
                                  key={subcategoria.subcategoriaId}
                                  className="subcategory-item"
                                >
                                  {editando ? (
                                    <form
                                      className={`${styles.inlineEdit} subcategory-edit-form`}
                                      onSubmit={(event) =>
                                        void editarSubcategoria(
                                          event,
                                          subcategoria
                                        )
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
                                          setNombreSubcategoriaEditada(
                                            event.target.value
                                          )
                                        }
                                        maxLength={100}
                                        required
                                        autoFocus
                                        disabled={
                                          guardandoEdicion === "subcategoria"
                                        }
                                      />
                                      <div
                                        className={styles.inlineEditActions}
                                      >
                                        <button
                                          type="submit"
                                          className={styles.inlineSaveButton}
                                          disabled={
                                            guardandoEdicion === "subcategoria"
                                          }
                                        >
                                          {guardandoEdicion === "subcategoria"
                                            ? "Guardando…"
                                            : "Guardar"}
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.inlineCancelButton}
                                          onClick={cancelarEdiciones}
                                          disabled={
                                            guardandoEdicion === "subcategoria"
                                          }
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <div className="subcategory-name">
                                        <span
                                          className="subcategory-dot"
                                          aria-hidden="true"
                                        />
                                        <span>
                                          {subcategoria.subcategoriaNombre}
                                        </span>
                                      </div>

                                      <div className="subcategory-actions">
                                        <ConPermiso
                                          permisos={ACCESO.editarCategorias}
                                        >
                                          <button
                                            type="button"
                                            className={styles.linkAction}
                                            onClick={() =>
                                              comenzarEdicionSubcategoria(
                                                subcategoria
                                              )
                                            }
                                          >
                                            Editar
                                          </button>
                                        </ConPermiso>
                                        <ConPermiso
                                          permisos={ACCESO.eliminarCategorias}
                                        >
                                          <button
                                            type="button"
                                            className={`${styles.linkAction} ${styles.linkActionDanger}`}
                                            onClick={() =>
                                              void eliminarSubcategoria(
                                                subcategoria
                                              )
                                            }
                                          >
                                            Eliminar
                                          </button>
                                        </ConPermiso>
                                      </div>
                                    </>
                                  )}
                                </article>
                              );
                            })}

                            {subcategorias.length === 0 && (
                              <div className="subcategory-empty">
                                Todavía no hay subcategorías. Creá la primera
                                para empezar.
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    </td>
                  </tr>
                )}
                </Fragment>
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

      <style jsx>{`
        .subcategory-expanded-row,
        .subcategory-expanded-row:hover {
          background: transparent;
        }

        .subcategory-cell {
          padding: 0 !important;
          border-top: 0 !important;
          background: linear-gradient(
            135deg,
            rgba(255, 246, 230, 0.92),
            rgba(244, 221, 186, 0.62)
          );
        }

        .subcategory-panel {
          margin: 0 18px 18px;
          padding: 18px 20px 20px;
          border-left: 3px solid #b98c47;
          border-radius: 0 0 18px 18px;
          animation: reveal-subcategories 220ms ease-out;
        }

        .subcategory-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .subcategory-count {
          display: inline-flex;
          align-items: center;
          min-height: 30px;
          padding: 5px 12px;
          border: 1px solid rgba(184, 139, 68, 0.55);
          border-radius: 999px;
          background: rgba(255, 246, 230, 0.72);
          color: #6b4a22;
          font: 600 12px/1.2 Arial, sans-serif;
          letter-spacing: 0.04em;
        }

        .subcategory-list {
          display: grid;
          gap: 8px;
        }

        .subcategory-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          min-height: 52px;
          padding: 10px 14px;
          border: 1px solid rgba(184, 139, 68, 0.38);
          border-radius: 14px;
          background: rgba(255, 246, 230, 0.76);
          box-shadow: 0 3px 12px rgba(99, 36, 14, 0.04);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .subcategory-item:hover {
          transform: translateX(4px);
          border-color: rgba(155, 108, 46, 0.72);
          background: rgba(255, 250, 241, 0.96);
          box-shadow: 0 5px 16px rgba(99, 36, 14, 0.08);
        }

        .subcategory-name {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
          color: #48200f;
          font: 500 14px/1.4 Arial, sans-serif;
        }

        .subcategory-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #b98c47;
          box-shadow: 0 0 0 4px rgba(185, 140, 71, 0.15);
        }

        .subcategory-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          flex: 0 0 auto;
        }

        .subcategory-edit-form {
          width: 100%;
        }

        .subcategory-empty {
          padding: 24px 18px;
          border: 1px dashed rgba(155, 108, 46, 0.58);
          border-radius: 14px;
          color: #6b4a22;
          background: rgba(255, 246, 230, 0.5);
          text-align: center;
          font: 14px/1.5 Arial, sans-serif;
        }

        @keyframes reveal-subcategories {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 720px) {
          .subcategory-panel {
            margin: 0 8px 12px;
            padding: 14px 10px 16px;
          }

          .subcategory-toolbar,
          .subcategory-item {
            align-items: stretch;
            flex-direction: column;
          }

          .subcategory-actions {
            justify-content: flex-start;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .subcategory-panel {
            animation: none;
          }

          .subcategory-item {
            transition: none;
          }

          .subcategory-item:hover {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
