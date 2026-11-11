"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SelectorFecha.module.css";

interface SelectorFechaProps {
  id: string;
  valor: string;
  alCambiar: (valor: string) => void;
  requerido?: boolean;
  // Fecha mínima seleccionable, en formato yyyy-mm-dd (opcional).
  minimo?: string;
}

const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const DIAS_SEMANA = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

function aIso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function desdeIso(iso: string): { anio: number; mes: number; dia: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { anio: Number(match[1]), mes: Number(match[2]) - 1, dia: Number(match[3]) };
}

function formatearVisible(iso: string): string {
  const fecha = desdeIso(iso);
  if (!fecha) return "";
  return `${String(fecha.dia).padStart(2, "0")}/${String(fecha.mes + 1).padStart(2, "0")}/${fecha.anio}`;
}

// Calendario desplegable propio (sin librerías externas) con los mismos colores
// que el resto de la app, para no depender del popup nativo del navegador
// (ese no se puede re-colorear con CSS).
export default function SelectorFecha({ id, valor, alCambiar, requerido, minimo }: SelectorFechaProps) {
  const hoy = new Date();
  const seleccionada = desdeIso(valor);

  const [abierto, setAbierto] = useState(false);
  const [anioVisible, setAnioVisible] = useState(seleccionada?.anio ?? hoy.getFullYear());
  const [mesVisible, setMesVisible] = useState(seleccionada?.mes ?? hoy.getMonth());
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alHacerClickFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    if (abierto) document.addEventListener("mousedown", alHacerClickFuera);
    return () => document.removeEventListener("mousedown", alHacerClickFuera);
  }, [abierto]);

  function abrir() {
    const base = seleccionada ?? { anio: hoy.getFullYear(), mes: hoy.getMonth() };
    setAnioVisible(base.anio);
    setMesVisible(base.mes);
    setAbierto(true);
  }

  function cambiarMes(delta: number) {
    let mes = mesVisible + delta;
    let anio = anioVisible;
    if (mes < 0) {
      mes = 11;
      anio -= 1;
    } else if (mes > 11) {
      mes = 0;
      anio += 1;
    }
    setMesVisible(mes);
    setAnioVisible(anio);
  }

  const celdas = useMemo(() => {
    const primerDiaSemana = new Date(anioVisible, mesVisible, 1).getDay();
    const diasDelMes = new Date(anioVisible, mesVisible + 1, 0).getDate();
    const diasMesAnterior = new Date(anioVisible, mesVisible, 0).getDate();

    const lista: { anio: number; mes: number; dia: number; delMesActual: boolean }[] = [];

    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const mesAnterior = mesVisible === 0 ? 11 : mesVisible - 1;
      const anioAnterior = mesVisible === 0 ? anioVisible - 1 : anioVisible;
      lista.push({ anio: anioAnterior, mes: mesAnterior, dia: diasMesAnterior - i, delMesActual: false });
    }

    for (let dia = 1; dia <= diasDelMes; dia++) {
      lista.push({ anio: anioVisible, mes: mesVisible, dia, delMesActual: true });
    }

    while (lista.length < 42) {
      const ultimo = lista[lista.length - 1];
      const mesSiguiente = ultimo.mes === 11 ? 0 : ultimo.mes + 1;
      const anioSiguiente = ultimo.mes === 11 ? ultimo.anio + 1 : ultimo.anio;
      const diaSiguiente = lista.filter((c) => c.mes === mesSiguiente && c.anio === anioSiguiente).length + 1;
      lista.push({ anio: anioSiguiente, mes: mesSiguiente, dia: diaSiguiente, delMesActual: false });
    }

    return lista;
  }, [anioVisible, mesVisible]);

  function elegir(iso: string) {
    if (iso && minimo && iso < minimo) return;
    alCambiar(iso);
    setAbierto(false);
  }

  const isoHoy = aIso(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  return (
    <div className={styles.contenedor} ref={contenedorRef}>
      <button
        type="button"
        id={id}
        className={styles.disparador}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-required={requerido}
      >
        <span className={valor ? undefined : styles.placeholder}>
          {valor ? formatearVisible(valor) : "dd/mm/aaaa"}
        </span>
        <svg className={styles.icono} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {abierto && (
        <div className={styles.panel} role="dialog" aria-label="Elegir fecha">
          <div className={styles.cabecera}>
            <span className={styles.mesAnio}>
              {NOMBRES_MES[mesVisible]} de {anioVisible}
            </span>
            <div className={styles.navegacion}>
              <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">
                ‹
              </button>
              <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">
                ›
              </button>
            </div>
          </div>

          <div className={styles.grillaDias}>
            {DIAS_SEMANA.map((nombre) => (
              <span key={nombre} className={styles.nombreDia}>
                {nombre}
              </span>
            ))}

            {celdas.map((celda) => {
              const iso = aIso(celda.anio, celda.mes, celda.dia);
              const esSeleccionado = valor === iso;
              const esHoy = isoHoy === iso;
              const deshabilitado = Boolean(minimo && iso < minimo);

              return (
                <button
                  type="button"
                  key={iso}
                  disabled={deshabilitado}
                  onClick={() => elegir(iso)}
                  className={[
                    styles.celda,
                    celda.delMesActual ? "" : styles.celdaOtroMes,
                    esSeleccionado ? styles.celdaSeleccionada : "",
                    esHoy && !esSeleccionado ? styles.celdaHoy : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {celda.dia}
                </button>
              );
            })}
          </div>

          <div className={styles.pie}>
            <button type="button" className={styles.enlace} onClick={() => elegir("")}>
              Borrar
            </button>
            <button type="button" className={styles.enlace} onClick={() => elegir(isoHoy)}>
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
