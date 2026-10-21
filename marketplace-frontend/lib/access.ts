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

    asignarSubcategorias: ["ASSIGN_SUBCATEGORIAS"],

    quitarSubcategorias: ["REVOKE_SUBCATEGORIAS"],

    // Panel del vendedor. Listar productos y tiendas es público en el
    // backend, por eso el acceso se define por los permisos de escritura.
    crearProducto: ["CREATE_PRODUCTOS"],
    editarProducto: ["UPDATE_PRODUCTOS"],
    eliminarProducto: ["DELETE_PRODUCTOS"],

    subirImagenes: ["CREATE_IMAGENES"],
    eliminarImagenes: ["DELETE_IMAGENES"],

    editarTienda: ["UPDATE_TIENDAS"],
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
        cumplePermisos(permisos, ACCESO.verSolicitudesVendedor)
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

    if (ruta === "/admin/categorias") {
        return cumplePermisos(permisos, ACCESO.verCategorias);
    }

    if (ruta === "/admin/solicitudes-vendedor") {
        return cumplePermisos(permisos, ACCESO.verSolicitudesVendedor);
    }

    return false;
}

export function puedeEntrarAlPanelVendedor(
    permisos: readonly string[]
): boolean {
    return (
        cumplePermisos(permisos, ACCESO.crearProducto) ||
        cumplePermisos(permisos, ACCESO.editarProducto) ||
        cumplePermisos(permisos, ACCESO.editarTienda) ||
        cumplePermisos(permisos, ACCESO.subirImagenes)
    );
}

export function puedeAbrirRutaVendedor(
    pathname: string,
    permisos: readonly string[]
): boolean {
    const ruta = pathname.replace(/\/+$/, "") || "/";

    if (ruta === "/vendedor" || ruta === "/vendedor/productos") {
        return puedeEntrarAlPanelVendedor(permisos);
    }

    if (ruta === "/vendedor/productos/nuevo") {
        return cumplePermisos(permisos, ACCESO.crearProducto);
    }

    // La edición también es donde se gestionan las imágenes del producto.
    if (/^\/vendedor\/productos\/[^/]+\/editar$/.test(ruta)) {
        return (
            cumplePermisos(permisos, ACCESO.editarProducto) ||
            cumplePermisos(permisos, ACCESO.subirImagenes)
        );
    }

    if (
        ruta === "/vendedor/tiendas" ||
        /^\/vendedor\/tiendas\/[^/]+\/editar$/.test(ruta)
    ) {
        return cumplePermisos(permisos, ACCESO.editarTienda);
    }

    return false;
}
