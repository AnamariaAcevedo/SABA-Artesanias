"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./ubicacion.module.css";

type Opcion = {
    id: number;
    nombre: string;
};

function useOpciones(ruta: string | null) {
    const [opciones, setOpciones] = useState<Opcion[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function cargar() {
            setOpciones([]);
            setError("");

            if (!ruta) {
                setCargando(false);
                return;
            }

            setCargando(true);

            try {
                const api = process.env.NEXT_PUBLIC_API_URL;
                if (!api) throw new Error("Falta configurar la conexión al servidor.");

                const acumuladas: Opcion[] = [];
                let pagina = 1;

                // Tus endpoints son paginados: cargar todas las páginas.
                while (true) {
                    const url = new URL(`${api.replace(/\/$/, "")}/${ruta}`);
                    url.searchParams.set("page", String(pagina));
                    url.searchParams.set("perPage", "100");

                    const respuesta = await fetch(url, {
                        signal: controller.signal,
                    });

                    if (!respuesta.ok) {
                        throw new Error("No se pudieron cargar las ubicaciones.");
                    }

                    const resultado = await respuesta.json();

                    if (!resultado.success || !Array.isArray(resultado.data)) {
                        throw new Error("El servidor devolvió una respuesta inesperada.");
                    }

                    acumuladas.push(...resultado.data);

                    const total = resultado.pagination?.total;

                    if (
                        resultado.data.length === 0 ||
                        (typeof total === "number"
                            ? acumuladas.length >= total
                            : resultado.data.length < 100)
                    ) {
                        break;
                    }

                    pagina++;
                }

                if (!controller.signal.aborted) {
                    setOpciones(acumuladas);
                }
            } catch (cause) {
                if (!controller.signal.aborted) {
                    setError(
                        cause instanceof Error
                            ? cause.message
                            : "No se pudieron cargar las ubicaciones."
                    );
                }
            } finally {
                if (!controller.signal.aborted) setCargando(false);
            }
        }

        void cargar();
        return () => controller.abort();
    }, [ruta, intento]);

    return {
        opciones,
        cargando,
        error,
        reintentar: () => setIntento((valor) => valor + 1),
    };
}

type ColumnaProps = {
    etiqueta: string;
    ruta: string;
    seleccionado?: Opcion;
    elegir: (opcion: Opcion) => void;
};

function Columna({ etiqueta, ruta, seleccionado, elegir }: ColumnaProps) {
    const { opciones, cargando, error, reintentar } = useOpciones(ruta);
    return (
        <section className={styles.columna} aria-label={etiqueta} aria-busy={cargando}>
            <h3>{etiqueta}</h3>
            {cargando && <p role="status">Cargando…</p>}
            {error && <div role="alert"><p>{error}</p><button type="button" className={styles.reintentar} onClick={reintentar}>Reintentar</button></div>}
            {!cargando && !error && opciones.length === 0 && <p>No hay opciones disponibles.</p>}
            <ul>
                {opciones.map((opcion) => (
                    <li key={opcion.id}>
                        <button type="button" className={styles.opcion} aria-pressed={seleccionado?.id === opcion.id}
                            onClick={() => elegir(opcion)}>
                            <span>{opcion.nombre}</span><span aria-hidden="true">{etiqueta === "Barrio" ? "✓" : "›"}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function UbicacionFields({ onSelectionChange }: { onSelectionChange?: () => void } = {}) {
    const [abierto, setAbierto] = useState(false);
    const [seleccion, setSeleccion] = useState<Opcion[]>([]);
    const contenedor = useRef<HTMLDivElement>(null);
    const boton = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const id = useId();
    const [pais, departamento, ciudad, barrio] = seleccion;
    const resumen = seleccion.map((opcion) => opcion.nombre).join(" / ");

    useEffect(() => {
        if (!abierto) return;
        const cerrarFuera = (event: PointerEvent) => {
            if (!contenedor.current?.contains(event.target as Node)) setAbierto(false);
        };
        document.addEventListener("pointerdown", cerrarFuera);
        return () => document.removeEventListener("pointerdown", cerrarFuera);
    }, [abierto]);

    useEffect(() => {
        if (abierto) panel.current?.focus();
    }, [abierto]);

    function cerrar() {
        setAbierto(false);
        boton.current?.focus();
    }

    function elegir(nivel: number, opcion: Opcion) {
        onSelectionChange?.();
        setSeleccion((actual) => [...actual.slice(0, nivel), opcion]);
        if (nivel === 3) cerrar();
    }

    return (
        <div ref={contenedor} className={styles.ubicacion}
            onBlur={(event) => {
                if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setAbierto(false);
            }}
            onKeyDown={(event) => {
                if (event.key === "Escape" && abierto) { event.preventDefault(); cerrar(); }
            }}>
            <label htmlFor={`${id}-boton`}>Ubicación:</label>
            <button ref={boton} id={`${id}-boton`} type="button" className={styles.campo}
                aria-expanded={abierto} aria-controls={`${id}-panel`}
                onClick={() => setAbierto(!abierto)}>
                <span>{resumen || "Seleccioná tu ubicación"}{resumen && !barrio ? " — completar" : ""}</span>
                <span aria-hidden="true">{abierto ? "▴" : "▾"}</span>
            </button>
            {seleccion.map((opcion, nivel) => (
                <input key={nivel} type="hidden" name={["idPais", "idDepartamento", "idCiudad", "idBarrio"][nivel]} value={opcion.id} />
            ))}
            {abierto && (
                <div ref={panel} tabIndex={-1} id={`${id}-panel`} className={styles.panel} role="region" aria-label="Elegir ubicación">
                    <div className={styles.cabecera}>
                        <p>Elegí país, departamento, ciudad y barrio.</p>
                        <button type="button" onClick={cerrar} aria-label="Cerrar ubicación">✕</button>
                    </div>
                    <div className={styles.columnas}>
                        <Columna etiqueta="País" ruta="paises" seleccionado={pais} elegir={(opcion) => elegir(0, opcion)} />
                        {pais && <Columna key={`departamento-${pais.id}`} etiqueta="Departamento" ruta={`departamentos?idPais=${pais.id}`}
                            seleccionado={departamento} elegir={(opcion) => elegir(1, opcion)} />}
                        {departamento && <Columna key={`ciudad-${departamento.id}`} etiqueta="Ciudad" ruta={`ciudades?idDepartamento=${departamento.id}`}
                            seleccionado={ciudad} elegir={(opcion) => elegir(2, opcion)} />}
                        {ciudad && <Columna key={`barrio-${ciudad.id}`} etiqueta="Barrio" ruta={`barrios?idCiudad=${ciudad.id}`}
                            seleccionado={barrio} elegir={(opcion) => elegir(3, opcion)} />}
                    </div>
                </div>
            )}
            <span className={styles.estado} role="status">{barrio ? `Ubicación seleccionada: ${resumen}` : ""}</span>
        </div>
    );
}
