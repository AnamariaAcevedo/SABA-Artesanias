"use client";

import { useEffect, useState } from "react";
import styles from "./auth.module.css";

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

type SelectorProps = {
    nombre: string;
    etiqueta: string;
    ruta: string | null;
    valor: string;
    onChange: (valor: string) => void;
};

function Selector({
                      nombre,
                      etiqueta,
                      ruta,
                      valor,
                      onChange,
                  }: SelectorProps) {
    const { opciones, cargando, error, reintentar } = useOpciones(ruta);

    const mensaje = !ruta
        ? "Elegí primero el campo anterior"
        : cargando
            ? "Cargando…"
            : error
                ? "No disponible"
                : opciones.length === 0
                    ? "Sin opciones disponibles"
                    : `Seleccioná ${etiqueta.toLowerCase()}`;

    return (
        <div className={styles.field}>
            <label htmlFor={nombre}>{etiqueta}:</label>

            <select
                id={nombre}
                name={nombre}
                value={valor}
                onChange={(event) => onChange(event.target.value)}
                disabled={!ruta || cargando || !!error || opciones.length === 0}
                aria-busy={cargando}
                aria-describedby={error ? `${nombre}-error` : undefined}
                required
            >
                <option value="">{mensaje}</option>

                {opciones.map((opcion) => (
                    <option key={opcion.id} value={opcion.id}>
                        {opcion.nombre}
                    </option>
                ))}
            </select>

            {error && (
                <div id={`${nombre}-error`} className={styles.error} role="alert">
                    <p>{error}</p>
                    <button type="button" onClick={reintentar}>
                        Reintentar
                    </button>
                </div>
            )}
        </div>
    );
}

export default function UbicacionFields() {
    const [idPais, setIdPais] = useState("");
    const [idDepartamento, setIdDepartamento] = useState("");
    const [idCiudad, setIdCiudad] = useState("");
    const [idBarrio, setIdBarrio] = useState("");

    return (
        <fieldset>
            <legend>Ubicación</legend>

            <div className={styles.row}>
                <Selector
                    nombre="idPais"
                    etiqueta="País"
                    ruta="paises"
                    valor={idPais}
                    onChange={(valor) => {
                        setIdPais(valor);
                        setIdDepartamento("");
                        setIdCiudad("");
                        setIdBarrio("");
                    }}
                />

                <Selector
                    key={`departamento-${idPais}`}
                    nombre="idDepartamento"
                    etiqueta="Departamento"
                    ruta={idPais ? `departamentos?idPais=${idPais}` : null}
                    valor={idDepartamento}
                    onChange={(valor) => {
                        setIdDepartamento(valor);
                        setIdCiudad("");
                        setIdBarrio("");
                    }}
                />

                <Selector
                    key={`ciudad-${idDepartamento}`}
                    nombre="idCiudad"
                    etiqueta="Ciudad"
                    ruta={
                        idDepartamento
                            ? `ciudades?idDepartamento=${idDepartamento}`
                            : null
                    }
                    valor={idCiudad}
                    onChange={(valor) => {
                        setIdCiudad(valor);
                        setIdBarrio("");
                    }}
                />

                <Selector
                    key={`barrio-${idCiudad}`}
                    nombre="idBarrio"
                    etiqueta="Barrio"
                    ruta={idCiudad ? `barrios?idCiudad=${idCiudad}` : null}
                    valor={idBarrio}
                    onChange={setIdBarrio}
                />
            </div>
        </fieldset>
    );
}