export const ACCESO = {
    verUsuarios: ["LIST_USUARIOS"],

    crearUsuario: [
        "LIST_USUARIOS",
        "CREATE_USUARIOS",
        "OPTIONS_ROLES",
        "CREATE_DIRECCIONES",
    ],

    editarUsuario: [
        "LIST_USUARIOS",
        "GET_USUARIOS",
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
        "UPDATE_ROLES",
        "LIST_PERMISOS",
        "ASSIGN_PERMISOS",
        "REVOKE_PERMISOS",
    ],

    editarRol: [
        "LIST_ROLES",
        "UPDATE_ROLES",
        "LIST_PERMISOS",
        "ASSIGN_PERMISOS",
        "REVOKE_PERMISOS",
    ],
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
        cumplePermisos(permisos, ACCESO.verRoles)
    );
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

    // Una sección nueva necesita su regla explícita.
    return false;
}