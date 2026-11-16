"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import BuscadorConSugerencias, { type Sugerencia } from "@/components/buscador/BuscadorConSugerencias";
import { useSesion } from "@/components/auth/SesionProvider";
import { confirmar } from "@/components/dialogos/Dialogos";
import { ApiError } from "@/lib/api";
import { formatearFechaHora } from "@/lib/pedidos";
import {
  agregarColaborador,
  listarColaboradores,
  quitarColaborador,
  sugerirUsuariosDisponibles,
} from "@/services/colaboradorService";
import type { Colaborador } from "@/types/colaborador";
import equipoStyles from "./equipo.module.css";

// Equipo de la tienda: el dueño agrega colaboradores por su nombre de usuario y
// puede quitarlos. El backend valida que el usuario no pertenezca a otra tienda.
export default function EquipoTiendaPage() {
  const { sesion } = useSesion();
  const esDueno = sesion?.vinculoTienda === "PRINCIPAL";

  const [equipo, setEquipo] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [usuario, setUsuario] = useState("");
  const [agregando, setAgregando] = useState(false);
  const [quitando, setQuitando] = useState<number | null>(null);

  const cargarEquipo = useCallback(async () => {
    try {
      setEquipo(await listarColaboradores());
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar el equipo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!esDueno) return;
    // setState solo ocurre dentro de cargarEquipo después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarEquipo();
  }, [esDueno, cargarEquipo]);

  // Aparecen todos los usuarios que coinciden; a los que no se pueden agregar se les
  // muestra el motivo, y si se eligen igual, el backend lo rechaza con ese aviso.
  async function sugerirUsuarios(texto: string): Promise<Sugerencia[]> {
    const usuarios = await sugerirUsuariosDisponibles(texto);
    return usuarios.map((disponible) => {
      const nombre = `${disponible.nombre} ${disponible.apellido}`;
      return {
        clave: disponible.usuario,
        texto: disponible.usuario,
        detalle: disponible.motivoNoDisponible
          ? `${nombre} · No disponible: ${disponible.motivoNoDisponible}`
          : nombre,
      };
    });
  }

  async function agregar(nombreUsuario: string) {
    const valor = nombreUsuario.trim();
    if (!valor || agregando) return;
    setAgregando(true);
    setError("");
    setAviso("");
    try {
      const nuevo = await agregarColaborador(valor);
      setEquipo((actual) => [...actual, nuevo]);
      setUsuario("");
      setAviso(`${nuevo.usuario} ahora es colaborador de tu tienda.`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : `No fue posible agregar a ${valor}.`);
    } finally {
      setAgregando(false);
    }
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void agregar(usuario);
  }

  function elegirUsuario(sugerencia: Sugerencia) {
    setUsuario(String(sugerencia.clave));
    void agregar(String(sugerencia.clave));
  }

  async function quitar(colaborador: Colaborador) {
    if (quitando !== null) return;
    const confirmado = await confirmar({
      titulo: `¿Quitar a ${colaborador.usuario} del equipo?`,
      mensaje: "Deja de tener acceso a Mi tienda en su próxima acción y vuelve a ser cliente.",
      textoConfirmar: "Quitar",
      textoCancelar: "Cancelar",
      peligro: true,
    });
    if (!confirmado) return;

    setQuitando(colaborador.id);
    setError("");
    setAviso("");
    try {
      await quitarColaborador(colaborador.id);
      setEquipo((actual) => actual.filter((integrante) => integrante.id !== colaborador.id));
      setAviso(`${colaborador.usuario} ya no forma parte de tu tienda.`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos quitar al colaborador.");
    } finally {
      setQuitando(null);
    }
  }

  if (!esDueno) {
    return (
      <div className={styles.card}>
        <p role="alert">Solo el dueño de la tienda puede gestionar el equipo.</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Equipo</h2>
      </div>
      
      <form onSubmit={enviar} className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="usuario-colaborador">Nombre de usuario</label>
          <BuscadorConSugerencias
            id="usuario-colaborador"
            autoComplete="off"
            valor={usuario}
            alCambiar={setUsuario}
            obtenerSugerencias={sugerirUsuarios}
            alSeleccionar={elegirUsuario}
            placeholder="Ej.: juanperez"
          />
        </div>
        <button type="submit" className={styles.buttonPrimary} disabled={agregando || !usuario.trim()}>
          {agregando ? "Agregando…" : "Agregar colaborador"}
        </button>
      </form>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {aviso && (
        <p role="status" className={equipoStyles.exito}>
          {aviso}
        </p>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol en la tienda</th>
              <th>Desde</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  Cargando equipo…
                </td>
              </tr>
            )}
            {!loading &&
              equipo.map((integrante) => (
                <tr key={integrante.id}>
                  <td>
                    <strong>{integrante.usuario}</strong>
                  </td>
                  <td>
                    {integrante.nombre} {integrante.apellido}
                    <span className={equipoStyles.secundario}>{integrante.email}</span>
                  </td>
                  <td>{integrante.tipo === "PRINCIPAL" ? "Dueño" : "Colaborador"}</td>
                  <td>{formatearFechaHora(integrante.fechaAlta)}</td>
                  <td>
                    {integrante.tipo === "SECUNDARIO" ? (
                      <button
                        type="button"
                        disabled={quitando !== null}
                        onClick={() => quitar(integrante)}
                        className={`${styles.linkAction} ${styles.linkActionDanger}`}
                      >
                        {quitando === integrante.id ? "Quitando…" : "Quitar"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            {!loading && equipo.length === 1 && (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  Todavía no agregaste colaboradores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
