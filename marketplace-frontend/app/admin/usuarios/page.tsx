"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import { ApiError, apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { Pagination } from "@/types/api";
import type { Usuario } from "@/types/usuario";

type FiltroActivo = "todos" | "activos" | "inactivos";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState("");
  const [nombreBuscado, setNombreBuscado] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);

  const perPage = 10;

  // No resetea `loading` a true antes del fetch: React marca como riesgo de
  // renders en cascada llamar a setState de forma síncrona dentro de un efecto.
  // La carga inicial ya arranca en `loading = true`; los refetch posteriores
  // actualizan la tabla sin parpadeo de "Cargando...".
  const cargarUsuarios = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (nombreBuscado.trim()) params.set("nombre", nombreBuscado.trim());
      if (filtroActivo !== "todos") params.set("activo", String(filtroActivo === "activos"));

      const { data, pagination: paginacion } = await apiFetchConPaginacion<Usuario[]>(
        `/usuarios?${params.toString()}`,
      );
      setUsuarios(data);
      setPagination(paginacion);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [page, nombreBuscado, filtroActivo]);

  useEffect(() => {
    // Refetch intencional al cambiar página/filtros; setState solo ocurre
    // dentro de cargarUsuarios después de un await real.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuarios();
  }, [cargarUsuarios]);

  function buscar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setNombreBuscado(nombre);
  }

  async function alternarActivo(usuarioSeleccionado: Usuario) {
    setAccionEnCurso(usuarioSeleccionado.id);
    setError("");
    try {
      await apiFetch(`/usuarios/${usuarioSeleccionado.id}`, {
        method: "PUT",
        body: JSON.stringify({ activo: !usuarioSeleccionado.activo }),
      });
      await cargarUsuarios();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos actualizar el usuario.");
    } finally {
      setAccionEnCurso(null);
    }
  }

  async function eliminar(usuarioSeleccionado: Usuario) {
    if (!window.confirm(`¿Eliminar al usuario "${usuarioSeleccionado.usuario}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setAccionEnCurso(usuarioSeleccionado.id);
    setError("");
    try {
      await apiFetch(`/usuarios/${usuarioSeleccionado.id}`, { method: "DELETE" });
      await cargarUsuarios();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos eliminar el usuario.");
    } finally {
      setAccionEnCurso(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>Gestión de usuarios</h2>
        <Link href="/admin/usuarios/nuevo" className={styles.buttonPrimary}>
          + Nuevo usuario
        </Link>
      </div>

      <form onSubmit={buscar} className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Buscar por nombre..."
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="activo">Estado</label>
          <select
            id="activo"
            value={filtroActivo}
            onChange={(event) => {
              setFiltroActivo(event.target.value as FiltroActivo);
              setPage(1);
            }}
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
        <button type="submit" className={styles.buttonGhost}>
          Buscar
        </button>
      </form>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  Cargando usuarios…
                </td>
              </tr>
            )}
            {!loading && usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.emptyRow}>
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
            {!loading &&
              usuarios.map((usuarioActual) => (
                <tr key={usuarioActual.id}>
                  <td>
                    {usuarioActual.nombre} {usuarioActual.apellido}
                  </td>
                  <td>{usuarioActual.usuario}</td>
                  <td>{usuarioActual.email}</td>
                  <td>{usuarioActual.nombreRol}</td>
                  <td>
                    <span className={`${styles.badge} ${usuarioActual.activo ? styles.badgeActivo : styles.badgeInactivo}`}>
                      {usuarioActual.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Link href={`/admin/usuarios/${usuarioActual.id}/editar`} className={styles.linkAction}>
                        Editar
                      </Link>
                      <button
                        type="button"
                        disabled={accionEnCurso === usuarioActual.id}
                        onClick={() => alternarActivo(usuarioActual)}
                        className={styles.linkAction}
                      >
                        {usuarioActual.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        disabled={accionEnCurso === usuarioActual.id}
                        onClick={() => eliminar(usuarioActual)}
                        className={`${styles.linkAction} ${styles.linkActionDanger}`}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>
          Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} usuarios` : ""}
        </span>
        <div className={styles.paginationButtons}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((actual) => Math.max(1, actual - 1))}
            className={styles.buttonGhost}
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPaginas}
            onClick={() => setPage((actual) => Math.min(totalPaginas, actual + 1))}
            className={styles.buttonGhost}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
