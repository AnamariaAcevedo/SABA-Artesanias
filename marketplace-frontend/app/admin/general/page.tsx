"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import { useSesion } from "@/components/auth/SesionProvider";
import { apiFetch, apiFetchConPaginacion } from "@/lib/api";

type ModuloId = "productos" | "tiendas" | "contactos" | "tipos-contacto";

type Entidad = {
  id: number;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  puntuacion?: number;
  descuento?: number;
  cantidadDisponible?: number;
  idTienda?: number;
  nombreTienda?: string;
  idDireccion?: number;
  direccionCompleta?: string;
  calle?: string;
  nombreEdificio?: string | null;
  nroCasa?: number | null;
  nroDepartamento?: string | null;
  nombreBarrio?: string;
  nombreCiudad?: string;
  enlace?: string;
  usuario?: string;
  nroTelefono?: string | null;
  idTipoContacto?: number;
  nombreTipoContacto?: string;
};

type Opcion = { value: string; label: string };
type Campo = {
  name: string;
  label: string;
  type?: "text" | "number" | "url" | "tel" | "textarea" | "select";
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  options?: Opcion[];
};

type Configuracion = {
  id: ModuloId;
  titulo: string;
  singular: string;
  endpoint: string;
  permisoCrear: string;
  permisoEditar: string;
  permisoEliminar: string;
  permisoListar?: string;
  buscarPorNombre: boolean;
};

const CONFIGURACIONES: Configuracion[] = [
  {
    id: "productos", titulo: "Productos", singular: "producto", endpoint: "/productos",
    permisoCrear: "CREATE_PRODUCTOS", permisoEditar: "UPDATE_PRODUCTOS", permisoEliminar: "DELETE_PRODUCTOS",
    buscarPorNombre: true, permisoListar: "LIST_PRODUCTOS",
  },
  {
    id: "tiendas", titulo: "Tiendas", singular: "tienda", endpoint: "/tiendas",
    permisoCrear: "CREATE_TIENDAS", permisoEditar: "UPDATE_TIENDAS", permisoEliminar: "DELETE_TIENDAS",
    buscarPorNombre: true, permisoListar: "LIST_TIENDAS",
  },
  {
    id: "contactos", titulo: "Contactos", singular: "contacto", endpoint: "/contactos",
    permisoCrear: "CREATE_CONTACTOS", permisoEditar: "UPDATE_CONTACTOS", permisoEliminar: "DELETE_CONTACTOS",
    buscarPorNombre: false, permisoListar: "LIST_CONTACTOS",
  },
  {
    id: "tipos-contacto", titulo: "Tipos de contacto", singular: "tipo de contacto", endpoint: "/tipos-contacto",
    permisoCrear: "CREATE_TIPOS_CONTACTO", permisoEditar: "UPDATE_TIPOS_CONTACTO", permisoEliminar: "DELETE_TIPOS_CONTACTO",
    buscarPorNombre: true, permisoListar: "LIST_TIPOS_CONTACTO",
  },
];

async function obtenerTodos<T>(ruta: string): Promise<T[]> {
  const elementos: T[] = [];
  let pagina = 1;
  while (true) {
    const separador = ruta.includes("?") ? "&" : "?";
    const resultado = await apiFetchConPaginacion<T[]>(`${ruta}${separador}page=${pagina}&perPage=100`);
    elementos.push(...resultado.data);
    if (!resultado.pagination || elementos.length >= resultado.pagination.total || resultado.data.length === 0) return elementos;
    pagina++;
  }
}

function valor(entidad: Entidad, campo: keyof Entidad): string {
  const actual = entidad[campo];
  return actual === null || actual === undefined ? "" : String(actual);
}

export default function AdministracionGeneralPage() {
  const { sesion } = useSesion();
  const permisos = useMemo(() => new Set(sesion?.permisos ?? []), [sesion]);
  const configuracionesVisibles = useMemo(
    () => CONFIGURACIONES.filter((config) =>
      [config.permisoListar, config.permisoCrear, config.permisoEditar, config.permisoEliminar]
        .some((permiso) => permiso && permisos.has(permiso))),
    [permisos],
  );
  const [modulo, setModulo] = useState<ModuloId>(() => configuracionesVisibles[0]?.id ?? "productos");
  const config = configuracionesVisibles.find((item) => item.id === modulo) ?? configuracionesVisibles[0];
  const [elementos, setElementos] = useState<Entidad[]>([]);
  const [tiendas, setTiendas] = useState<Opcion[]>([]);
  const [tiposContacto, setTiposContacto] = useState<Opcion[]>([]);
  const [direcciones, setDirecciones] = useState<Opcion[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formulario, setFormulario] = useState<Record<string, string> | null>(null);
  const [idEditando, setIdEditando] = useState<number | null>(null);

  useEffect(() => {
    let vigente = true;
    async function cargarOpciones() {
      try {
        const [listaTiendas, listaTipos, listaDirecciones] = await Promise.all([
          obtenerTodos<Entidad>("/tiendas"),
          obtenerTodos<Entidad>("/tipos-contacto"),
          permisos.has("LIST_DIRECCIONES") ? obtenerTodos<Entidad>("/direcciones") : Promise.resolve([]),
        ]);
        if (!vigente) return;
        setTiendas(listaTiendas.map((item) => ({ value: String(item.id), label: item.nombre ?? `Tienda ${item.id}` })));
        setTiposContacto(listaTipos.map((item) => ({ value: String(item.id), label: item.nombre ?? `Tipo ${item.id}` })));
        setDirecciones(listaDirecciones.map((item) => ({
          value: String(item.id),
          label: item.direccionCompleta ?? (
            [
              [item.calle, item.nombreEdificio ? `${item.nombreEdificio}, depto. ${item.nroDepartamento ?? "s/n"}` : item.nroCasa].filter(Boolean).join(" "),
              item.nombreBarrio,
              item.nombreCiudad,
            ].filter(Boolean).join(", ") || `Dirección ${item.id}`
          ),
        })));
      } catch (cause) {
        if (vigente) setError(cause instanceof Error ? cause.message : "No pudimos cargar las opciones.");
      }
    }
    void cargarOpciones();
    return () => { vigente = false; };
  }, [permisos]);

  const cargar = useCallback(async () => {
    if (!config) return;
    setCargando(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(pagina), perPage: "10" });
      if (config.buscarPorNombre && busquedaAplicada) params.set("nombre", busquedaAplicada);
      const resultado = await apiFetchConPaginacion<Entidad[]>(`${config.endpoint}?${params.toString()}`);
      setElementos(resultado.data);
      setTotal(resultado.pagination?.total ?? resultado.data.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `No pudimos cargar ${config.titulo.toLowerCase()}.`);
    } finally {
      setCargando(false);
    }
  }, [busquedaAplicada, config, pagina]);

  useEffect(() => {
    // La consulta remota sincroniza la tabla con el módulo, filtro y página actuales.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  function cambiarModulo(nuevo: ModuloId) {
    setModulo(nuevo);
    setPagina(1);
    setBusqueda("");
    setBusquedaAplicada("");
    setFormulario(null);
    setIdEditando(null);
    setError("");
    setAviso("");
  }

  function campos(): Campo[] {
    switch (config?.id) {
      case "productos": return [
        { name: "nombre", label: "Nombre", required: true },
        { name: "descripcion", label: "Descripción", type: "textarea", required: true },
        { name: "precio", label: "Precio", type: "number", required: true, min: 0, step: "0.01" },
        { name: "puntuacion", label: "Puntuación", type: "number", min: 0, step: "0.1" },
        { name: "descuento", label: "Descuento (%)", type: "number", min: 0, max: 100, step: "0.01" },
        { name: "cantidadDisponible", label: "Cantidad disponible", type: "number", required: true, min: 0, step: "1" },
        { name: "idTienda", label: "Tienda", type: "select", required: true, options: tiendas },
      ];
      case "tiendas": return [
        { name: "nombre", label: "Nombre", required: true },
        { name: "descripcion", label: "Descripción", type: "textarea", required: true },
        { name: "idDireccion", label: "Dirección", type: "select", required: true, options: direcciones },
      ];
      case "contactos": return [
        { name: "enlace", label: "Enlace", type: "url", required: true },
        { name: "usuario", label: "Usuario", required: true },
        { name: "nroTelefono", label: "Teléfono", type: "tel" },
        { name: "idTipoContacto", label: "Tipo de contacto", type: "select", required: true, options: tiposContacto },
        { name: "idTienda", label: "Tienda", type: "select", required: true, options: tiendas },
      ];
      case "tipos-contacto": return [{ name: "nombre", label: "Nombre", required: true }];
      default: return [];
    }
  }

  function nuevo() {
    const inicial: Record<string, string> = {};
    campos().forEach((campo) => { inicial[campo.name] = ""; });
    if (config?.id === "productos") Object.assign(inicial, { puntuacion: "0", descuento: "0", cantidadDisponible: "0" });
    setFormulario(inicial);
    setIdEditando(null);
    setError("");
    setAviso("");
  }

  function editar(entidad: Entidad) {
    const inicial: Record<string, string> = {};
    campos().forEach((campo) => { inicial[campo.name] = valor(entidad, campo.name as keyof Entidad); });
    setFormulario(inicial);
    setIdEditando(entidad.id);
    setError("");
    setAviso("");
  }

  function payload(): Record<string, string | number | null> {
    const datos = formulario ?? {};
    const resultado: Record<string, string | number | null> = {};
    for (const campo of campos()) {
      const actual = (datos[campo.name] ?? "").trim();
      if (campo.type === "number" || campo.name.startsWith("id")) {
        resultado[campo.name] = actual === "" ? null : Number(actual);
      } else {
        resultado[campo.name] = actual === "" && !campo.required ? null : actual;
      }
    }
    return resultado;
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!config || !formulario) return;
    setGuardando(true);
    setError("");
    setAviso("");
    try {
      await apiFetch(idEditando === null ? config.endpoint : `${config.endpoint}/${idEditando}`, {
        method: idEditando === null ? "POST" : "PUT",
        body: JSON.stringify(payload()),
      });
      setAviso(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} ${idEditando === null ? "creado" : "actualizado"} correctamente.`);
      setFormulario(null);
      setIdEditando(null);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(entidad: Entidad) {
    if (!config || !window.confirm(`¿Eliminar ${config.singular} "${entidad.nombre ?? entidad.usuario ?? entidad.id}"?`)) return;
    setError("");
    setAviso("");
    try {
      await apiFetch(`${config.endpoint}/${entidad.id}`, { method: "DELETE" });
      setAviso(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} eliminado correctamente.`);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos eliminar el registro.");
    }
  }

  function detalle(entidad: Entidad): string {
    switch (config?.id) {
      case "productos": return `${entidad.nombreTienda ?? "Sin tienda"} · Gs. ${(entidad.precio ?? 0).toLocaleString("es-PY")} · Stock: ${entidad.cantidadDisponible ?? 0}`;
      case "tiendas": return entidad.direccionCompleta ?? "Sin dirección";
      case "contactos": return `${entidad.nombreTipoContacto ?? "Sin tipo"} · ${entidad.nombreTienda ?? "Sin tienda"}`;
      default: return `ID ${entidad.id}`;
    }
  }

  if (!config) return <div className={styles.card}><p className={styles.notice}>No tenés permisos de administración general.</p></div>;

  const puedeCrear = permisos.has(config.permisoCrear);
  const puedeEditar = permisos.has(config.permisoEditar);
  const puedeEliminar = permisos.has(config.permisoEliminar);
  const totalPaginas = Math.max(1, Math.ceil(total / 10));
  const direccionRequerida = config.id === "tiendas" && direcciones.length === 0;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>Administración general</h2>
          <p className={styles.pageSubtitle}>Gestioná productos, tiendas y sus canales de contacto.</p>
        </div>
        {puedeCrear && !direccionRequerida && <button type="button" className={styles.buttonPrimary} onClick={nuevo}>Crear {config.singular}</button>}
      </div>

      <div className={styles.toolbar} role="tablist" aria-label="Módulos de administración general">
        {configuracionesVisibles.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={item.id === config.id}
            className={item.id === config.id ? styles.buttonPrimary : styles.buttonOutline}
            onClick={() => cambiarModulo(item.id)}>{item.titulo}</button>
        ))}
      </div>

      {direccionRequerida && <p className={styles.notice}>Para crear o editar tiendas también necesitás el permiso LIST_DIRECCIONES y al menos una dirección registrada.</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {aviso && <p className={styles.notice} role="status">{aviso}</p>}

      {formulario && (
        <form className={styles.form} onSubmit={guardar}>
          <h3 className={styles.sectionSubtitle}>{idEditando === null ? "Crear" : "Editar"} {config.singular}</h3>
          <div className={styles.row}>
            {campos().map((campo) => (
              <div className={styles.field} key={campo.name}>
                <label htmlFor={`general-${campo.name}`}>{campo.label}</label>
                {campo.type === "textarea" ? (
                  <textarea id={`general-${campo.name}`} required={campo.required} value={formulario[campo.name] ?? ""}
                    onChange={(event) => setFormulario({ ...formulario, [campo.name]: event.target.value })} />
                ) : campo.type === "select" ? (
                  <select id={`general-${campo.name}`} required={campo.required} value={formulario[campo.name] ?? ""}
                    onChange={(event) => setFormulario({ ...formulario, [campo.name]: event.target.value })}>
                    <option value="">Seleccioná una opción</option>
                    {campo.options?.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
                  </select>
                ) : (
                  <input id={`general-${campo.name}`} type={campo.type ?? "text"} required={campo.required}
                    min={campo.min} max={campo.max} step={campo.step} value={formulario[campo.name] ?? ""}
                    onChange={(event) => setFormulario({ ...formulario, [campo.name]: event.target.value })} />
                )}
              </div>
            ))}
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.buttonOutline} disabled={guardando} onClick={() => setFormulario(null)}>Cancelar</button>
            <button type="submit" className={styles.buttonPrimary} disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      )}

      {!formulario && (
        <>
          {config.buscarPorNombre && (
            <form className={styles.toolbar} onSubmit={(event) => { event.preventDefault(); setPagina(1); setBusquedaAplicada(busqueda.trim()); }}>
              <div className={styles.field}>
                <label htmlFor="general-busqueda">Buscar por nombre</label>
                <input id="general-busqueda" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder={`Buscar ${config.titulo.toLowerCase()}…`} />
              </div>
              <button type="submit" className={styles.buttonGhost}>Buscar</button>
            </form>
          )}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Registro</th><th>Detalle</th><th>Acciones</th></tr></thead>
              <tbody>
                {cargando && <tr><td colSpan={3} className={styles.emptyRow}>Cargando…</td></tr>}
                {!cargando && elementos.length === 0 && <tr><td colSpan={3} className={styles.emptyRow}>No hay registros.</td></tr>}
                {!cargando && elementos.map((entidad) => (
                  <tr key={entidad.id}>
                    <td><strong>{entidad.nombre ?? entidad.usuario ?? `Registro ${entidad.id}`}</strong>{entidad.descripcion && <small className={styles.tableDescription}>{entidad.descripcion}</small>}</td>
                    <td>{detalle(entidad)}{entidad.enlace && <small className={styles.tableDescription}>{entidad.enlace}</small>}</td>
                    <td><div className={styles.rowActions}>
                      {puedeEditar && !(config.id === "tiendas" && direccionRequerida) && <button type="button" className={styles.linkAction} onClick={() => editar(entidad)}>Editar</button>}
                      {puedeEliminar && <button type="button" className={`${styles.linkAction} ${styles.linkActionDanger}`} onClick={() => void eliminar(entidad)}>Eliminar</button>}
                      {!puedeEditar && !puedeEliminar && <span>Solo lectura</span>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span>Página {pagina} de {totalPaginas} · {total} registros</span>
            <div className={styles.paginationButtons}>
              <button type="button" className={styles.buttonGhost} disabled={pagina <= 1 || cargando} onClick={() => setPagina((actual) => actual - 1)}>Anterior</button>
              <button type="button" className={styles.buttonGhost} disabled={pagina >= totalPaginas || cargando} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
