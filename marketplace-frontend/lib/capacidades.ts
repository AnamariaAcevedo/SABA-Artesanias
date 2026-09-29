import { ACCESO } from "@/lib/access";
import type { Permiso } from "@/lib/permisos";

type Definicion = {
    id: string;
    nombre: string;
    codigos: readonly string[];
};

type Modulo = {
    id: string;
    nombre: string;
    capacidades: Definicion[];
};

export type CapacidadResuelta = Definicion & {
    ids: number[];
    disponible: boolean;
};

export type ModuloResuelto = {
    id: string;
    nombre: string;
    capacidades: CapacidadResuelta[];
};

const modulos: Modulo[] = [
    {
        id: "productos",
        nombre: "Productos",
        capacidades: [
            {
                id: "productos.crear",
                nombre: "Crear productos",
                codigos: ["CREATE_PRODUCTOS"],
            },
            {
                id: "productos.editar",
                nombre: "Editar productos, precios y stock",
                codigos: ["UPDATE_PRODUCTOS"],
            },
            {
                id: "productos.imagenes",
                nombre: "Gestionar imágenes de productos",
                codigos: ["CREATE_IMAGENES", "DELETE_IMAGENES"],
            },
            {
                id: "productos.eliminar",
                nombre: "Eliminar productos",
                codigos: ["DELETE_PRODUCTOS"],
            },
        ],
    },
    {
        id: "catalogo",
        nombre: "Catálogo general de SABA",
        capacidades: [
            {
                id: "catalogo.categorias",
                nombre: "Gestionar categorías",
                codigos: [
                    "CREATE_CATEGORIAS",
                    "UPDATE_CATEGORIAS",
                    "DELETE_CATEGORIAS",
                ],
            },
            {
                id: "catalogo.subcategorias",
                nombre: "Gestionar subcategorías",
                codigos: [
                    "CREATE_SUBCATEGORIAS",
                    "UPDATE_SUBCATEGORIAS",
                    "DELETE_SUBCATEGORIAS",
                ],
            },
            {
                id: "catalogo.asociaciones",
                nombre: "Asignar o quitar subcategorías",
                codigos: [
                    "ASSIGN_SUBCATEGORIAS",
                    "REVOKE_SUBCATEGORIAS",
                ],
            },
        ],
    },
    {
        id: "tiendas",
        nombre: "Administración de tiendas",
        capacidades: [
            {
                id: "tiendas.crear",
                nombre: "Crear tiendas",
                codigos: ["CREATE_TIENDAS"],
            },
            {
                id: "tiendas.editar",
                nombre: "Editar tiendas",
                codigos: ["UPDATE_TIENDAS"],
            },
            {
                id: "tiendas.contactos",
                nombre: "Gestionar contactos de tiendas",
                codigos: [
                    "CREATE_CONTACTOS",
                    "UPDATE_CONTACTOS",
                    "DELETE_CONTACTOS",
                ],
            },
            {
                id: "tiendas.eliminar",
                nombre: "Eliminar tiendas",
                codigos: ["DELETE_TIENDAS"],
            },
        ],
    },
    {
        id: "usuarios",
        nombre: "Usuarios del sistema",
        capacidades: [
            {
                id: "usuarios.ver",
                nombre: "Ver usuarios",
                codigos: ACCESO.verUsuarios,
            },
            {
                id: "usuarios.crear",
                nombre: "Crear usuarios",
                codigos: ACCESO.crearUsuario,
            },
            {
                id: "usuarios.editar",
                nombre: "Editar usuarios y cambiar su estado",
                codigos: ACCESO.editarUsuario,
            },
            {
                id: "usuarios.eliminar",
                nombre: "Eliminar usuarios",
                codigos: [
                    ...ACCESO.verUsuarios,
                    ...ACCESO.eliminarUsuario,
                ],
            },
        ],
    },
    {
        id: "roles",
        nombre: "Roles",
        capacidades: [
            {
                id: "roles.ver",
                nombre: "Ver listado de roles",
                codigos: ACCESO.verRoles,
            },
            {
                id: "roles.gestionar",
                nombre: "Crear, editar roles y asignar permisos",
                codigos: [
                    ...ACCESO.crearRol,
                    ...ACCESO.editarRol,
                ],
            },
        ],
    },
];

export function resolverModulos(
    permisos: readonly Permiso[]
): ModuloResuelto[] {
    const porCodigo = new Map(
        permisos.map((permiso) => [
            `${permiso.action}_${permiso.resource}`.toUpperCase(),
            permiso.id,
        ])
    );

    return modulos.map((modulo) => ({
        id: modulo.id,
        nombre: modulo.nombre,
        capacidades: modulo.capacidades.map((capacidad) => {
            const codigos = [...new Set(capacidad.codigos)];

            const ids = codigos.flatMap((codigo) => {
                const id = porCodigo.get(codigo);
                return id === undefined ? [] : [id];
            });

            return {
                ...capacidad,
                ids,
                disponible: ids.length === codigos.length,
            };
        }),
    }));
}