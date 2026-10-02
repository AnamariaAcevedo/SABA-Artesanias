import {
    nombrePermiso,
    agruparPermisos,
    type Permiso,
} from "@/lib/permisos";

// Conservamos estos tipos para que el guardado actual
// de Roles siga funcionando. Cada elemento tiene un solo ID.
export type CapacidadResuelta = {
    id: string;
    nombre: string;
    codigos: string[];
    ids: number[];
    disponible: boolean;
};

export type ModuloResuelto = {
    id: string;
    nombre: string;
    capacidades: CapacidadResuelta[];
};

export function resolverModulos(permisos: readonly Permiso[]): ModuloResuelto[] {
    const unicos = [...new Map(permisos.map((permiso) => [permiso.id, permiso])).values()];
    return agruparPermisos(unicos).map((grupo) => ({
        id: grupo.id,
        nombre: grupo.nombre,
        capacidades: grupo.permisos.map((permiso) => ({
            id: String(permiso.id),
            nombre: nombrePermiso(permiso),
            codigos: [`${permiso.action}_${permiso.resource}`],
            ids: [permiso.id],
            disponible: true,
        })),
    }));
}
