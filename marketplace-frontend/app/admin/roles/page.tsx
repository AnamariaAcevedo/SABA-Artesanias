"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiFetch, apiFetchConPaginacion } from "@/lib/api";
import styles from "@/components/admin/admin.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { ACCESO } from "@/lib/access";
import type { Permiso } from "@/lib/permisos";
import { resolverModulos } from "@/lib/capacidades";
import SelectorCapacidades from "@/components/auth/SelectorCapacidades";

type Rol = {
    id: number;
    nombre: string;
    activo: boolean;
};

type Asignacion = {
    permisoId: number;
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
                    <ConPermiso permisos={ACCESO.crearRol}>
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
                    </ConPermiso>
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
                                                <ConPermiso permisos={ACCESO.editarRol}>
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
                                                </ConPermiso>
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
            const idsActuales = new Set(
                rol
                    ? (await obtenerTodos<Asignacion>(`/roles/${rol.id}/permisos`))
                        .map((item) => item.permisoId)
                    : []
            );

            const idsEditables = new Set(
                resolverModulos(permisos)
                    .flatMap((modulo) => modulo.capacidades)
                    .filter((capacidad) => capacidad.disponible)
                    .flatMap((capacidad) => capacidad.ids)
            );

            const permisoIdsAgregar = [...seleccionados].filter(
                (permisoId) =>
                    idsEditables.has(permisoId) && !idsActuales.has(permisoId)
            );

            const permisoIdsQuitar = [...idsActuales].filter(
                (permisoId) =>
                    idsEditables.has(permisoId) && !seleccionados.has(permisoId)
            );

            // El backend crea/actualiza el rol y aplica estos cambios de
            // permisos en una sola transacción: o se guarda todo, o nada.
            if (rol) {
                await apiFetch(`/roles/${rol.id}/completo`, {
                    method: "PUT",
                    body: JSON.stringify({
                        nombre: nombre.trim(),
                        activo,
                        permisoIdsAgregar,
                        permisoIdsQuitar,
                    }),
                });
            } else {
                await apiFetch("/roles/completo", {
                    method: "POST",
                    body: JSON.stringify({
                        nombre: nombre.trim(),
                        activo,
                        permisoIdsAgregar,
                    }),
                });
            }

            guardado();
        } catch (cause) {
            setError(mensajeError(cause));
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

                <SelectorCapacidades
                    permisos={permisos}
                    seleccionados={seleccionados}
                    onChange={setSeleccionados}
                />

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