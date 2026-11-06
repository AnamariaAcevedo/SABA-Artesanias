import { apiFetch, apiFetchConPaginacion } from "@/lib/api";

// Jerarquía de ubicaciones del backend: País → Departamento → Ciudad → Barrio.
// Los cuatro niveles tienen la misma forma (nombre + id del nivel superior),
// así que el panel de administración los maneja con una sola configuración.
// Todos usan los permisos *_DIRECCIONES y el backend los borra de forma lógica.

export type NivelUbicacion = "pais" | "departamento" | "ciudad" | "barrio";

export const ORDEN_NIVELES: NivelUbicacion[] = ["pais", "departamento", "ciudad", "barrio"];

type ConfigNivel = {
  ruta: string;
  singular: string;
  plural: string;
  // Femenino para armar textos como "la ciudad" / "el barrio".
  femenino: boolean;
  padre: NivelUbicacion | null;
  hijo: NivelUbicacion | null;
  // Nombres de los campos del DTO que apuntan al nivel superior.
  campoPadre: string | null;
  campoNombrePadre: string | null;
};

export const NIVELES: Record<NivelUbicacion, ConfigNivel> = {
  pais: {
    ruta: "/paises",
    singular: "país",
    plural: "países",
    femenino: false,
    padre: null,
    hijo: "departamento",
    campoPadre: null,
    campoNombrePadre: null,
  },
  departamento: {
    ruta: "/departamentos",
    singular: "departamento",
    plural: "departamentos",
    femenino: false,
    padre: "pais",
    hijo: "ciudad",
    campoPadre: "idPais",
    campoNombrePadre: "nombrePais",
  },
  ciudad: {
    ruta: "/ciudades",
    singular: "ciudad",
    plural: "ciudades",
    femenino: true,
    padre: "departamento",
    hijo: "barrio",
    campoPadre: "idDepartamento",
    campoNombrePadre: "nombreDepartamento",
  },
  barrio: {
    ruta: "/barrios",
    singular: "barrio",
    plural: "barrios",
    femenino: false,
    padre: "ciudad",
    hijo: null,
    campoPadre: "idCiudad",
    campoNombrePadre: "nombreCiudad",
  },
};

export const LARGO_MAXIMO_NOMBRE = 50;

export type Ubicacion = {
  id: number;
  nombre: string;
  idPadre: number | null;
  nombrePadre: string | null;
};

type UbicacionApi = { id: number; nombre: string } & Record<string, unknown>;

function aUbicacion(nivel: NivelUbicacion, dato: UbicacionApi): Ubicacion {
  const { campoPadre, campoNombrePadre } = NIVELES[nivel];
  return {
    id: dato.id,
    nombre: dato.nombre,
    idPadre: campoPadre ? Number(dato[campoPadre]) : null,
    nombrePadre: campoNombrePadre ? String(dato[campoNombrePadre] ?? "") : null,
  };
}

export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export async function listarUbicaciones(
  nivel: NivelUbicacion,
  filtro: { page: number; perPage: number; nombre?: string; idPadre?: number | null }
) {
  const { ruta, campoPadre } = NIVELES[nivel];
  const params = new URLSearchParams({ page: String(filtro.page), perPage: String(filtro.perPage) });
  if (filtro.nombre) params.set("nombre", filtro.nombre);
  if (campoPadre && filtro.idPadre) params.set(campoPadre, String(filtro.idPadre));
  const resultado = await apiFetchConPaginacion<UbicacionApi[]>(`${ruta}?${params.toString()}`);
  return { data: resultado.data.map((dato) => aUbicacion(nivel, dato)), pagination: resultado.pagination };
}

// Todas las opciones de un nivel dentro de su padre, para los selects en cascada.
export async function opcionesUbicacion(nivel: NivelUbicacion, idPadre: number | null): Promise<Ubicacion[]> {
  const { data } = await listarUbicaciones(nivel, { page: 1, perPage: 1000, idPadre });
  return data.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// El backend solo filtra por el nivel inmediatamente superior (ciudades por
// departamento). Para filtrar por un nivel más arriba (ciudades de un país) se
// recorren los niveles intermedios y se pagina en el front.
export async function listarUbicacionesDentroDe(
  nivel: NivelUbicacion,
  ancestro: NivelUbicacion,
  idAncestro: number,
  filtro: { page: number; perPage: number; nombre?: string }
) {
  let ids = [idAncestro];
  let actual = ancestro;
  while (NIVELES[actual].hijo && NIVELES[actual].hijo !== nivel) {
    const intermedio = NIVELES[actual].hijo as NivelUbicacion;
    const grupos = await Promise.all(ids.map((id) => opcionesUbicacion(intermedio, id)));
    ids = grupos.flat().map((ubicacion) => ubicacion.id);
    actual = intermedio;
  }

  const grupos = await Promise.all(ids.map((id) => opcionesUbicacion(nivel, id)));
  const termino = filtro.nombre ? normalizar(filtro.nombre) : "";
  const todas = grupos
    .flat()
    .filter((ubicacion) => !termino || normalizar(ubicacion.nombre).includes(termino))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const inicio = (filtro.page - 1) * filtro.perPage;
  return {
    data: todas.slice(inicio, inicio + filtro.perPage),
    pagination: { page: filtro.page, perPage: filtro.perPage, total: todas.length },
  };
}

export async function obtenerUbicacion(nivel: NivelUbicacion, id: number): Promise<Ubicacion> {
  return aUbicacion(nivel, await apiFetch<UbicacionApi>(`${NIVELES[nivel].ruta}/${id}`));
}

// Cuántos registros del nivel inferior dependen de esta ubicación.
export async function contarDependientes(nivel: NivelUbicacion, id: number): Promise<number> {
  const hijo = NIVELES[nivel].hijo;
  if (!hijo) return 0;
  const { data, pagination } = await listarUbicaciones(hijo, { page: 1, perPage: 1, idPadre: id });
  return pagination?.total ?? data.length;
}

export function crearUbicacion(nivel: NivelUbicacion, nombre: string, idPadre: number | null) {
  const { ruta, campoPadre } = NIVELES[nivel];
  const cuerpo = campoPadre ? { nombre, [campoPadre]: idPadre } : { nombre };
  return apiFetch<UbicacionApi>(ruta, { method: "POST", body: JSON.stringify(cuerpo) });
}

export function renombrarUbicacion(nivel: NivelUbicacion, id: number, nombre: string) {
  return apiFetch<UbicacionApi>(`${NIVELES[nivel].ruta}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ nombre }),
  });
}

export function eliminarUbicacion(nivel: NivelUbicacion, id: number) {
  return apiFetch<void>(`${NIVELES[nivel].ruta}/${id}`, { method: "DELETE" });
}
