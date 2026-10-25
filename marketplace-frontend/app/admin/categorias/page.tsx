"use client";

import { Fragment, useEffect, useState, type FormEvent } from "react";
import { apiFetch, apiFetchConPaginacion } from "@/lib/api";
import styles from "@/components/admin/admin.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { useSesion } from "@/components/auth/SesionProvider";
import { ACCESO, cumplePermisos } from "@/lib/access";
import type { Categoria } from "@/types/Categoria";

type SubcategoriaDeCategoria = {
  subcategoriaId: number;
  subcategoriaNombre: string;
};

// Forma en que /subcategorias devuelve cada subcategoría.
type SubcategoriaGeneral = {
  id: number;
  nombre: string;
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

// Las tablas se muestran de a pocos elementos; la paginación es local porque
// la página ya carga todas las categorías y subcategorías.
const POR_PAGINA = 5;

function totalPaginas(cantidad: number) {
  return Math.max(1, Math.ceil(cantidad / POR_PAGINA));
}

function Paginacion({
  pagina,
  cantidad,
  singular,
  plural,
  onCambiar,
}: {
  pagina: number;
  cantidad: number;
  singular: string;
  plural: string;
  onCambiar: (pagina: number) => void;
}) {
  const total = totalPaginas(cantidad);

  return (
    <div className={styles.pagination}>
      <span>
        Página {pagina} de {total} · {cantidad}{" "}
        {cantidad === 1 ? singular : plural}
      </span>
      <div className={styles.paginationButtons}>
        <button
          type="button"
          className={styles.buttonGhost}
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className={styles.buttonGhost}
          disabled={pagina >= total}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default function CategoriasPage() {
  const { sesion } = useSesion();
  const permisos = sesion?.permisos ?? [];
  const puedeRenombrar = cumplePermisos(permisos, ACCESO.editarCategorias);
  const puedeAsociar = cumplePermisos(permisos, ACCESO.asignarSubcategorias);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<Categoria | null>(null);
  // La fila desplegada de la categoría seleccionada muestra sus subcategorías
  // ("subcategorias") o el panel de edición con las asociaciones ("editar").
  const [modoPanel, setModoPanel] = useState<"subcategorias" | "editar">(
    "subcategorias"
  );
  const [subcategoriaAAsociar, setSubcategoriaAAsociar] = useState("");
  const [asociando, setAsociando] = useState(false);
  const [subcategorias, setSubcategorias] = useState<
    SubcategoriaDeCategoria[]
  >([]);

  const [todasSubcategorias, setTodasSubcategorias] = useState<
    SubcategoriaGeneral[]
  >([]);
  const [paginaCategorias, setPaginaCategorias] = useState(1);
  const [paginaSubcategorias, setPaginaSubcategorias] = useState(1);

  const [cargando, setCargando] = useState(true);
  const [cargandoSubcategorias, setCargandoSubcategorias] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [revision, setRevision] = useState(0);

  // "subcategoriaSuelta": subcategoría creada sin asociarla a una categoría.
  const [formularioActivo, setFormularioActivo] = useState<
    "categoria" | "subcategoria" | "subcategoriaSuelta" | null
  >(null);

  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState("");
  const [nombreNuevaSubcategoria, setNombreNuevaSubcategoria] = useState("");
  const [nombreSubcategoriaSuelta, setNombreSubcategoriaSuelta] = useState("");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);
  const [guardandoSubcategoria, setGuardandoSubcategoria] = useState(false);
  const [guardandoSubcategoriaSuelta, setGuardandoSubcategoriaSuelta] =
    useState(false);

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

    Promise.all([
      obtenerTodos<Categoria>("/categorias"),
      obtenerTodos<SubcategoriaGeneral>("/subcategorias"),
    ])
      .then(([categoriasRecibidas, subcategoriasRecibidas]) => {
        if (!vigente) return;
        setCategorias(categoriasRecibidas);
        setTodasSubcategorias(
          [...subcategoriasRecibidas].sort((a, b) =>
            a.nombre.localeCompare(b.nombre, "es")
          )
        );
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

    const mismaCategoria = categoriaSeleccionada?.id === categoria.id;

    if (mismaCategoria && modoPanel === "subcategorias") {
      setCategoriaSeleccionada(null);
      return;
    }

    setModoPanel("subcategorias");

    if (!mismaCategoria) {
      setSubcategorias([]);
      setCargandoSubcategorias(true);
      setCategoriaSeleccionada(categoria);
    }
  }

  // Abre la edición: el nombre se edita en la fila y debajo se despliega el
  // panel para asociar subcategorías existentes.
  function abrirEdicionCategoria(categoria: Categoria) {
    setError("");
    setAviso("");
    setFormularioActivo(null);
    setSubcategoriaAAsociar("");
    setSubcategoriaEnEdicion(null);
    setNombreSubcategoriaEditada("");

    if (puedeRenombrar) {
      setCategoriaEnEdicion(categoria.id);
      setNombreCategoriaEditada(categoria.nombre);
    } else {
      setCategoriaEnEdicion(null);
      setNombreCategoriaEditada("");
    }

    setModoPanel("editar");

    if (categoriaSeleccionada?.id !== categoria.id) {
      setSubcategorias([]);
      setCargandoSubcategorias(true);
      setCategoriaSeleccionada(categoria);
    }
  }

  function cerrarEdicionCategoria() {
    cancelarEdiciones();
    setSubcategoriaAAsociar("");
    setCategoriaSeleccionada(null);
  }

  async function asociarSubcategoria(
    event: FormEvent<HTMLFormElement>,
    categoria: Categoria
  ) {
    event.preventDefault();

    const subcategoria = todasSubcategorias.find(
      (actual) => actual.id === Number(subcategoriaAAsociar)
    );

    if (!subcategoria) {
      setError("Seleccioná una subcategoría para asociar.");
      return;
    }

    setAsociando(true);
    setError("");
    setAviso("");

    try {
      await apiFetch(`/categorias/${categoria.id}/subcategorias`, {
        method: "POST",
        body: JSON.stringify({ subcategoriaId: subcategoria.id }),
      });

      setSubcategorias((actuales) => [
        ...actuales,
        {
          subcategoriaId: subcategoria.id,
          subcategoriaNombre: subcategoria.nombre,
        },
      ]);
      setSubcategoriaAAsociar("");
      setAviso(
        `Subcategoría "${subcategoria.nombre}" asociada a "${categoria.nombre}".`
      );
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setAsociando(false);
    }
  }

  function cancelarEdiciones() {
    setCategoriaEnEdicion(null);
    setNombreCategoriaEditada("");
    setSubcategoriaEnEdicion(null);
    setNombreSubcategoriaEditada("");
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
      setTodasSubcategorias((actuales) =>
        actuales.map((actual) =>
          actual.id === subcategoria.subcategoriaId
            ? { ...actual, nombre }
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

  // Crea la subcategoría sola; la asociación a una categoría se hace aparte.
  async function crearSubcategoriaSuelta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nombre = nombreSubcategoriaSuelta.trim();

    if (!nombre) {
      setError("Escribí un nombre para la subcategoría.");
      return;
    }

    setGuardandoSubcategoriaSuelta(true);
    setError("");
    setAviso("");

    try {
      await apiFetch("/subcategorias", {
        method: "POST",
        body: JSON.stringify({ nombre }),
      });

      setNombreSubcategoriaSuelta("");
      setFormularioActivo(null);
      setAviso(`Subcategoría "${nombre}" creada correctamente.`);
      recargar();
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setGuardandoSubcategoriaSuelta(false);
    }
  }

  function cambiarPaginaCategorias(pagina: number) {
    // El panel de subcategorías abierto pertenece a la página anterior.
    setCategoriaSeleccionada(null);
    setFormularioActivo((actual) =>
      actual === "subcategoria" ? null : actual
    );
    cancelarEdiciones();
    setPaginaCategorias(pagina);
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

  // Quita la asociación con la categoría; la subcategoría sigue existiendo.
  async function quitarSubcategoria(
    categoria: Categoria,
    subcategoria: SubcategoriaDeCategoria
  ) {
    const confirmado = window.confirm(
      `¿Querés quitar la subcategoría "${subcategoria.subcategoriaNombre}" de "${categoria.nombre}"? La subcategoría no se elimina.`
    );

    if (!confirmado) return;

    setError("");
    setAviso("");

    try {
      await apiFetch(
        `/categorias/${categoria.id}/subcategorias/${subcategoria.subcategoriaId}`,
        { method: "DELETE" }
      );

      setSubcategorias((actuales) =>
        actuales.filter(
          (actual) => actual.subcategoriaId !== subcategoria.subcategoriaId
        )
      );
      setAviso(
        `Subcategoría "${subcategoria.subcategoriaNombre}" quitada de "${categoria.nombre}".`
      );
    } catch (cause) {
      setError(mensajeError(cause));
    }
  }

  // Si al eliminar se vacía la última página, se muestra la anterior.
  const paginaCategoriasActual = Math.min(
    paginaCategorias,
    totalPaginas(categorias.length)
  );
  const categoriasVisibles = categorias.slice(
    (paginaCategoriasActual - 1) * POR_PAGINA,
    paginaCategoriasActual * POR_PAGINA
  );
  const paginaSubcategoriasActual = Math.min(
    paginaSubcategorias,
    totalPaginas(todasSubcategorias.length)
  );
  const subcategoriasVisibles = todasSubcategorias.slice(
    (paginaSubcategoriasActual - 1) * POR_PAGINA,
    paginaSubcategoriasActual * POR_PAGINA
  );
  // Para asociar solo se ofrecen las que la categoría todavía no tiene.
  const subcategoriasParaAsociar = todasSubcategorias.filter(
    (subcategoria) =>
      !subcategorias.some(
        (asociada) => asociada.subcategoriaId === subcategoria.id
      )
  );

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
              {categoriasVisibles.map((categoria) => (
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
                            onClick={cerrarEdicionCategoria}
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
                          categoriaSeleccionada?.id === categoria.id &&
                          modoPanel === "subcategorias"
                        }
                      >
                        Ver subcategorías
                      </button>

                      {(puedeRenombrar || puedeAsociar) && (
                        <button
                          type="button"
                          className={styles.linkAction}
                          onClick={() => abrirEdicionCategoria(categoria)}
                          aria-expanded={
                            categoriaSeleccionada?.id === categoria.id &&
                            modoPanel === "editar"
                          }
                          disabled={
                            categoriaSeleccionada?.id === categoria.id &&
                            modoPanel === "editar"
                          }
                        >
                          Editar categoría
                        </button>
                      )}

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
                      {modoPanel === "editar" ? (
                      <section
                        className="subcategory-panel"
                        aria-label={`Asociar subcategorías a ${categoria.nombre}`}
                      >
                        <div className="association-header">
                          <div>
                            <h3 className="association-title">
                              Asociar subcategoría
                            </h3>
                            <p className="association-subtitle">
                              a {categoria.nombre}
                            </p>
                          </div>

                          <button
                            type="button"
                            className={styles.linkAction}
                            onClick={cerrarEdicionCategoria}
                          >
                            ✕ Cerrar
                          </button>
                        </div>

                        {puedeAsociar &&
                          (cargandoSubcategorias ? (
                            <p role="status" className="association-status">
                              Cargando subcategorías…
                            </p>
                          ) : subcategoriasParaAsociar.length === 0 ? (
                            <div className="subcategory-empty">
                              Ya están asociadas todas las subcategorías
                              disponibles.
                            </div>
                          ) : (
                            <form
                              className="association-form"
                              onSubmit={(event) =>
                                void asociarSubcategoria(event, categoria)
                              }
                            >
                              <div
                                className={`${styles.field} association-field`}
                              >
                                <label
                                  htmlFor={`asociar-subcategoria-${categoria.id}`}
                                >
                                  Subcategoría
                                </label>
                                <select
                                  id={`asociar-subcategoria-${categoria.id}`}
                                  value={subcategoriaAAsociar}
                                  onChange={(event) =>
                                    setSubcategoriaAAsociar(event.target.value)
                                  }
                                  disabled={asociando}
                                >
                                  <option value="">
                                    Seleccioná una subcategoría
                                  </option>
                                  {subcategoriasParaAsociar.map(
                                    (subcategoria) => (
                                      <option
                                        key={subcategoria.id}
                                        value={subcategoria.id}
                                      >
                                        {subcategoria.nombre}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>

                              <button
                                type="submit"
                                className={styles.buttonPrimary}
                                disabled={!subcategoriaAAsociar || asociando}
                              >
                                {asociando ? "Asociando…" : "Asociar"}
                              </button>
                            </form>
                          ))}
                      </section>
                      ) : (
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
                                          permisos={ACCESO.quitarSubcategorias}
                                        >
                                          <button
                                            type="button"
                                            className={`${styles.linkAction} ${styles.linkActionDanger}`}
                                            onClick={() =>
                                              void quitarSubcategoria(
                                                categoria,
                                                subcategoria
                                              )
                                            }
                                          >
                                            Quitar
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
                      )}
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

      {!cargando && categorias.length > 0 && (
        <Paginacion
          pagina={paginaCategoriasActual}
          cantidad={categorias.length}
          singular="categoría"
          plural="categorías"
          onCambiar={cambiarPaginaCategorias}
        />
      )}

      <div className={`${styles.sectionHeader} standalone-header`}>
        <h2 className={styles.pageTitle}>Subcategorías</h2>

        <ConPermiso permisos={ACCESO.crearCategorias}>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              setError("");
              setAviso("");
              cancelarEdiciones();
              setFormularioActivo("subcategoriaSuelta");
            }}
          >
            + Nueva subcategoría
          </button>
        </ConPermiso>
      </div>

      {formularioActivo === "subcategoriaSuelta" && (
        <ConPermiso permisos={ACCESO.crearCategorias}>
          <form onSubmit={crearSubcategoriaSuelta} className={styles.form}>
            <h2 className={styles.pageTitle}>Nueva subcategoría</h2>

            <div className={styles.field}>
              <label htmlFor="nueva-subcategoria-suelta">
                Nombre de la subcategoría
              </label>

              <input
                id="nueva-subcategoria-suelta"
                value={nombreSubcategoriaSuelta}
                onChange={(event) =>
                  setNombreSubcategoriaSuelta(event.target.value)
                }
                required
                maxLength={100}
                placeholder="Por ejemplo: Canastos"
              />
            </div>

            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={guardandoSubcategoriaSuelta}
            >
              {guardandoSubcategoriaSuelta
                ? "Guardando…"
                : "Crear subcategoría"}
            </button>

            <button
              type="button"
              className={styles.buttonGhost}
              disabled={guardandoSubcategoriaSuelta}
              onClick={() => setFormularioActivo(null)}
            >
              Cancelar
            </button>
          </form>
        </ConPermiso>
      )}

      {cargando && <p role="status">Cargando subcategorías…</p>}

      {!cargando && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
              </tr>
            </thead>

            <tbody>
              {subcategoriasVisibles.map((subcategoria) => (
                <tr key={subcategoria.id}>
                  <td>{subcategoria.nombre}</td>
                </tr>
              ))}

              {todasSubcategorias.length === 0 && (
                <tr>
                  <td className={styles.emptyRow}>
                    No hay subcategorías registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && todasSubcategorias.length > 0 && (
        <Paginacion
          pagina={paginaSubcategoriasActual}
          cantidad={todasSubcategorias.length}
          singular="subcategoría"
          plural="subcategorías"
          onCambiar={setPaginaSubcategorias}
        />
      )}

      <style jsx>{`
        .standalone-header {
          margin-top: 32px;
        }

        .association-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .association-title {
          margin: 0;
          color: #48200f;
          font-size: 18px;
        }

        .association-subtitle {
          margin: 2px 0 0;
          color: #6b4a22;
          font: 13px/1.4 Arial, sans-serif;
        }

        .association-form {
          display: flex;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 12px;
          padding: 16px 18px;
          border: 1px solid rgba(184, 139, 68, 0.38);
          border-radius: 14px;
          background: rgba(255, 250, 241, 0.9);
          box-shadow: 0 3px 12px rgba(99, 36, 14, 0.04);
        }

        .association-field {
          flex: 1 1 260px;
          max-width: 420px;
        }

        .association-status {
          margin: 0;
          color: #6b4a22;
          font: 14px/1.5 Arial, sans-serif;
        }

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
