"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import { ApiError } from "@/lib/api";
import { crearCupon } from "@/services/cuponService";
import SelectorFecha from "@/components/calendario/SelectorFecha";

function hoyIso(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

export default function CuponForm() {
  const router = useRouter();
  const enviandoRef = useRef(false);

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    if (!nombre.trim() || !codigo.trim() || !porcentaje || !fechaInicio || !fechaFin) {
      setError("Completá todos los campos.");
      return;
    }

    const porcentajeNumero = Number(porcentaje);
    if (porcentajeNumero <= 0 || porcentajeNumero > 100) {
      setError("El porcentaje debe estar entre 0 y 100%.");
      return;
    }

    if (fechaInicio < hoyIso()) {
      setError("La fecha de inicio no puede estar en el pasado.");
      return;
    }

    if (fechaFin < fechaInicio) {
      setError("La fecha de fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      await crearCupon({
        nombre: nombre.trim(),
        codigo: codigo.trim(),
        porcentaje: porcentajeNumero,
        fechaInicio,
        fechaFin,
      });
      router.push("/mi-tienda/cupones");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos crear el cupón.");
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
        <h3 className={styles.sectionSubtitle}>Datos del cupón</h3>

        <div className={styles.field}>
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label htmlFor="codigo">Código</label>
          <input
            id="codigo"
            required
            maxLength={50}
            placeholder="Ej.: VERANO20"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          />
        </div>

        <div className={styles.rowQuad}>
          <div className={styles.field}>
            <label htmlFor="porcentaje">Porcentaje de descuento</label>
            <input
              id="porcentaje"
              required
              inputMode="numeric"
              maxLength={3}
              placeholder="20"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="fechaInicio">Fecha de inicio</label>
            <SelectorFecha id="fechaInicio" requerido valor={fechaInicio} alCambiar={setFechaInicio} minimo={hoyIso()} />
          </div>
          <div className={styles.field}>
            <label htmlFor="fechaFin">Fecha de fin</label>
            <SelectorFecha id="fechaFin" requerido valor={fechaFin} alCambiar={setFechaFin} minimo={fechaInicio || undefined} />
          </div>
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.buttonOutline} onClick={() => router.push("/mi-tienda/cupones")} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : "Crear cupón"}
          </button>
        </div>
      </form>
    </div>
  );
}
