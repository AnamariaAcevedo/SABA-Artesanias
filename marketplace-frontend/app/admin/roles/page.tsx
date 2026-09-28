"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiFetch, apiFetchConPaginacion } from "@/lib/api";
import styles from "@/components/admin/admin.module.css";

type Rol = {
    id: number;
    nombre: string;
    activo: boolean;
};

type Permiso = {
    id: number;
    action: string;
    resource: string;
};

type Asignacion = {
    permisoId: number;
};

const acciones: Record<string, string> = {
    LIST: "Listar",
    GET: "Consultar",
    CREATE: "Crear",
    UPDATE: "Editar",
    DELETE: "Eliminar",
    OPTIONS: "Consultar opciones",
    ASSIGN: "Asignar",
    REVOKE: "Quitar",
};

// Los listados del backend son paginados.
async function obtenerTodos<T>(ruta: string): Promise<T[]> {
    const elementos: T[] = [];
    let pagina = 1;

    while (true) {
        const separador = ruta.includes("?") ? "&" : "?";
        const resultado = await apiFetchConPaginacion<T[]>(
            `${ruta}${separador}page=${pagina}&perPage=100`
        );

        elementos.push(...resultado.data);

        if (
            resultado.data.length === 0 ||
            (resultado.pagination
                ? elementos.length >= resultado.pagination.total
                : resultado.data.length < 100)
        ) {
            return elementos;
        }

        pagina++;
    }
}

function mensajeError(cause: unknown) {
    return cause instanceof Error
        ? cause.message
        : "No pudimos completar la operación.";
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [aviso, setAviso] = useState("");
    const [revision, setRevision] = useState(0);

    // undefined: listado; null: crear; Rol: editar.
    const [editor, setEditor] = useState<Rol | null | undefined>();

    useEffect(() => {
        let vigente = true;

        obtenerTodos<Rol>("/roles")
            .then((datos) => {
                if (vigente) setRoles(datos);
            })
            .catch((cause) => {
                if (vigente) setError(mensajeError(cause));
            })
            .finally(() => {
                if (vigente) setCargando(false);
            });

        return () => {
            vigente = false;
        };
    }, [revision]);

    function recargar() {
        setError("");
        setCargando(true);
        setRevision((valor) => valor + 1);
    }

    const visibles = roles.filter((rol) =>
        rol.nombre.toLocaleLowerCase().includes(
            busqueda.trim().toLocaleLowerCase()
        )
    );
    return (
        <section className={styles.card}>
            <div className={styles.sectionHeader}>
                <div>
                    <h1 className={styles.title}>Gestión de roles</h1>
                </div>

                {editor === undefined && (
                    <button
                        type="button"
                        className={styles.buttonPrimary}
                        onClick={() => {
                            setAviso("");
                            setEditor(null);
                        }}
                    >
                        + Nuevo rol
                    </button>
                )}
            </div>

            {editor !== undefined ? (
                <EditorRol
                    key={editor?.id ?? "nuevo"}
                    rol={editor}
                    cancelar={() => {
                        setEditor(undefined);
                        recargar();
                    }}
                    guardado={() => {
                        setEditor(undefined);
                        setAviso("Rol y permisos guardados correctamente.");
                        recargar();
                    }}
                />
            ) : (
                <>
                    <div className={styles.toolbar}>
                        <div className={styles.field}>
                            <label htmlFor="buscar-rol">Nombre</label>
                            <input
                                id="buscar-rol"
                                type="search"
                                placeholder="Buscar por nombre..."
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                            />
                        </div>
                    </div>

                    {aviso && (
                        <p className={styles.notice} role="status">{aviso}</p>
                    )}

                    {cargando && <p role="status">Cargando roles…</p>}

                    {error && (
                        <div className={styles.error} role="alert">
                            <p>{error}</p>
                            <button
                                type="button"
                                className={styles.buttonGhost}
                                onClick={recargar}
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!cargando && !error && (
                        <>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th scope="col">Rol</th>
                                        <th scope="col">Estado</th>
                                        <th scope="col">Acciones</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {visibles.map((rol) => (
                                        <tr key={rol.id}>
                                            <td>{rol.nombre}</td>
                                            <td>
                        <span
                            className={`${styles.badge} ${
                                rol.activo
                                    ? styles.badgeActivo
                                    : styles.badgeInactivo
                            }`}
                        >
                          {rol.activo ? "Activo" : "Inactivo"}
                        </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={styles.linkAction}
                                                    aria-label={`Editar ${rol.nombre}`}
                                                    onClick={() => {
                                                        setAviso("");
                                                        setEditor(rol);
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {visibles.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className={styles.emptyRow}>
                                                No se encontraron roles.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.pagination}>
              <span>
                {visibles.length} de {roles.length} roles
              </span>
                            </div>
                        </>
                    )}
                </>
            )}
        </section>
    );
}

function EditorRol({
                       rol,
                       cancelar,
                       guardado,
                   }: {
    rol: Rol | null;
    cancelar: () => void;
    guardado: () => void;
}) {
    const [nombre, setNombre] = useState(rol?.nombre ?? "");
    const [activo, setActivo] = useState(rol?.activo ?? true);
    const [permisos, setPermisos] = useState<Permiso[]>([]);
    const [seleccionados, setSeleccionados] = useState<Set<number>>(
        new Set()
    );
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [errorCarga, setErrorCarga] = useState("");
    const [revision, setRevision] = useState(0);

    const ocupado = useRef(false);

    // Conserva el ID si se crea el rol pero falla la asignación.
    // Así, reintentar no vuelve a crear otro rol.
    const idGuardado = useRef<number | null>(rol?.id ?? null);

    useEffect(() => {
        let vigente = true;

        Promise.all([
            obtenerTodos<Permiso>("/permisos"),
            rol
                ? obtenerTodos<Asignacion>(`/roles/${rol.id}/permisos`)
                : Promise.resolve([]),
        ])
            .then(([catalogo, asignaciones]) => {
                if (!vigente) return;

                setPermisos(catalogo);
                setSeleccionados(
                    new Set(asignaciones.map((item) => item.permisoId))
                );
            })
            .catch((cause) => {
                if (vigente) setErrorCarga(mensajeError(cause));
            })
            .finally(() => {
                if (vigente) setCargando(false);
            });

        return () => {
            vigente = false;
        };
    }, [rol, revision]);

    const grupos = permisos.reduce<Record<string, Permiso[]>>(
        (resultado, permiso) => {
            (resultado[permiso.resource] ??= []).push(permiso);
            return resultado;
        },
        {}
    );

    function cambiar(ids: number[], marcar: boolean) {
        setSeleccionados((anteriores) => {
            const nuevos = new Set(anteriores);

            for (const id of ids) {
                if (marcar) nuevos.add(id);
                else nuevos.delete(id);
            }

            return nuevos;
        });
    }

    async function guardar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (ocupado.current || cargando || errorCarga) return;

        if (!nombre.trim()) {
            setError("Ingresá un nombre para el rol.");
            return;
        }

        if (!window.confirm(
            "¿Guardar este rol y sus permisos? Los cambios afectan a sus usuarios asignados."
        )) return;

        ocupado.current = true;
        setGuardando(true);
        setError("");

        try {
            let id = idGuardado.current;

            if (id === null) {
                const nuevo = await apiFetch<Rol>("/roles", {
                    method: "POST",
                    body: JSON.stringify({ nombre: nombre.trim() }),
                });

                id = nuevo.id;
                idGuardado.current = id;
            }

            // Leer nuevamente permite reintentar un guardado parcial.
            const actuales = await obtenerTodos<Asignacion>(
                `/roles/${id}/permisos`
            );
            const idsActuales = new Set(
                actuales.map((item) => item.permisoId)
            );

            await apiFetch(`/roles/${id}`, {
                method: "PUT",
                body: JSON.stringify({ nombre: nombre.trim(), activo }),
            });

            // Primero asignamos; luego revocamos.
            for (const permisoId of seleccionados) {
                if (!idsActuales.has(permisoId)) {
                    await apiFetch(`/roles/${id}/permisos`, {
                        method: "POST",
                        body: JSON.stringify({ permisoId }),
                    });
                }
            }

            for (const permisoId of idsActuales) {
                if (!seleccionados.has(permisoId)) {
                    await apiFetch(`/roles/${id}/permisos/${permisoId}`, {
                        method: "DELETE",
                    });
                }
            }

            guardado();
        } catch (cause) {
            setError(
                `${mensajeError(cause)} Pueden haberse guardado cambios parciales. ` +
                (idGuardado.current !== null
                    ? "Podés reintentar sobre el mismo rol."
                    : "Antes de volver a crear, revisá si el rol aparece en el listado.")
            );
        } finally {
            ocupado.current = false;
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={guardar} aria-busy={cargando || guardando}>
            <h2 className={styles.pageTitle}>
                {rol ? `Editar ${rol.nombre}` : "Nuevo rol"}
            </h2>

            {cargando && <p role="status">Cargando permisos…</p>}

            {errorCarga && (
                <div className={styles.error} role="alert">
                    <p>{errorCarga}</p>
                    <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={() => {
                            setErrorCarga("");
                            setCargando(true);
                            setRevision((valor) => valor + 1);
                        }}
                    >
                        Reintentar carga
                    </button>
                </div>
            )}

            <fieldset
                disabled={cargando || guardando || !!errorCarga}
                className={styles.form}
            >
                <div className={styles.field}>
                    <label htmlFor="nombre-rol">Nombre del rol</label>
                    <input
                        id="nombre-rol"
                        value={nombre}
                        onChange={(event) => setNombre(event.target.value)}
                        required
                        maxLength={50}
                        placeholder="Por ejemplo: Ayudante"
                    />
                </div>

                <label className={styles.checkboxField}>
                    <input
                        type="checkbox"
                        checked={activo}
                        onChange={(event) => setActivo(event.target.checked)}
                    />
                    Rol activo
                </label>

                <div className={styles.rolesPermissionsHeader}>
                    <div>
                        <h3 className={styles.title}>Permisos</h3>
                        <p className={styles.pageSubtitle}>
                            {seleccionados.size} seleccionados
                        </p>
                    </div>

                    <div className={styles.rowActions}>
                        <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() =>
                                cambiar(permisos.map((permiso) => permiso.id), true)
                            }
                        >
                            Seleccionar todos
                        </button>

                        <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() =>
                                cambiar(permisos.map((permiso) => permiso.id), false)
                            }
                        >
                            Quitar selección
                        </button>
                    </div>
                </div>

                {Object.entries(grupos).map(([modulo, opciones]) => {
                    const cantidad = opciones.filter((permiso) =>
                        seleccionados.has(permiso.id)
                    ).length;

                    return (
                        <details key={modulo} className={styles.permissionGroup}>
                            <summary className={styles.permissionSummary}>
                                {modulo}
                                <span className={styles.permissionCount}>
                {cantidad}/{opciones.length}
              </span>
                            </summary>

                            <div className={styles.permissionBody}>
                                <label className={styles.checkboxField}>
                                    <input
                                        type="checkbox"
                                        checked={cantidad === opciones.length}
                                        onChange={(event) =>
                                            cambiar(
                                                opciones.map((permiso) => permiso.id),
                                                event.target.checked
                                            )
                                        }
                                    />
                                    Seleccionar todo el módulo
                                </label>

                                <div className={styles.permissionGrid}>
                                    {opciones.map((permiso) => (
                                        <label
                                            key={permiso.id}
                                            className={styles.checkboxField}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={seleccionados.has(permiso.id)}
                                                onChange={(event) =>
                                                    cambiar([permiso.id], event.target.checked)
                                                }
                                            />
                                            {acciones[permiso.action] ?? permiso.action}
                                            {" — "}
                                            {permiso.resource}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </details>
                    );
                })}

                {!cargando && permisos.length === 0 && (
                    <p className={styles.notice}>
                        No hay permisos definidos en el sistema.
                    </p>
                )}

                <button type="submit" className={styles.buttonPrimary}>
                    {guardando ? "Guardando…" : "Guardar cambios"}
                </button>
            </fieldset>

            {error && (
                <p className={styles.error} role="alert">{error}</p>
            )}

            <div className={styles.rolesFooter}>
                <button
                    type="button"
                    className={styles.buttonGhost}
                    disabled={guardando}
                    onClick={cancelar}
                >
                    Volver al listado
                </button>
            </div>
        </form>
    );
}