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
    {
        id: "productos",
        nombre: "Productos",
        recursos: ["PRODUCTOS", "IMAGENES", "IMAGENESPRODUCTOS"],
    },
    {
        id: "catalogo",
        nombre: "Catálogo",
        recursos: [
            "CATALOGO",
            "CATEGORIAS",
            "SUBCATEGORIAS",
            "CATEGORIASUBCATEGORIAS",
            "PRODUCTOSUBCATEGORIAS",
        ],
    },
    {
        id: "tienda",
        nombre: "Tienda",
        recursos: ["TIENDAS", "CONTACTOS", "TIPOS_CONTACTO"],
    },
    {
        id: "ayudantes",
        nombre: "Ayudantes",
        recursos: ["AYUDANTES"],
    },
    {
        id: "pedidos",
        nombre: "Pedidos",
        recursos: ["PEDIDOS"],
    },
    {
        id: "facturacion",
        nombre: "Facturación",
        recursos: ["FACTURACION", "FACTURAS", "COMPROBANTES"],
    },
    {
        id: "reportes",
        nombre: "Reportes",
        recursos: ["REPORTES"],
    },
    {
        id: "usuarios",
        nombre: "Usuarios",
        recursos: ["USUARIOS"],
    },
    {
        id: "roles",
        nombre: "Roles",
        recursos: ["ROLES", "PERMISOS"],
    },
    {
        id: "perfil",
        nombre: "Perfil",
        recursos: ["PERFIL"],
    },
    {
        id: "canales",
        nombre: "Canales",
        recursos: ["CANALES"],
    },
    {
        id: "ubicaciones",
        nombre: "Ubicaciones",
        recursos: [
            "PAISES",
            "DEPARTAMENTOS",
            "CIUDADES",
            "BARRIOS",
            "DIRECCIONES",
        ],
    },
];

const acciones: Record<string, string> = {
    LIST: "Listar",
    GET: "Consultar",
    CREATE: "Crear",
    UPDATE: "Editar",
    DELETE: "Eliminar",
    OPTIONS: "Consultar opciones de",
    ASSIGN: "Asignar",
    REVOKE: "Quitar",
    EXPORT: "Exportar",
    DOWNLOAD: "Descargar",
};

const recursos: Record<string, string> = {
    HOME: "inicio",
    INICIO: "inicio",
    CATALOGO: "catálogo",
    PRODUCTOS: "productos",
    IMAGENES: "imágenes de productos",
    IMAGENESPRODUCTOS: "imágenes de productos",
    CATEGORIAS: "categorías",
    SUBCATEGORIAS: "subcategorías",
    CATEGORIASUBCATEGORIAS: "relaciones entre categorías y subcategorías",
    PRODUCTOSUBCATEGORIAS: "subcategorías de productos",
    PEDIDOS: "pedidos",
    FACTURACION: "facturación",
    FACTURAS: "facturas",
    COMPROBANTES: "comprobantes",
    REPORTES: "reportes",
    TIENDAS: "tiendas",
    CONTACTOS: "contactos de tiendas",
    TIPOS_CONTACTO: "tipos de contacto",
    AYUDANTES: "ayudantes",
    PERFIL: "perfil personal",
    USUARIOS: "usuarios",
    ROLES: "roles",
    PERMISOS: "permisos",
    PAISES: "países",
    DEPARTAMENTOS: "departamentos",
    CIUDADES: "ciudades",
    BARRIOS: "barrios",
    DIRECCIONES: "direcciones",
    CANALES: "canales",
};

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

    const antiguos: GrupoPermisos = {
        id: "permisos-antiguos",
        nombre: "Permisos antiguos de configuración",
        recursos: [],
        permisos: [],
    };

    for (const permiso of permisos) {
        // Se muestran aparte para poder revisar y quitar
        // asignaciones existentes, sin ocultarlas.
        if (esPermisoDeDefinicion(permiso)) {
            antiguos.permisos.push(permiso);
            continue;
        }

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

    grupos.push(antiguos);

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