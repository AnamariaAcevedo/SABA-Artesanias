"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import ubicacionesStyles from "@/components/admin/ubicaciones.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { avisar, confirmar } from "@/components/dialogos/Dialogos";
import { ACCESO } from "@/lib/access";
import { ApiError } from "@/lib/api";
import {
  LARGO_MAXIMO_NOMBRE,
  NIVELES,
  ORDEN_NIVELES,
  capitalizar,
  contarDependientes,
  crearUbicacion,
  eliminarUbicacion,
  listarUbicaciones,
  listarUbicacionesDentroDe,
  obtenerUbicacion,
  opcionesUbicacion,
  renombrarUbicacion,
  type NivelUbicacion,
  type Ubicacion,
} from "@/lib/ubicaciones";
import type { Pagination } from "@/types/api";

// Los niveles que pueden elegirse como contexto (todos menos el último).
type Seleccion = Record<"pais" | "departamento" | "ciudad", number | null>;
type NivelPadre = keyof Seleccion;

const SIN_SELECCION: Seleccion = { pais: null, departamento: null, ciudad: null };
const PER_PAGE = 10;

function articulo(nivel: NivelUbicacion, plural = false): string {
  const { femenino } = NIVELES[nivel];
  if (plural) return femenino ? "las" : "los";
  return femenino ? "la" : "el";
}

function mensajeError(cause: unknown, porDefecto: string): string {
  return cause instanceof ApiError ? cause.message : porDefecto;
}

// Gestión de países, departamentos, ciudades y barrios: las opciones que se
// ofrecen al registrarse y al solicitar una tienda. El selector en cascada de
// arriba filtra la lista y define dónde se agregan los registros nuevos.
export default function UbicacionesPage() {
  const [nivel, setNivel] = useState<NivelUbicacion>("pais");
  const [seleccion, setSeleccion] = useState<Seleccion>(SIN_SELECCION);
  const [busqueda, setBusqueda] = useState("");
  const [nombreBuscado, setNombreBuscado] = useState("");
  const [page, setPage] = useState(1);
  const [filas, setFilas] = useState<Ubicacion[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [cargando, setCargando] = useState(true);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [guardandoAlta, setGuardandoAlta] = useState(false);
  const [enEdicion, setEnEdicion] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  // Cuántas opciones cargó cada select del contexto (null mientras carga).
  const [cantidadOpciones, setCantidadOpciones] = useState<Partial<Record<NivelPadre, number | null>>>({});

  const config = NIVELES[nivel];
  const ancestros = ORDEN_NIVELES.slice(0, ORDEN_NIVELES.indexOf(nivel)) as NivelPadre[];
  const idPadre = config.padre ? seleccion[config.padre as NivelPadre] : null;
  // El nivel más bajo elegido en el contexto es el que filtra la lista.
  const ancestroFiltro = [...ancestros].reverse().find((ancestro) => seleccion[ancestro] !== null) ?? null;
  const idAncestroFiltro = ancestroFiltro ? seleccion[ancestroFiltro] : null;

  useEffect(() => {
    const espera = window.setTimeout(() => {
      setNombreBuscado(busqueda.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(espera);
  }, [busqueda]);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      try {
        const filtro = { page, perPage: PER_PAGE, nombre: nombreBuscado || undefined };
        const resultado =
          ancestroFiltro && idAncestroFiltro && ancestroFiltro !== NIVELES[nivel].padre
            ? await listarUbicacionesDentroDe(nivel, ancestroFiltro, idAncestroFiltro, filtro)
            : await listarUbicaciones(nivel, { ...filtro, idPadre: idAncestroFiltro });
        if (cancelado) return;
        setFilas(resultado.data);
        setPagination(resultado.pagination);
        setError("");
      } catch (cause) {
        if (!cancelado) setError(mensajeError(cause, `No pudimos cargar ${articulo(nivel, true)} ${NIVELES[nivel].plural}.`));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [nivel, ancestroFiltro, idAncestroFiltro, nombreBuscado, page, recarga]);

  function recargar() {
    setRecarga((actual) => actual + 1);
  }

  function cerrarEdicion() {
    setEnEdicion(null);
    setNombreEditado("");
  }

  function cambiarNivel(nuevo: NivelUbicacion) {
    setNivel(nuevo);
    setPage(1);
    setBusqueda("");
    setNombreBuscado("");
    setNombreNuevo("");
    setError("");
    setAviso("");
    cerrarEdicion();
  }

  // Elegir un nivel del contexto limpia los que dependen de él.
  function elegirContexto(nivelElegido: NivelPadre, id: number | null) {
    setSeleccion((actual) => {
      const nueva = { ...actual, [nivelElegido]: id };
      for (const inferior of ORDEN_NIVELES.slice(ORDEN_NIVELES.indexOf(nivelElegido) + 1)) {
        if (inferior !== "barrio") nueva[inferior] = null;
      }
      return nueva;
    });
    setPage(1);
    setAviso("");
    cerrarEdicion();
  }

  // "Ver ciudades" en un departamento: abre la pestaña de abajo ya filtrada.
  async function verDependientes(fila: Ubicacion) {
    const hijo = config.hijo;
    if (!hijo) return;
    let nueva: Seleccion;
    if (nivel === "pais") {
      nueva = { pais: fila.id, departamento: null, ciudad: null };
    } else if (nivel === "departamento") {
      nueva = { pais: fila.idPadre, departamento: fila.id, ciudad: null };
    } else {
      let idPais = seleccion.departamento === fila.idPadre ? seleccion.pais : null;
      if (idPais === null && fila.idPadre !== null) {
        setProcesandoId(fila.id);
        try {
          idPais = (await obtenerUbicacion("departamento", fila.idPadre)).idPadre;
        } catch (cause) {
          setError(mensajeError(cause, "No pudimos abrir los barrios de esta ciudad."));
          return;
        } finally {
          setProcesandoId(null);
        }
      }
      nueva = { pais: idPais, departamento: fila.idPadre, ciudad: fila.id };
    }
    setSeleccion(nueva);
    cambiarNivel(hijo);
  }

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nombre = nombreNuevo.trim();
    if (!nombre) {
      setError(`Ingresá el nombre ${config.femenino ? "de la" : "del"} ${config.singular}.`);
      return;
    }
    if (config.padre && !idPadre) {
      setError(`Elegí ${articulo(config.padre)} ${NIVELES[config.padre].singular} donde agregarlo.`);
      return;
    }

    setGuardandoAlta(true);
    setError("");
    setAviso("");
    try {
      await crearUbicacion(nivel, nombre, idPadre);
      setNombreNuevo("");
      setAviso(`Se agregó ${articulo(nivel)} ${config.singular} "${nombre}".`);
      recargar();
    } catch (cause) {
      setError(mensajeError(cause, `No pudimos agregar ${articulo(nivel)} ${config.singular}.`));
    } finally {
      setGuardandoAlta(false);
    }
  }

  function abrirEdicion(fila: Ubicacion) {
    setEnEdicion(fila.id);
    setNombreEditado(fila.nombre);
    setError("");
    setAviso("");
  }

  async function guardarEdicion(event: FormEvent<HTMLFormElement>, fila: Ubicacion) {
    event.preventDefault();
    const nombre = nombreEditado.trim();
    if (!nombre) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    if (nombre === fila.nombre) {
      cerrarEdicion();
      return;
    }

    setGuardandoEdicion(true);
    setError("");
    try {
      await renombrarUbicacion(nivel, fila.id, nombre);
      cerrarEdicion();
      setAviso(`"${fila.nombre}" ahora se llama "${nombre}".`);
      recargar();
    } catch (cause) {
      setError(mensajeError(cause, "No pudimos guardar el nuevo nombre."));
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function eliminar(fila: Ubicacion) {
    setProcesandoId(fila.id);
    setError("");
    setAviso("");
    try {
      // Si se borrara con registros debajo, esos quedarían sin un nivel superior visible.
      const dependientes = await contarDependientes(nivel, fila.id);
      if (dependientes > 0 && config.hijo) {
        const hijo = NIVELES[config.hijo];
        await avisar({
          titulo: `No se puede eliminar ${articulo(nivel)} ${config.singular}`,
          mensaje: `"${fila.nombre}" tiene ${dependientes} ${dependientes === 1 ? hijo.singular : hijo.plural}. Para eliminar${config.femenino ? "la" : "lo"}, primero eliminá ${articulo(config.hijo, true)} ${hijo.plural} que dependen de ${config.femenino ? "ella" : "él"}.`,
        });
        return;
      }

      const confirmado = await confirmar({
        titulo: `¿Eliminar ${articulo(nivel)} ${config.singular}?`,
        mensaje: `"${fila.nombre}" va a dejar de aparecer al registrarse y al solicitar una tienda.`,
        textoConfirmar: `Eliminar ${config.singular}`,
        peligro: true,
      });
      if (!confirmado) return;

      await eliminarUbicacion(nivel, fila.id);
      if (nivel !== "barrio" && seleccion[nivel] === fila.id) elegirContexto(nivel, null);
      setAviso(`Se eliminó ${articulo(nivel)} ${config.singular} "${fila.nombre}".`);
      if (filas.length === 1 && page > 1) setPage(page - 1);
      else recargar();
    } catch (cause) {
      setError(mensajeError(cause, `No pudimos eliminar ${articulo(nivel)} ${config.singular}.`));
    } finally {
      setProcesandoId(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;
  const columnas = config.padre ? 3 : 2;
  const ocupado = procesandoId !== null || guardandoEdicion;
  // El select del nivel padre está habilitado pero no tiene opciones: por
  // ejemplo, un país elegido que todavía no tiene departamentos.
  const padre = config.padre as NivelPadre | null;
  const abuelo = padre ? (NIVELES[padre].padre as NivelPadre | null) : null;
  const padreSinOpciones =
    padre !== null && (abuelo === null || seleccion[abuelo] !== null) && cantidadOpciones[padre] === 0;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>Ubicaciones</h2>
          <p className={styles.pageSubtitle}>
            Son las opciones que se ofrecen al registrarse y al solicitar una tienda.
          </p>
        </div>
      </div>

      <div className={ubicacionesStyles.pestanas} role="tablist" aria-label="Nivel de ubicación">
        {ORDEN_NIVELES.map((opcion) => (
          <button
            key={opcion}
            type="button"
            role="tab"
            aria-selected={nivel === opcion}
            className={`${ubicacionesStyles.pestana} ${nivel === opcion ? ubicacionesStyles.pestanaActiva : ""}`}
            onClick={() => cambiarNivel(opcion)}
          >
            {capitalizar(NIVELES[opcion].plural)}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        {ancestros.map((ancestro, indice) => {
          const padreDelAncestro = indice === 0 ? null : seleccion[ancestros[indice - 1]];
          const habilitado = indice === 0 || padreDelAncestro !== null;
          return (
            <SelectContexto
              key={`${ancestro}-${padreDelAncestro ?? "todos"}-${recarga}`}
              nivel={ancestro}
              idPadre={padreDelAncestro}
              habilitado={habilitado}
              valor={seleccion[ancestro]}
              alCambiar={(id) => elegirContexto(ancestro, id)}
              alCargar={(cantidad) => setCantidadOpciones((actual) => ({ ...actual, [ancestro]: cantidad }))}
            />
          );
        })}
        <div className={styles.field}>
          <label htmlFor="buscar-ubicacion">Buscar {config.singular}</label>
          <input
            id="buscar-ubicacion"
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre"
          />
        </div>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}
      {aviso && <p role="status" className={styles.notice}>{aviso}</p>}

      <ConPermiso permisos={ACCESO.crearUbicaciones}>
        {config.padre && !idPadre ? (
          <AyudaAlta
            nivel={nivel}
            padreVacio={padreSinOpciones}
            alIrAlPadre={() => cambiarNivel(config.padre as NivelUbicacion)}
          />
        ) : (
          <form className={ubicacionesStyles.alta} onSubmit={crear}>
            <div className={`${styles.field} ${ubicacionesStyles.altaCampo}`}>
              <label htmlFor="nueva-ubicacion">
                {config.femenino ? "Nueva" : "Nuevo"} {config.singular}
              </label>
              <input
                id="nueva-ubicacion"
                value={nombreNuevo}
                onChange={(event) => setNombreNuevo(event.target.value)}
                maxLength={LARGO_MAXIMO_NOMBRE}
                placeholder="Nombre"
                disabled={guardandoAlta}
              />
            </div>
            <button type="submit" className={styles.buttonPrimary} disabled={guardandoAlta}>
              {guardandoAlta ? "Agregando…" : "Agregar"}
            </button>
          </form>
        )}
      </ConPermiso>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{capitalizar(config.singular)}</th>
              {config.padre && <th scope="col">{capitalizar(NIVELES[config.padre].singular)}</th>}
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={columnas} className={styles.emptyRow}>Cargando {config.plural}…</td></tr>
            )}
            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan={columnas} className={styles.emptyRow}>
                  {nombreBuscado
                    ? `No hay ${config.plural} que coincidan con "${nombreBuscado}".`
                    : `Todavía no hay ${config.plural} cargad${config.femenino ? "as" : "os"} acá.`}
                </td>
              </tr>
            )}
            {!cargando &&
              filas.map((fila) => (
                <tr key={fila.id}>
                  <td>
                    {enEdicion === fila.id ? (
                      <form className={styles.inlineEdit} onSubmit={(event) => void guardarEdicion(event, fila)}>
                        <label className={styles.visuallyHidden} htmlFor={`editar-ubicacion-${fila.id}`}>
                          Nuevo nombre
                        </label>
                        <input
                          id={`editar-ubicacion-${fila.id}`}
                          className={styles.inlineEditInput}
                          value={nombreEditado}
                          onChange={(event) => setNombreEditado(event.target.value)}
                          maxLength={LARGO_MAXIMO_NOMBRE}
                          required
                          autoFocus
                          disabled={guardandoEdicion}
                        />
                        <div className={styles.inlineEditActions}>
                          <button type="submit" className={styles.inlineSaveButton} disabled={guardandoEdicion}>
                            {guardandoEdicion ? "Guardando…" : "Guardar"}
                          </button>
                          <button
                            type="button"
                            className={styles.inlineCancelButton}
                            onClick={cerrarEdicion}
                            disabled={guardandoEdicion}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      fila.nombre
                    )}
                  </td>
                  {config.padre && <td className={ubicacionesStyles.padre}>{fila.nombrePadre || "—"}</td>}
                  <td>
                    <div className={styles.rowActions}>
                      {config.hijo && (
                        <button
                          type="button"
                          className={styles.linkAction}
                          disabled={ocupado}
                          onClick={() => void verDependientes(fila)}
                        >
                          Ver {NIVELES[config.hijo].plural}
                        </button>
                      )}
                      <ConPermiso permisos={ACCESO.editarUbicaciones}>
                        <button
                          type="button"
                          className={styles.linkAction}
                          disabled={ocupado || enEdicion === fila.id}
                          onClick={() => abrirEdicion(fila)}
                        >
                          Editar
                        </button>
                      </ConPermiso>
                      <ConPermiso permisos={ACCESO.eliminarUbicaciones}>
                        <button
                          type="button"
                          className={`${styles.linkAction} ${styles.linkActionDanger}`}
                          disabled={ocupado}
                          onClick={() => void eliminar(fila)}
                        >
                          {procesandoId === fila.id ? "Revisando…" : "Eliminar"}
                        </button>
                      </ConPermiso>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} ${config.plural}` : ""}
        </span>
        <div className={styles.paginationButtons}>
          <button
            type="button"
            className={styles.buttonGhost}
            disabled={page <= 1}
            onClick={() => setPage((actual) => Math.max(1, actual - 1))}
          >
            Anterior
          </button>
          <button
            type="button"
            className={styles.buttonGhost}
            disabled={page >= totalPaginas}
            onClick={() => setPage((actual) => Math.min(totalPaginas, actual + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

// Explica por qué todavía no se puede agregar en este nivel.
function AyudaAlta({
  nivel,
  padreVacio,
  alIrAlPadre,
}: {
  nivel: NivelUbicacion;
  padreVacio: boolean;
  alIrAlPadre: () => void;
}) {
  const config = NIVELES[nivel];
  const padre = NIVELES[config.padre as NivelUbicacion];
  const abuelo = padre.padre ? NIVELES[padre.padre] : null;

  if (padreVacio) {
    return (
      <p className={ubicacionesStyles.altaAyuda}>
        {abuelo
          ? `${abuelo.femenino ? "Esta" : "Este"} ${abuelo.singular} todavía no tiene ${padre.plural}. `
          : `Todavía no hay ${padre.plural} cargad${padre.femenino ? "as" : "os"}. `}
        Para agregar {articulo(nivel, true)} {config.plural}, primero cargá {articulo(config.padre as NivelUbicacion, true)}{" "}
        {padre.plural}.{" "}
        <button type="button" className={styles.linkAction} onClick={alIrAlPadre}>
          Ir a {capitalizar(padre.plural)}
        </button>
      </p>
    );
  }

  return (
    <p className={ubicacionesStyles.altaAyuda}>
      Para agregar {articulo(nivel, true)} {config.plural}, elegí arriba {articulo(config.padre as NivelUbicacion)}{" "}
      {padre.singular} {padre.femenino ? "a la" : "al"} que pertenecen.
    </p>
  );
}

// Un select del contexto (país, departamento o ciudad), con sus opciones
// cargadas según el nivel de arriba.
function SelectContexto({
  nivel,
  idPadre,
  habilitado,
  valor,
  alCambiar,
  alCargar,
}: {
  nivel: NivelPadre;
  idPadre: number | null;
  habilitado: boolean;
  valor: number | null;
  alCambiar: (id: number | null) => void;
  alCargar: (cantidad: number | null) => void;
}) {
  const [opciones, setOpciones] = useState<Ubicacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const config = NIVELES[nivel];

  // Se guarda en una ref para no recargar las opciones cada vez que el padre
  // vuelve a renderizar con una función nueva.
  const avisarCarga = useRef(alCargar);
  useEffect(() => {
    avisarCarga.current = alCargar;
  });

  useEffect(() => {
    if (!habilitado) return;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      avisarCarga.current(null);
      try {
        const resultado = await opcionesUbicacion(nivel, idPadre);
        if (cancelado) return;
        setOpciones(resultado);
        avisarCarga.current(resultado.length);
      } catch {
        if (!cancelado) setOpciones([]);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [nivel, idPadre, habilitado]);

  const id = `contexto-${nivel}`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{capitalizar(config.singular)}</label>
      <select
        id={id}
        value={valor ?? ""}
        disabled={!habilitado || cargando}
        onChange={(event) => alCambiar(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">
          {cargando ? "Cargando…" : `${config.femenino ? "Todas" : "Todos"} ${articulo(nivel, true)} ${config.plural}`}
        </option>
        {opciones.map((opcion) => (
          <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>
        ))}
      </select>
    </div>
  );
}
