"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from "react";
import styles from "./buscador.module.css";

export type Sugerencia = {
  clave: string | number;
  texto: string;
  detalle?: string;
};

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  valor: string;
  alCambiar: (valor: string) => void;
  // Devuelve las coincidencias parecidas al texto escrito (se llama con demora).
  obtenerSugerencias: (texto: string) => Promise<Sugerencia[]> | Sugerencia[];
  alSeleccionar: (sugerencia: Sugerencia) => void;
  // Caracteres mínimos antes de sugerir (por defecto 2; para números conviene 1).
  minimo?: number;
  claseContenedor?: string;
};

const DEMORA_MS = 250;

// Campo de búsqueda con sugerencias: mientras se escribe muestra coincidencias
// parecidas, y Enter (sin una sugerencia marcada) envía el formulario que lo
// contiene para aplicar la búsqueda completa. Se navega con ↑ ↓, Enter y Esc.
export default function BuscadorConSugerencias({
  valor,
  alCambiar,
  obtenerSugerencias,
  alSeleccionar,
  minimo = 2,
  claseContenedor = "",
  onKeyDown,
  onBlur,
  ...inputProps
}: Props) {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const [enfocado, setEnfocado] = useState(false);
  const solicitud = useRef(0);
  const obtener = useRef(obtenerSugerencias);
  const id = useId();

  useEffect(() => {
    obtener.current = obtenerSugerencias;
  });

  const texto = valor.trim();
  const buscar = enfocado && texto.length >= minimo;

  useEffect(() => {
    if (!buscar) return;
    const numero = ++solicitud.current;

    const temporizador = window.setTimeout(async () => {
      try {
        const resultado = await obtener.current(texto);
        if (numero !== solicitud.current) return;
        setSugerencias(resultado.slice(0, 6));
        setActiva(-1);
        setAbierto(true);
      } catch {
        if (numero === solicitud.current) setSugerencias([]);
      }
    }, DEMORA_MS);

    return () => window.clearTimeout(temporizador);
  }, [buscar, texto]);

  const visible = abierto && buscar;

  function cerrar() {
    solicitud.current++;
    setAbierto(false);
    setActiva(-1);
  }

  function elegir(sugerencia: Sugerencia) {
    cerrar();
    alSeleccionar(sugerencia);
  }

  return (
    <div className={`${styles.contenedor} ${claseContenedor}`}>
      <input
        {...inputProps}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={`${id}-lista`}
        aria-activedescendant={visible && activa >= 0 ? `${id}-opcion-${activa}` : undefined}
        autoComplete="off"
        value={valor}
        onChange={(event) => {
          alCambiar(event.target.value);
          setAbierto(true);
        }}
        onFocus={() => setEnfocado(true)}
        onBlur={(event) => {
          setEnfocado(false);
          cerrar();
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (visible && sugerencias.length > 0 && event.key === "ArrowDown") {
            event.preventDefault();
            setActiva((actual) => (actual + 1) % sugerencias.length);
          } else if (visible && sugerencias.length > 0 && event.key === "ArrowUp") {
            event.preventDefault();
            setActiva((actual) => (actual <= 0 ? sugerencias.length - 1 : actual - 1));
          } else if (event.key === "Enter") {
            if (visible && activa >= 0) {
              event.preventDefault();
              elegir(sugerencias[activa]);
            } else {
              // Búsqueda exacta: deja que el formulario se envíe.
              cerrar();
            }
          } else if (event.key === "Escape" && visible) {
            event.preventDefault();
            cerrar();
          }
          onKeyDown?.(event);
        }}
      />

      {visible && (
        <ul id={`${id}-lista`} role="listbox" className={styles.lista}>
          {sugerencias.length === 0 ? (
            <li className={styles.vacio} role="presentation">
              Sin coincidencias. Presioná Enter para buscar.
            </li>
          ) : (
            sugerencias.map((sugerencia, indice) => (
              <li
                key={sugerencia.clave}
                id={`${id}-opcion-${indice}`}
                role="option"
                aria-selected={indice === activa}
                className={indice === activa ? `${styles.opcion} ${styles.activa}` : styles.opcion}
                // mousedown evita que el blur del input cierre la lista antes del clic.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiva(indice)}
                onClick={() => elegir(sugerencia)}
              >
                <span className={styles.texto}>{sugerencia.texto}</span>
                {sugerencia.detalle && <span className={styles.detalle}>{sugerencia.detalle}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// Compara sin distinguir mayúsculas ni tildes ("nanduti" encuentra "Ñandutí").
export function normalizarTexto(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase()
    .trim();
}

export function coincide(texto: string, busqueda: string): boolean {
  return normalizarTexto(texto).includes(normalizarTexto(busqueda));
}
