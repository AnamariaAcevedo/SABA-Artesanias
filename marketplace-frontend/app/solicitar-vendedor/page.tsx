"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { useSesion } from "@/components/auth/SesionProvider";
import UbicacionFields from "@/components/auth/UbicacionFields";
import styles from "@/components/auth/auth.module.css";
import { ApiError, apiFetch } from "@/lib/api";

type EstadoSolicitud = "PENDIENTE" | "ACEPTADA" | "RECHAZADA";

type SolicitudVendedor = {
  id: number;
  estado: EstadoSolicitud;
  motivoRechazo: string | null;
  nombreTienda: string;
  descripcionTienda: string;
  calle: string;
  nombreEdificio: string | null;
  nroCasa: number | null;
  nroDepartamento: string | null;
  idBarrio: number;
  nombreBarrio: string;
  nombreCiudad: string;
  telefono: string;
  createdAt: string;
};

export default function SolicitarVendedorPage() {
  const { sesion, cargando, error: errorSesion } = useSesion();
  const [consultando, setConsultando] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [solicitud, setSolicitud] = useState<SolicitudVendedor | null>(null);
  const [nombreEdificio, setNombreEdificio] = useState("");
  const [ahora, setAhora] = useState(() => Date.now());
  const envioEnCurso = useRef(false);

  useEffect(() => {
    if (!sesion || sesion.idTienda !== null) return;

    let vigente = true;
    apiFetch<SolicitudVendedor>("/solicitudes-vendedor/mia")
      .then((actual) => {
        if (!vigente) return;
        setSolicitud(actual);
      })
      .catch((cause) => {
        if (!vigente) return;
        if (!(cause instanceof ApiError && cause.status === 404)) {
          setError(cause instanceof Error ? cause.message : "No pudimos consultar tu solicitud.");
        }
      })
      .finally(() => {
        if (vigente) setConsultando(false);
      });

    return () => {
      vigente = false;
    };
  }, [sesion]);

  const limiteEliminacion = solicitud?.createdAt
    ? new Date(solicitud.createdAt).getTime() + 24 * 60 * 60 * 1000
    : 0;
  const puedeEliminar = solicitud?.estado === "PENDIENTE" && ahora < limiteEliminacion;

  useEffect(() => {
    if (solicitud?.estado !== "PENDIENTE") return;
    const intervalo = window.setInterval(() => setAhora(Date.now()), 30_000);
    return () => window.clearInterval(intervalo);
  }, [solicitud?.estado]);

  async function eliminarSolicitud() {
    if (!solicitud || !puedeEliminar) return;
    if (!window.confirm(`¿Eliminar la solicitud de "${solicitud.nombreTienda}"? Podrás completar una nueva solicitud después.`)) return;

    setEliminando(true);
    setError("");
    try {
      await apiFetch<void>("/solicitudes-vendedor/mia", { method: "DELETE" });
      setSolicitud(null);
      setNombreEdificio("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos eliminar tu solicitud.");
    } finally {
      setEliminando(false);
    }
  }

  const hayEdificio = nombreEdificio.trim().length > 0;
  const campoNumero = hayEdificio ? "nroDepartamento" : "nroCasa";

  async function enviarSolicitud(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (envioEnCurso.current) return;

    setError("");
    const form = event.currentTarget;
    const datos = new FormData(form);
    const valor = (nombre: string) => String(datos.get(nombre) ?? "");

    for (const nombre of ["nombreTienda", "descripcionTienda", "telefono", "calle", campoNumero]) {
      if (!valor(nombre).trim()) {
        setError("Completá todos los campos obligatorios.");
        (form.elements.namedItem(nombre) as HTMLInputElement | HTMLTextAreaElement)?.focus();
        return;
      }
    }

    if (!/^0\d{8,9}$/.test(valor("telefono").trim())) {
      setError("El WhatsApp debe comenzar con 0 y tener 9 o 10 dígitos, sin espacios.");
      (form.elements.namedItem("telefono") as HTMLInputElement).focus();
      return;
    }

    if (!["idPais", "idDepartamento", "idCiudad", "idBarrio"].every((nombre) => valor(nombre))) {
      setError("Completá la ubicación de la tienda hasta seleccionar un barrio.");
      form.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus();
      return;
    }

    const numero = valor(campoNumero).trim();
    if (!hayEdificio && (!/^\d+$/.test(numero) || Number(numero) > 2147483647)) {
      setError("El número de casa debe ser un entero entre 0 y 2147483647. Si es un departamento, completá el nombre del edificio.");
      (form.elements.namedItem(campoNumero) as HTMLInputElement).focus();
      return;
    }
    if (hayEdificio && numero.length > 50) {
      setError("El número de departamento no puede superar los 50 caracteres.");
      (form.elements.namedItem(campoNumero) as HTMLInputElement).focus();
      return;
    }

    const idBarrio = Number(valor("idBarrio"));
    if (!Number.isSafeInteger(idBarrio) || idBarrio <= 0) {
      setError("Seleccioná un barrio válido.");
      return;
    }

    envioEnCurso.current = true;
    setEnviando(true);

    try {
      const guardada = await apiFetch<SolicitudVendedor>("/solicitudes-vendedor", {
        method: "POST",
        body: JSON.stringify({
          nombreTienda: valor("nombreTienda").trim(),
          descripcionTienda: valor("descripcionTienda").trim(),
          telefono: valor("telefono").trim(),
          calle: valor("calle").trim(),
          nombreEdificio: hayEdificio ? nombreEdificio.trim() : null,
          nroCasa: hayEdificio ? null : Number(numero),
          nroDepartamento: hayEdificio ? numero : null,
          idBarrio,
        }),
      });
      setSolicitud(guardada);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar tu solicitud.");
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  }

  if (cargando || (sesion && sesion.idTienda === null && consultando)) {
    return <AuthShell title="Solicitar ser vendedor"><p className={styles.notice} role="status">Verificando tu solicitud…</p></AuthShell>;
  }

  if (!sesion) {
    return (
      <AuthShell title="Solicitar ser vendedor">
        <h2 className={styles.heading}>Solicitar ser vendedor</h2>
        <p className={styles.intro}>Iniciá sesión para completar los datos de tu tienda y enviar la solicitud.</p>
        {errorSesion && <p className={styles.error} role="alert">{errorSesion}</p>}
        <LoginForm idPrefix="solicitud-" showSellerLink={false} successDestination="/solicitar-vendedor" />
      </AuthShell>
    );
  }

  if (sesion.idTienda !== null) {
    return (
      <AuthShell title="Solicitar ser vendedor">
        <h2 className={styles.heading}>Ya tenés una tienda</h2>
        <p className={styles.notice}>Tu usuario ya está asociado a {sesion.nombreTienda ?? "una tienda"}.</p>
        <div className={styles.formActions}>
          <Link href="/home" className={styles.cancelLink}>Volver al catálogo</Link>
          <Link href="/mi-tienda" className={styles.submit}>Ir a mi tienda</Link>
        </div>
      </AuthShell>
    );
  }

  if (solicitud?.estado === "PENDIENTE") {
    return (
      <AuthShell title="Solicitud pendiente">
        <h2 className={styles.heading}>Ya tenés una tienda en espera de aprobación</h2>
        <p className={styles.notice} role="status">
          La solicitud de <strong>{solicitud.nombreTienda}</strong> está siendo revisada. Una vez enviada, no es posible modificar sus datos.
        </p>
        {puedeEliminar ? (
          <p className={styles.intro}>Podés eliminar esta solicitud durante 24 horas, hasta {new Date(limiteEliminacion).toLocaleString("es-PY", { dateStyle: "short", timeStyle: "short" })}.</p>
        ) : (
          <p className={styles.intro}>El plazo de 24 horas para eliminar esta solicitud ya venció.</p>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.formActions}>
          <Link href="/home" className={styles.cancelLink}>Volver al catálogo</Link>
          {puedeEliminar && (
            <button type="button" className={styles.cancelLink} disabled={eliminando} onClick={() => void eliminarSolicitud()}>
              {eliminando ? "Eliminando…" : "Eliminar solicitud"}
            </button>
          )}
        </div>
      </AuthShell>
    );
  }

  if (solicitud?.estado === "ACEPTADA") {
    return (
      <AuthShell title="Solicitud aprobada">
        <h2 className={styles.heading}>Tu solicitud fue aprobada</h2>
        <p className={styles.notice}>La tienda <strong>{solicitud.nombreTienda}</strong> ya fue habilitada. Volvé a iniciar sesión si todavía no aparece en tu menú.</p>
        <div className={styles.formActions}><Link href="/home" className={styles.submit}>Volver al catálogo</Link></div>
      </AuthShell>
    );
  }

  if (solicitud?.estado === "RECHAZADA") {
    return (
      <AuthShell title="Solicitud rechazada">
        <h2 className={styles.heading}>Tu solicitud fue rechazada</h2>
        <p className={styles.notice}><strong>Motivo:</strong> {solicitud.motivoRechazo ?? "El administrador no indicó un motivo."}</p>
        <p className={styles.intro}>El rechazo es definitivo y no es posible enviar otra solicitud con esta cuenta.</p>
        <div className={styles.formActions}>
          <Link href="/home" className={styles.submit}>Volver al catálogo</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Solicitar ser vendedor" wide>
      <h2 className={styles.heading}>Solicitar ser vendedor</h2>
      <p className={styles.intro}>Contanos sobre tu tienda. Un administrador revisará los datos antes de habilitarla. Revisalos bien: una vez enviada, la solicitud no se puede modificar.</p>
      <form onSubmit={enviarSolicitud} onChange={() => setError("")} aria-busy={enviando}>
        <fieldset className={styles.form} disabled={enviando}>
          <div className={styles.field}>
            <label htmlFor="nombreTienda">Nombre de la tienda:</label>
            <input id="nombreTienda" name="nombreTienda" maxLength={100} required />
          </div>
          <div className={styles.field}>
            <label htmlFor="descripcionTienda">Descripción de la tienda:</label>
            <textarea id="descripcionTienda" name="descripcionTienda" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="telefono">WhatsApp:</label>
            <input id="telefono" name="telefono" type="tel" inputMode="numeric" autoComplete="tel-national"
              placeholder="0981123456"
              pattern="0[0-9]{8,9}" maxLength={10} required aria-describedby="telefono-help" />
            <small id="telefono-help">Ingresá 9 o 10 dígitos sin espacios, comenzando con 0.</small>
          </div>
          <UbicacionFields onSelectionChange={() => setError("")} />
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="calle">Calle:</label>
              <input id="calle" name="calle" autoComplete="address-line1" maxLength={100} required />
            </div>
            <div className={styles.field}>
              <label htmlFor="numero">{hayEdificio ? "Nro. de departamento:" : "Nro. de casa:"}</label>
              <input id="numero" name={campoNumero} type="text" inputMode={hayEdificio ? "text" : "numeric"}
                  required aria-describedby="numero-help" />
              <small id="numero-help">{hayEdificio ? "Podés usar números y letras, por ejemplo: 4B." : "Ingresá solo números. Para un departamento, completá el edificio."}</small>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="nombreEdificio">Nombre del edificio (opcional):</label>
            <input id="nombreEdificio" name="nombreEdificio" maxLength={100} value={nombreEdificio}
              onChange={(event) => setNombreEdificio(event.target.value)} />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.formActions}>
            <Link href="/home" className={styles.cancelLink}>Cancelar</Link>
            <button type="submit" className={styles.submit} disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </fieldset>
      </form>
    </AuthShell>
  );
}
