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

    verPedidos: ["LIST_PEDIDOS"],

    // Datos propios: actúan sobre la tienda del usuario o sobre sus compras. Los
    // de arriba son de administración y actúan sobre los datos de todas las tiendas.
    verMiTienda: ["LIST_MI_TIENDA"],
    editarMiTienda: ["UPDATE_MI_TIENDA"],
    verMisProductos: ["LIST_MIS_PRODUCTOS"],
    crearMisProductos: ["CREATE_MIS_PRODUCTOS"],
    editarMisProductos: ["UPDATE_MIS_PRODUCTOS"],
    eliminarMisProductos: ["DELETE_MIS_PRODUCTOS"],
    verMisContactos: ["LIST_MIS_CONTACTOS"],
    crearMisContactos: ["CREATE_MIS_CONTACTOS"],
    editarMisContactos: ["UPDATE_MIS_CONTACTOS"],
    eliminarMisContactos: ["DELETE_MIS_CONTACTOS"],
    verPedidosTienda: ["LIST_PEDIDOS_TIENDA"],
    gestionarPedidosTienda: ["UPDATE_PEDIDOS_TIENDA"],
    verMisPublicaciones: ["LIST_MIS_PUBLICACIONES"],
    crearMisPublicaciones: ["CREATE_MIS_PUBLICACIONES"],
    editarMisPublicaciones: ["UPDATE_MIS_PUBLICACIONES"],
    eliminarMisPublicaciones: ["DELETE_MIS_PUBLICACIONES"],
    moderarComentarios: ["DELETE_COMENTARIOS_TIENDA"],
    comprar: ["CREATE_MIS_COMPRAS"],
    verMisCompras: ["LIST_MIS_COMPRAS"],
    cancelarMisCompras: ["UPDATE_MIS_COMPRAS"],
    verMiSolicitud: ["LIST_MI_SOLICITUD"],

    administracionGeneral: [
        "LIST_PRODUCTOS", "CREATE_PRODUCTOS", "UPDATE_PRODUCTOS", "DELETE_PRODUCTOS",
        "LIST_TIENDAS", "CREATE_TIENDAS", "UPDATE_TIENDAS", "DELETE_TIENDAS",
        "LIST_CONTACTOS", "CREATE_CONTACTOS", "UPDATE_CONTACTOS", "DELETE_CONTACTOS",
        "LIST_TIPOS_CONTACTO", "CREATE_TIPOS_CONTACTO", "UPDATE_TIPOS_CONTACTO", "DELETE_TIPOS_CONTACTO",
    ],

    asignarSubcategorias: ["ASSIGN_SUBCATEGORIAS"],

    quitarSubcategorias: ["REVOKE_SUBCATEGORIAS"],

    // Países, departamentos, ciudades y barrios: el backend los protege con
    // los permisos de DIRECCIONES.
    verUbicaciones: ["LIST_DIRECCIONES"],
    crearUbicaciones: ["CREATE_DIRECCIONES"],
    editarUbicaciones: ["UPDATE_DIRECCIONES"],
    eliminarUbicaciones: ["DELETE_DIRECCIONES"],
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
        cumplePermisos(permisos, ACCESO.verPedidos) ||
        puedeGestionarAdministracionGeneral(permisos) ||
        cumplePermisos(permisos, ACCESO.verUbicaciones)
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

    if (ruta === "/admin/pedidos") {
        return cumplePermisos(permisos, ACCESO.verPedidos);
    }

    if (ruta === "/admin/general") {
        return puedeGestionarAdministracionGeneral(permisos);
    }

    if (ruta === "/admin/ubicaciones") {
        return cumplePermisos(permisos, ACCESO.verUbicaciones);
    }

    return false;
}
