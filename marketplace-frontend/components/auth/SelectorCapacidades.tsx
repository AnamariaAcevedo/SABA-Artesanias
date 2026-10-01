"use client";

import styles from "@/components/admin/admin.module.css";
import { resolverModulos } from "@/lib/capacidades";
import type { Permiso } from "@/lib/permisos";

type Props = {
    permisos: Permiso[];
    seleccionados: Set<number>;
    onChange: (seleccionados: Set<number>) => void;
};

export default function SelectorCapacidades({
                                                permisos,
                                                seleccionados,
                                                onChange,
                                            }: Props) {
    const modulos = resolverModulos(permisos);

    const idsDisponibles = [
        ...new Set(
            modulos.flatMap((modulo) =>
                modulo.capacidades.flatMap((permiso) => permiso.ids)
            )
        ),
    ];

    const idsConocidos = new Set(idsDisponibles);

    const cantidad = idsDisponibles.filter((id) =>
        seleccionados.has(id)
    ).length;

    const adicionales = [...seleccionados].filter(
        (id) => !idsConocidos.has(id)
    ).length;

    function cambiar(ids: number[], marcar: boolean) {
        const nuevos = new Set(seleccionados);

        for (const id of ids) {
            if (marcar) {
                nuevos.add(id);
            } else {
                nuevos.delete(id);
            }
        }

        onChange(nuevos);
    }

    return (
        <>
            <div className={styles.rolesPermissionsHeader}>
                <div>
                    <h3 className={styles.title}>Permisos</h3>
                    <p className={styles.pageSubtitle}>
                        {cantidad} de {idsDisponibles.length} seleccionados
                    </p>
                </div>

                <div className={styles.rowActions}>
                    <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={() => cambiar(idsDisponibles, true)}
                    >
                        Seleccionar todos
                    </button>

                    <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={() => cambiar(idsDisponibles, false)}
                    >
                        Quitar selección
                    </button>
                </div>
            </div>

            {adicionales > 0 && (
                <p className={styles.notice}>
                    Hay {adicionales} permisos asignados que no aparecen
                    en el catálogo recibido. Se conservarán al guardar.
                </p>
            )}

            {modulos.map((modulo) => {
                const ids = modulo.capacidades.flatMap(
                    (permiso) => permiso.ids
                );

                const elegidos = ids.filter((id) =>
                    seleccionados.has(id)
                ).length;

                return (
                    <details
                        key={modulo.id}
                        className={styles.permissionGroup}
                    >
                        <summary className={styles.permissionSummary}>
                            {modulo.nombre}

                            <span className={styles.permissionCount}>
                                {elegidos}/{ids.length}
                            </span>
                        </summary>

                        <div className={styles.permissionBody}>
                            <div className={styles.rowActions}>
                                <button
                                    type="button"
                                    className={styles.buttonGhost}
                                    onClick={() => cambiar(ids, true)}
                                >
                                    Seleccionar módulo
                                </button>

                                <button
                                    type="button"
                                    className={styles.buttonGhost}
                                    onClick={() => cambiar(ids, false)}
                                >
                                    Quitar selección
                                </button>
                            </div>

                            <div className={styles.permissionGrid}>
                                {modulo.capacidades.map((permiso) => {
                                    const id = permiso.ids[0];

                                    return (
                                        <label
                                            key={permiso.id}
                                            className={styles.checkboxField}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={seleccionados.has(id)}
                                                onChange={(event) =>
                                                    cambiar(
                                                        [id],
                                                        event.target.checked
                                                    )
                                                }
                                            />

                                            {permiso.nombre}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </details>
                );
            })}

            {modulos.length === 0 && (
                <p className={styles.notice}>
                    No hay permisos disponibles.
                </p>
            )}
        </>
    );
}