"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import UbicacionSelects from "@/components/admin/usuarios/UbicacionSelects";
import ContactosTienda from "@/components/mi-tienda/ContactosTienda";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import perfilStyles from "@/app/perfil/perfil.module.css";
import { ApiError, apiFetch } from "@/lib/api";
import { ubicacionTienda, type MiTienda, type MiTiendaUpdateInput } from "@/types/miTienda";

export default function DatosTiendaPage() {
  const [tienda, setTienda] = useState<MiTienda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarTienda() {
      try {
        const data = await apiFetch<MiTienda>("/mi-tienda");
        if (!cancelado) setTienda(data);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los datos de la tienda.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    cargarTienda();
    return () => {
      cancelado = true;
    };
  }, []);

  if (loading) return <p className={styles.notice}>Cargando datos de la tienda…</p>;
  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }
  if (!tienda) return null;

  return (
    <div className={miTiendaStyles.secciones}>
      <DatosTiendaForm tienda={tienda} onGuardado={setTienda} />
      <ContactosTienda />
    </div>
  );
}

function DatosTiendaForm({ tienda, onGuardado }: { tienda: MiTienda; onGuardado: (tienda: MiTienda) => void }) {
  const enviandoRef = useRef(false);

  const [nombre, setNombre] = useState(tienda.nombre);
  const [descripcion, setDescripcion] = useState(tienda.descripcion);
  const [calle, setCalle] = useState(tienda.calle);
  const [nombreEdificio, setNombreEdificio] = useState(tienda.nombreEdificio ?? "");
  const [numero, setNumero] = useState(
    tienda.nombreEdificio ? tienda.nroDepartamento ?? "" : tienda.nroCasa != null ? String(tienda.nroCasa) : "",
  );
  const hayEdificio = nombreEdificio.trim().length > 0;

  const [cambiarUbicacion, setCambiarUbicacion] = useState(false);
  const [idBarrio, setIdBarrio] = useState<number | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");
    setExito("");

    const numeroLimpio = numero.trim();

    if (!nombre.trim() || !descripcion.trim() || !calle.trim() || !numeroLimpio) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    if (!hayEdificio && (!/^\d+$/.test(numeroLimpio) || Number(numeroLimpio) > 2147483647)) {
      setError("El número de casa debe ser un número entero. Si corresponde a un local o departamento, completá el nombre del edificio.");
      return;
    }
    if (cambiarUbicacion && !idBarrio) {
      setError("Completá la ubicación hasta seleccionar un barrio.");
      return;
    }

    const datos: MiTiendaUpdateInput = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      calle: calle.trim(),
      nombreEdificio: hayEdificio ? nombreEdificio.trim() : null,
      nroCasa: hayEdificio ? null : Number(numeroLimpio),
      nroDepartamento: hayEdificio ? numeroLimpio : null,
      ...(cambiarUbicacion && idBarrio ? { idBarrio } : {}),
    };

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const actualizada = await apiFetch<MiTienda>("/mi-tienda", {
        method: "PUT",
        body: JSON.stringify(datos),
      });
      // Actualiza el nombre de la tienda que muestra el header.
      window.dispatchEvent(new Event("sesion-cambiada"));
      onGuardado(actualizada);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar los datos de la tienda.");
      enviandoRef.current = false;
      setEnviando(false);
      return;
    }
    setCambiarUbicacion(false);
    setIdBarrio(null);
    setExito("Los datos de la tienda se actualizaron correctamente.");
    enviandoRef.current = false;
    setEnviando(false);
  }

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <h2 className={styles.pageTitle}>Datos de la tienda</h2>
      <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre de la tienda</label>
          <input id="nombre" required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            required
            maxLength={255}
            className={miTiendaStyles.textarea}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            aria-describedby="descripcion-ayuda"
          />
          <small id="descripcion-ayuda" className={miTiendaStyles.ayuda}>
            {descripcion.length}/255 caracteres
          </small>
        </div>

        <h3 className={styles.sectionSubtitle}>Dirección</h3>
        {cambiarUbicacion ? (
          <>
            <UbicacionSelects onBarrioChange={setIdBarrio} />
            <div>
              <button
                type="button"
                className={styles.linkAction}
                onClick={() => {
                  setCambiarUbicacion(false);
                  setIdBarrio(null);
                }}
              >
                Mantener la ubicación actual
              </button>
            </div>
          </>
        ) : (
          <div className={perfilStyles.ubicacionActual}>
            <span>{ubicacionTienda(tienda)}</span>
            <button type="button" className={styles.buttonOutline} onClick={() => setCambiarUbicacion(true)}>
              Cambiar ubicación
            </button>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="calle">Calle</label>
            <input id="calle" required maxLength={100} value={calle} onChange={(e) => setCalle(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="numeroDireccion">{hayEdificio ? "Número de local o departamento" : "Número de casa"}</label>
            <input
              id="numeroDireccion"
              required
              inputMode={hayEdificio ? "text" : "numeric"}
              maxLength={hayEdificio ? 50 : 10}
              value={numero}
              onChange={(e) => setNumero(hayEdificio ? e.target.value : e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="nombreEdificio">Edificio o centro comercial (opcional)</label>
          <input id="nombreEdificio" maxLength={100} value={nombreEdificio} onChange={(e) => setNombreEdificio(e.target.value)} />
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {exito && (
          <p role="status" className={perfilStyles.exito}>
            {exito}
          </p>
        )}

        <div className={styles.formActions}>
          <button type="submit" disabled={enviando} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
