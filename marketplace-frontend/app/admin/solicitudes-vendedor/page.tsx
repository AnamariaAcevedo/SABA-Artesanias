"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "@/components/admin/admin.module.css";
import ConPermiso from "@/components/auth/ConPermiso";
import { ACCESO } from "@/lib/access";
import { ApiError, apiFetch, apiFetchConPaginacion } from "@/lib/api";
import type { Pagination } from "@/types/api";

type Estado = "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

type Solicitud = {
  id: number;
  estado: Estado;
  motivoRechazo: string | null;
  usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  nombreTienda: string;
  descripcionTienda: string;
  calle: string;
  nombreEdificio: string | null;
  nroCasa: number | null;
  nroDepartamento: string | null;
  nombreBarrio: string;
  nombreCiudad: string;
  telefono: string;
};

const etiquetas: Record<Estado, string> = {
  PENDIENTE: "Pendiente",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

function claseEstado(estado: Estado) {
  if (estado === "ACEPTADA") return styles.badgeAceptada;
  if (estado === "RECHAZADA") return styles.badgeRechazada;
  return styles.badgePendiente;
}

export default function SolicitudesVendedorPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<Estado | "">("PENDIENTE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorRechazo, setErrorRechazo] = useState("");
  const perPage = 10;

  const cargar = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (estado) params.set("estado", estado);
      const resultado = await apiFetchConPaginacion<Solicitud[]>(`/solicitudes-vendedor?${params.toString()}`);
      setSolicitudes(resultado.data);
      setPagination(resultado.pagination);
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cargar las solicitudes.");
    } finally {
      setLoading(false);
    }
  }, [page, estado]);

  useEffect(() => {
    // La carga actualiza el estado después de completar la petición.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  async function aceptar(solicitud: Solicitud) {
    if (!window.confirm(`¿Aprobar la tienda "${solicitud.nombreTienda}"? Se creará la tienda y el usuario pasará a ser vendedor.`)) return;
    setAccionEnCurso(solicitud.id);
    setError("");
    setAviso("");
    try {
      await apiFetch(`/solicitudes-vendedor/${solicitud.id}/aceptar`, { method: "PUT" });
      setAviso(`La tienda "${solicitud.nombreTienda}" fue aprobada.`);
      await cargar();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos aprobar la solicitud.");
    } finally {
      setAccionEnCurso(null);
    }
  }

  function abrirRechazo(solicitud: Solicitud) {
    setRechazandoId(solicitud.id);
    setMotivoRechazo("");
    setErrorRechazo("");
    setError("");
    setAviso("");
  }

  function cancelarRechazo() {
    setRechazandoId(null);
    setMotivoRechazo("");
    setErrorRechazo("");
  }

  async function rechazar(solicitud: Solicitud) {
    const motivo = motivoRechazo.trim();
    if (!motivo) {
      setErrorRechazo("El motivo del rechazo es obligatorio.");
      return;
    }
    if (motivo.length > 500) {
      setErrorRechazo("El motivo del rechazo no puede superar los 500 caracteres.");
      return;
    }
    setAccionEnCurso(solicitud.id);
    setError("");
    setErrorRechazo("");
    setAviso("");
    try {
      await apiFetch(`/solicitudes-vendedor/${solicitud.id}/rechazar`, {
        method: "PUT",
        body: JSON.stringify({ motivo }),
      });
      setAviso(`La solicitud de "${solicitud.nombreTienda}" fue rechazada.`);
      cancelarRechazo();
      await cargar();
    } catch (cause) {
      setErrorRechazo(cause instanceof Error ? cause.message : "No pudimos rechazar la solicitud.");
    } finally {
      setAccionEnCurso(null);
    }
  }

  const totalPaginas = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <div className={styles.card}>
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.title}>Solicitudes de vendedor</h2>
          <p className={styles.pageSubtitle}>Revisá los datos, contactá al solicitante y aprobá o rechazá su tienda.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="estado">Estado</label>
          <select id="estado" value={estado} onChange={(event) => { setEstado(event.target.value as Estado | ""); setPage(1); }}>
            <option value="">Todas</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="ACEPTADA">Aceptadas</option>
            <option value="RECHAZADA">Rechazadas</option>
          </select>
        </div>
      </div>

      {error && <p role="alert" className={styles.error}>{error}</p>}
      {aviso && <p role="status" className={styles.notice}>{aviso}</p>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Solicitante</th>
              <th>Tienda</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className={styles.emptyRow}>Cargando solicitudes…</td></tr>}
            {!loading && solicitudes.length === 0 && <tr><td colSpan={6} className={styles.emptyRow}>No hay solicitudes para este filtro.</td></tr>}
            {!loading && solicitudes.map((solicitud) => (
              <tr key={solicitud.id}>
                <td>
                  {solicitud.nombre} {solicitud.apellido}
                  <small className={styles.tableDescription}>@{solicitud.usuario}<br />{solicitud.email}</small>
                </td>
                <td>
                  <strong>{solicitud.nombreTienda}</strong>
                  <small className={styles.tableDescription}>{solicitud.descripcionTienda}</small>
                  {solicitud.motivoRechazo && <small className={styles.tableDescription}><strong>Motivo:</strong> {solicitud.motivoRechazo}</small>}
                </td>
                <td>
                  {solicitud.calle} {solicitud.nombreEdificio
                    ? `${solicitud.nombreEdificio}, depto. ${solicitud.nroDepartamento}`
                    : `N.º ${solicitud.nroCasa}`}
                  <small className={styles.tableDescription}>{solicitud.nombreBarrio}, {solicitud.nombreCiudad}</small>
                </td>
                <td><span className={`${styles.badge} ${claseEstado(solicitud.estado)}`}>{etiquetas[solicitud.estado]}</span></td>
                <td>
                  <a className={styles.whatsappLink} href={`https://wa.me/${solicitud.telefono}`} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                  <small className={styles.tableDescription}>+{solicitud.telefono}</small>
                </td>
                <td>
                  {solicitud.estado === "PENDIENTE" ? (
                    <ConPermiso permisos={ACCESO.gestionarSolicitudesVendedor}>
                      {rechazandoId === solicitud.id ? (
                        <div className={styles.rejectEditor}>
                          <label htmlFor={`motivo-rechazo-${solicitud.id}`}>Motivo del rechazo</label>
                          <textarea
                            id={`motivo-rechazo-${solicitud.id}`}
                            value={motivoRechazo}
                            onChange={(event) => { setMotivoRechazo(event.target.value); setErrorRechazo(""); }}
                            maxLength={500}
                            autoFocus
                            disabled={accionEnCurso === solicitud.id}
                            placeholder="Explicá por qué se rechaza la solicitud"
                          />
                          <small>{motivoRechazo.length}/500</small>
                          {errorRechazo && <small className={styles.inlineError} role="alert">{errorRechazo}</small>}
                          <div className={styles.rowActions}>
                            <button type="button" className={`${styles.linkAction} ${styles.linkActionDanger}`} disabled={accionEnCurso === solicitud.id} onClick={() => void rechazar(solicitud)}>
                              {accionEnCurso === solicitud.id ? "Rechazando…" : "Confirmar rechazo"}
                            </button>
                            <button type="button" className={styles.linkAction} disabled={accionEnCurso === solicitud.id} onClick={cancelarRechazo}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.rowActions}>
                          <button type="button" className={styles.linkAction} disabled={accionEnCurso !== null} onClick={() => aceptar(solicitud)}>Aprobar</button>
                          <button type="button" className={`${styles.linkAction} ${styles.linkActionDanger}`} disabled={accionEnCurso !== null} onClick={() => abrirRechazo(solicitud)}>Rechazar</button>
                        </div>
                      )}
                    </ConPermiso>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span>Página {page} de {totalPaginas} {pagination ? `· ${pagination.total} solicitudes` : ""}</span>
        <div className={styles.paginationButtons}>
          <button type="button" className={styles.buttonGhost} disabled={page <= 1} onClick={() => setPage((actual) => Math.max(1, actual - 1))}>Anterior</button>
          <button type="button" className={styles.buttonGhost} disabled={page >= totalPaginas} onClick={() => setPage((actual) => Math.min(totalPaginas, actual + 1))}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}
