import {
    nombrePermiso,
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

const definiciones = [
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
        id: "administracion",
        nombre: "Administración",
        recursos: ["ADMINISTRACION"],
    },
    {
        id: "tiendas",
        nombre: "Tiendas",
        recursos: ["TIENDAS"],
    },
    {
        id: "usuarios",
        nombre: "Usuarios",
        recursos: ["USUARIOS"],
    },
    {
        id: "roles",
        nombre: "Roles",
        recursos: ["ROLES"],
    },
    {
        id: "permisos",
        nombre: "Permisos",
        recursos: ["PERMISOS"],
    },
    {
        id: "contactos",
        nombre: "Contactos",
        recursos: ["CONTACTOS"],
    },
    {
        id: "tipos-contacto",
        nombre: "Tipos de contacto",
        recursos: ["TIPOS_CONTACTO"],
    },
    {
        id: "direcciones",
        nombre: "Direcciones",
        recursos: ["DIRECCIONES"],
    },
    {
        id: "paises",
        nombre: "Países",
        recursos: ["PAISES"],
    },
    {
        id: "departamentos",
        nombre: "Departamentos",
        recursos: ["DEPARTAMENTOS"],
    },
    {
        id: "ciudades",
        nombre: "Ciudades",
        recursos: ["CIUDADES"],
    },
    {
        id: "barrios",
        nombre: "Barrios",
        recursos: ["BARRIOS"],
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
        recursos: ["FACTURACION"],
    },
    {
        id: "reportes",
        nombre: "Reportes",
        recursos: ["REPORTES"],
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
];

function nombreEntidad(resource: string): string {
    const texto = resource.toLowerCase().replaceAll("_", " ");
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function resolverModulos(
    permisos: readonly Permiso[]
): ModuloResuelto[] {
    const grupos: ModuloResuelto[] = definiciones.map(
        (definicion) => ({
            id: definicion.id,
            nombre: definicion.nombre,
            capacidades: [],
        })
    );

    const idsProcesados = new Set<number>();

    for (const permiso of permisos) {
        if (idsProcesados.has(permiso.id)) continue;
        idsProcesados.add(permiso.id);

        const recurso = permiso.resource.trim().toUpperCase();

        const definicion = definiciones.find((item) =>
            item.recursos.includes(recurso)
        );

        const grupoId = definicion?.id ?? `entidad:${recurso}`;

        let grupo = grupos.find((item) => item.id === grupoId);

        if (!grupo) {
            grupo = {
                id: grupoId,
                nombre: nombreEntidad(recurso),
                capacidades: [],
            };

            grupos.push(grupo);
        }

        // Mismo formato que las authorities del backend.
        const codigo = `${permiso.action}_${permiso.resource}`;

        grupo.capacidades.push({
            id: String(permiso.id),
            nombre: nombrePermiso(permiso),
            codigos: [codigo],
            ids: [permiso.id],
            disponible: true,
        });
    }

    return grupos
        .filter((grupo) => grupo.capacidades.length > 0)
        .map((grupo) => ({
            ...grupo,
            capacidades: grupo.capacidades.sort((a, b) =>
                a.nombre.localeCompare(b.nombre, "es")
            ),
        }));
}