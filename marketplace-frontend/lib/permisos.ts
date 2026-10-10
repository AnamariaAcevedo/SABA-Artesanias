export type Permiso = {
    id: number;
    action: string;
    resource: string;
};

type Modulo = {
    id: string;
    nombre: string;
    recursos: string[];
};

export type GrupoPermisos = Modulo & {
    permisos: Permiso[];
};

const modulos: Modulo[] = [
    { id: "productos", nombre: "Productos", recursos: ["PRODUCTOS", "IMAGENES"] },
    { id: "categorias", nombre: "Categorías y subcategorías", recursos: ["CATEGORIAS", "SUBCATEGORIAS"] },
    { id: "tiendas", nombre: "Tiendas", recursos: ["TIENDAS"] },
    { id: "usuarios", nombre: "Usuarios", recursos: ["USUARIOS"] },
    { id: "roles", nombre: "Roles", recursos: ["ROLES"] },
    { id: "permisos", nombre: "Permisos", recursos: ["PERMISOS"] },
    { id: "contactos", nombre: "Contactos", recursos: ["CONTACTOS"] },
    { id: "tipos-contacto", nombre: "Tipos de contacto", recursos: ["TIPOS_CONTACTO"] },
    { id: "ubicacion", nombre: "Ubicación", recursos: ["DIRECCIONES"] },
    { id: "solicitudes-vendedor", nombre: "Solicitudes de vendedor", recursos: ["SOLICITUDES_VENDEDOR"] },
];

const acciones: Record<string, string> = {
    LIST: "Consultar",
    CREATE: "Crear",
    UPDATE: "Editar",
    DELETE: "Eliminar",
    OPTIONS: "Consultar opciones de",
    ASSIGN: "Asignar",
    REVOKE: "Quitar",
};

const recursos: Record<string, string> = {
    PRODUCTOS: "productos",
    IMAGENES: "imágenes de productos",
    CATEGORIAS: "categorías y subcategorías",
    SUBCATEGORIAS: "subcategorías",
    TIENDAS: "tiendas",
    CONTACTOS: "contactos",
    TIPOS_CONTACTO: "tipos de contacto",
    USUARIOS: "usuarios",
    ROLES: "roles",
    PERMISOS: "permisos",
    DIRECCIONES: "ubicaciones",
    SOLICITUDES_VENDEDOR: "solicitudes de vendedor",
};

// Estos permisos deben retirarse mediante la migración del backend.
// No se traducen a IDs nuevos: las asignaciones se migran en la base de datos.
export function esPermisoObsoleto(permiso: Permiso): boolean {
    const accion = normalizar(permiso.action);
    const recurso = normalizar(permiso.resource);
    return accion === "GET"
        || (["PAISES", "DEPARTAMENTOS", "CIUDADES", "BARRIOS"].includes(recurso)
            && ["CREATE", "UPDATE", "DELETE", "LIST"].includes(accion))
        || (recurso === "SUBCATEGORIAS" && ["CREATE", "UPDATE", "DELETE"].includes(accion));
}

function normalizar(valor: string): string {
    return valor.trim().toUpperCase();
}

function textoLegible(valor: string): string {
    return valor.toLowerCase().replaceAll("_", " ");
}

export function nombrePermiso(permiso: Permiso): string {
    const accion = normalizar(permiso.action);
    const recurso = normalizar(permiso.resource);

    return [
        acciones[accion] ?? textoLegible(accion),
        recursos[recurso] ?? textoLegible(recurso),
    ].join(" ");
}
export function esPermisoDeDefinicion(
    permiso: Permiso
): boolean {
    return (
        normalizar(permiso.resource) === "PERMISOS" &&
        ["CREATE", "UPDATE", "DELETE"].includes(
            normalizar(permiso.action)
        )
    );
}
export function agruparPermisos(
    permisos: Permiso[]
): GrupoPermisos[] {
    const grupos: GrupoPermisos[] = modulos.map((modulo) => ({
        ...modulo,
        permisos: [],
    }));

    for (const permiso of permisos) {
        if (esPermisoObsoleto(permiso)) continue;
        const recurso = normalizar(permiso.resource);

        let grupo = grupos.find((item) =>
            item.recursos.includes(recurso)
        );

        if (!grupo) {
            grupo = {
                id: `recurso:${recurso}`,
                nombre: recursos[recurso] ?? textoLegible(recurso),
                recursos: [recurso],
                permisos: [],
            };

            grupos.push(grupo);
        }

        grupo.permisos.push(permiso);
    }


    return grupos
        .filter((grupo) => grupo.permisos.length > 0)
        .map((grupo) => ({
            ...grupo,
            permisos: [...grupo.permisos].sort((a, b) =>
                nombrePermiso(a).localeCompare(
                    nombrePermiso(b),
                    "es"
                )
            ),
        }));
}
