"use client";

import styles from "@/components/admin/admin.module.css";
import {
    resolverModulos,
    type CapacidadResuelta,
} from "@/lib/capacidades";
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

    const disponibles = modulos
        .flatMap((modulo) => modulo.capacidades)
        .filter((capacidad) => capacidad.disponible);

    function completa(capacidad: CapacidadResuelta) {
        return (
            capacidad.disponible &&
            capacidad.ids.every((id) => seleccionados.has(id))
        );
    }

    function cambiar(
        objetivos: CapacidadResuelta[],
        marcar: boolean
    ) {
        const habilitados = objetivos.filter(
            (capacidad) => capacidad.disponible
        );

        const nuevos = new Set(seleccionados);

        if (marcar) {
            // Incluye los permisos necesarios para cada acción.
            for (const capacidad of habilitados) {
                for (const id of capacidad.ids) {
                    nuevos.add(id);
                }
            }

            onChange(nuevos);
            return;
        }

        const capacidadesAQuitar = new Set(
            habilitados.map((capacidad) => capacidad.id)
        );

        // Una capacidad depende de otra cuando necesita todos
        // sus permisos, no simplemente un permiso compartido.
        let huboCambios = true;

        while (huboCambios) {
            huboCambios = false;

            for (const capacidad of disponibles) {
                if (capacidadesAQuitar.has(capacidad.id)) {
                    continue;
                }

                const dependeDeUnaEliminada = disponibles.some(
                    (base) =>
                        capacidadesAQuitar.has(base.id) &&
                        base.ids.length > 0 &&
                        base.ids.every((id) =>
                            capacidad.ids.includes(id)
                        )
                );

                if (dependeDeUnaEliminada) {
                    capacidadesAQuitar.add(capacidad.id);
                    huboCambios = true;
                }
            }
        }

        // Conservamos las otras capacidades completas.
        const conservar = disponibles.filter(
            (capacidad) =>
                !capacidadesAQuitar.has(capacidad.id) &&
                capacidad.ids.every((id) =>
                    seleccionados.has(id)
                )
        );

        // Quitamos la capacidad elegida y sus dependientes.
        for (const capacidad of disponibles) {
            if (!capacidadesAQuitar.has(capacidad.id)) {
                continue;
            }

            for (const id of capacidad.ids) {
                nuevos.delete(id);
            }
        }

        // Conservamos permisos auxiliares compartidos por
        // otras acciones que siguen seleccionadas.
        for (const capacidad of conservar) {
            for (const id of capacidad.ids) {
                nuevos.add(id);
            }
        }

        onChange(nuevos);
    }

    const idsRepresentados = new Set(
        disponibles.flatMap((capacidad) => capacidad.ids)
    );

    const adicionales = [...seleccionados].filter(
        (id) => !idsRepresentados.has(id)
    ).length;

    const cantidad = disponibles.filter(completa).length;

    return (
        <>
            <div className={styles.rolesPermissionsHeader}>
                <div>
                    <h3 className={styles.title}>Permisos del rol</h3>
                    <p className={styles.pageSubtitle}>
                        {cantidad} de {disponibles.length} capacidades
                        seleccionadas
                    </p>
                </div>

                <div className={styles.rowActions}>
                    <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={() => cambiar(disponibles, true)}
                    >
                        Seleccionar todos
                    </button>

                    <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={() => cambiar(disponibles, false)}
                    >
                        Quitar selección
                    </button>
                </div>
            </div>

            <p className={styles.pageSubtitle}>
                Al seleccionar una acción, se incluyen sus permisos necesarios.
                Al quitar un acceso, también se quitan las acciones que dependen
                de él.
            </p>

            {adicionales > 0 && (
                <p className={styles.notice}>
                    Este rol tiene {adicionales} permisos adicionales
                    que no se editan en esta vista. Se conservarán al
                    guardar.
                </p>
            )}

            {modulos.map((modulo) => {
                const opciones = modulo.capacidades.filter(
                    (capacidad) => capacidad.disponible
                );

                // No mostramos grupos sin capacidades disponibles.
                if (opciones.length === 0) return null;

                const elegidas = opciones.filter(completa).length;

                const haySeleccion = opciones.some((capacidad) =>
                    capacidad.ids.some((id) => seleccionados.has(id))
                );

                return (
                    <details
                        key={modulo.id}
                        className={styles.permissionGroup}
                    >
                        <summary className={styles.permissionSummary}>
                            {modulo.nombre}
                            <span className={styles.permissionCount}>
                                {elegidas}/{opciones.length}
                            </span>
                        </summary>

                        <div className={styles.permissionBody}>
                            <label className={styles.checkboxField}>
                                <input
                                    type="checkbox"
                                    checked={elegidas === opciones.length}
                                    ref={(elemento) => {
                                        if (elemento) {
                                            elemento.indeterminate =
                                                haySeleccion &&
                                                elegidas < opciones.length;
                                        }
                                    }}
                                    onChange={(event) =>
                                        cambiar(
                                            opciones,
                                            event.target.checked
                                        )
                                    }
                                />
                                Seleccionar todo el módulo
                            </label>

                            <div className={styles.permissionGrid}>
                                {opciones.map((capacidad) => {
                                    const marcada = completa(capacidad);

                                    const parcial =
                                        !marcada &&
                                        capacidad.ids.some((id) =>
                                            seleccionados.has(id)
                                        );

                                    return (
                                        <label
                                            key={capacidad.id}
                                            className={styles.checkboxField}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={marcada}
                                                ref={(elemento) => {
                                                    if (elemento) {
                                                        elemento.indeterminate =
                                                            parcial;
                                                    }
                                                }}
                                                onChange={(event) =>
                                                    cambiar(
                                                        [capacidad],
                                                        event.target.checked
                                                    )
                                                }
                                            />

                                            <span>
                                                {capacidad.nombre}
                                                {parcial &&
                                                    " (selección parcial)"}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </details>
                );
            })}

            {disponibles.length === 0 && (
                <p className={styles.notice}>
                    No hay capacidades disponibles con los permisos
                    cargados actualmente.
                </p>
            )}
        </>
    );
}