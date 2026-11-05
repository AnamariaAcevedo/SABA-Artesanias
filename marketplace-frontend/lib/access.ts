export const ACCESO = {
    verUsuarios: ["LIST_USUARIOS"],

    crearUsuario: [
        "LIST_USUARIOS",
        "CREATE_USUARIOS",
        "OPTIONS_ROLES",
    ],

    editarUsuario: [
        "LIST_USUARIOS",
        "UPDATE_USUARIOS",
        "OPTIONS_ROLES",
        "LIST_DIRECCIONES",
    ],

    cambiarEstadoUsuario: ["UPDATE_USUARIOS"],
    eliminarUsuario: ["DELETE_USUARIOS"],

    verRoles: ["LIST_ROLES"],

    crearRol: [
        "LIST_ROLES",
        "CREATE_ROLES",
        "LIST_PERMISOS",
        "ASSIGN_PERMISOS",
    ],

    editarRol: [
        "LIST_ROLES",
        "UPDATE_ROLES",
        "LIST_PERMISOS",
        "ASSIGN_PERMISOS",
        "REVOKE_PERMISOS",
    ],
        verCategorias: ["CREATE_CATEGORIAS"],

    crearCategorias: ["CREATE_CATEGORIAS"],

    editarCategorias: ["UPDATE_CATEGORIAS"],

    eliminarCategorias: ["DELETE_CATEGORIAS"],

    verSolicitudesVendedor: ["LIST_SOLICITUDES_VENDEDOR"],

    gestionarSolicitudesVendedor: ["UPDATE_SOLICITUDES_VENDEDOR"],

    administracionGeneral: [
        "LIST_PRODUCTOS", "CREATE_PRODUCTOS", "UPDATE_PRODUCTOS", "DELETE_PRODUCTOS",
        "LIST_TIENDAS", "CREATE_TIENDAS", "UPDATE_TIENDAS", "DELETE_TIENDAS",
        "LIST_CONTACTOS", "CREATE_CONTACTOS", "UPDATE_CONTACTOS", "DELETE_CONTACTOS",
        "LIST_TIPOS_CONTACTO", "CREATE_TIPOS_CONTACTO", "UPDATE_TIPOS_CONTACTO", "DELETE_TIPOS_CONTACTO",
    ],

    asignarSubcategorias: ["ASSIGN_SUBCATEGORIAS"],

    quitarSubcategorias: ["REVOKE_SUBCATEGORIAS"],
} satisfies Record<string, string[]>;

export function cumplePermisos(
    disponibles: readonly string[],
    requeridos: readonly string[]
): boolean {
    return requeridos.every((permiso) =>
        disponibles.includes(permiso)
    );
}

export function puedeEntrarAlPanel(
    permisos: readonly string[]
): boolean {
    return (
        cumplePermisos(permisos, ACCESO.verUsuarios) ||
        cumplePermisos(permisos, ACCESO.verRoles) ||
        cumplePermisos(permisos, ACCESO.verCategorias) ||
        cumplePermisos(permisos, ACCESO.verSolicitudesVendedor) ||
        puedeGestionarAdministracionGeneral(permisos)
    );
}

export function puedeGestionarAdministracionGeneral(permisos: readonly string[]): boolean {
    return ACCESO.administracionGeneral.some((permiso) => permisos.includes(permiso));
}

export function puedeAbrirRuta(
    pathname: string,
    permisos: readonly string[]
): boolean {
    const ruta = pathname.replace(/\/+$/, "") || "/";

    if (ruta === "/admin") {
        return puedeEntrarAlPanel(permisos);
    }

    if (ruta === "/admin/usuarios") {
        return cumplePermisos(permisos, ACCESO.verUsuarios);
    }

    if (ruta === "/admin/usuarios/nuevo") {
        return cumplePermisos(permisos, ACCESO.crearUsuario);
    }

    if (/^\/admin\/usuarios\/[^/]+\/editar$/.test(ruta)) {
        return cumplePermisos(permisos, ACCESO.editarUsuario);
    }

    if (ruta === "/admin/roles") {
        return cumplePermisos(permisos, ACCESO.verRoles);
    }

    if (ruta === "/admin/categorias") {
        return cumplePermisos(permisos, ACCESO.verCategorias);
    }

    if (ruta === "/admin/solicitudes-vendedor") {
        return cumplePermisos(permisos, ACCESO.verSolicitudesVendedor);
    }

    if (ruta === "/admin/general") {
        return puedeGestionarAdministracionGeneral(permisos);
    }

    return false;
}
