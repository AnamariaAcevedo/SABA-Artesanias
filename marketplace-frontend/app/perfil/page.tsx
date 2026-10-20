"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "@/components/admin/admin.module.css";
import UbicacionSelects from "@/components/admin/usuarios/UbicacionSelects";
import AvatarUsuario from "@/components/auth/AvatarUsuario";
import MenuUsuario from "@/components/auth/MenuUsuario";
import BotonInicio from "@/components/catalogo/BotonInicio";
import { useSesion } from "@/components/auth/SesionProvider";
import { ApiError, apiFetch } from "@/lib/api";
import { puedeEntrarAlPanel } from "@/lib/access";
import {
  etiquetaDireccionPerfil,
  etiquetaNumeroPerfil,
  etiquetaUbicacionPerfil,
  formatearFecha,
  type Perfil,
  type PerfilActualizado,
  type PerfilUpdateInput,
} from "@/types/perfil";
import perfilStyles from "./perfil.module.css";

// Perfil propio: muestra los datos del usuario autenticado (GET /perfil) y
// permite editarlos (PUT /perfil). El backend siempre toma el usuario del token.
export default function PerfilPage() {
  const router = useRouter();
  const { sesion, cargando, error, actualizar } = useSesion();

  useEffect(() => {
    if (!cargando && !error && !sesion) router.replace("/login");
  }, [cargando, error, sesion, router]);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.gateNotice} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.buttonPrimary} onClick={() => void actualizar()}>
            Reintentar
          </button>
          <p>
            <Link href="/login">Ir a iniciar sesión</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className={styles.page}>
        <p className={styles.gateNotice} role="status">
          {cargando ? "Cargando perfil…" : "Redirigiendo…"}
        </p>
      </div>
    );
  }

  // Mismo criterio que app/admin/layout.tsx: el acceso al panel depende de los permisos.
  const accedeAlPanel = puedeEntrarAlPanel(sesion.permisos);

  return (
    <div className={styles.page}>
      <header className={`${styles.header} ${perfilStyles.header}`}>
        <BotonInicio />
        <div className={perfilStyles.marca}>
          <span className={styles.logo}>•SABA•</span>
          <span className={styles.subtitle}>Mi perfil</span>
        </div>
        <MenuUsuario />
      </header>

      <main className={styles.main}>
        <div className={perfilStyles.contenedor}>
          {/* `key` remonta el contenido si cambia el usuario de la sesión. */}
          <PerfilContenido
            key={sesion.id}
            accedeAlPanel={accedeAlPanel}
            puedeSolicitarVendedor={sesion.idTienda === null && !accedeAlPanel}
          />
        </div>
      </main>
    </div>
  );
}

function PerfilContenido({
  accedeAlPanel,
  puedeSolicitarVendedor,
}: {
  accedeAlPanel: boolean;
  puedeSolicitarVendedor: boolean;
}) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState(false);
  const [cambiandoContrasenha, setCambiandoContrasenha] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    let cancelado = false;
    async function cargarPerfil() {
      try {
        const data = await apiFetch<Perfil>("/perfil");
        if (!cancelado) setPerfil(data);
      } catch (cause) {
        if (!cancelado) setError(cause instanceof ApiError ? cause.message : "No pudimos cargar tu perfil.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    cargarPerfil();
    return () => {
      cancelado = true;
    };
  }, []);

  if (cargando) return <p className={styles.notice}>Cargando perfil…</p>;
  if (error) {
    return (
      <p role="alert" className={styles.error}>
        {error}
      </p>
    );
  }
  if (!perfil) return null;

  return (
    <>
      <div className={perfilStyles.encabezado}>
        <AvatarUsuario nombre={perfil.nombre} apellido={perfil.apellido} className={perfilStyles.foto} />
        <div className={perfilStyles.encabezadoTexto}>
          <h2 className={styles.title}>
            {perfil.nombre} {perfil.apellido}
          </h2>
          {!editando && !cambiandoContrasenha && (
            <div className={perfilStyles.acciones}>
              <button
                type="button"
                className={styles.buttonPrimary}
                onClick={() => {
                  setMensajeExito("");
                  setEditando(true);
                }}
              >
                Editar perfil
              </button>
              <button
                type="button"
                className={styles.buttonOutline}
                onClick={() => {
                  setMensajeExito("");
                  setCambiandoContrasenha(true);
                }}
              >
                Cambiar contraseña
              </button>
              {/* Mismo destino que el link del login: la página decide según el estado de la solicitud. */}
              {puedeSolicitarVendedor && (
                <Link href="/solicitar-vendedor" className={styles.buttonOutline}>
                  Solicitar ser vendedor
                </Link>
              )}
              {accedeAlPanel && (
                <Link href="/admin" className={styles.buttonOutline}>
                  Panel de administración
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {mensajeExito && (
        <p role="status" className={perfilStyles.exito}>
          {mensajeExito}
        </p>
      )}

      {editando ? (
        <PerfilForm
          perfil={perfil}
          onCancelar={() => setEditando(false)}
          onGuardado={(actualizado) => {
            setPerfil(actualizado);
            setEditando(false);
            setMensajeExito("Tus datos se actualizaron correctamente.");
          }}
        />
      ) : cambiandoContrasenha ? (
        <CambioContrasenha onCancelar={() => setCambiandoContrasenha(false)} />
      ) : (
        <div className={styles.card}>
          <dl className={perfilStyles.datos}>
            <div className={perfilStyles.dato}>
              <dt>Nombre</dt>
              <dd>{perfil.nombre}</dd>
            </div>
            <div className={perfilStyles.dato}>
              <dt>Apellido</dt>
              <dd>{perfil.apellido}</dd>
            </div>
            <div className={perfilStyles.dato}>
              <dt>Nombre de usuario</dt>
              <dd>{perfil.usuario}</dd>
            </div>
            <div className={perfilStyles.dato}>
              <dt>Correo electrónico</dt>
              <dd>{perfil.email}</dd>
            </div>
            <div className={perfilStyles.dato}>
              <dt>Teléfono</dt>
              <dd>{perfil.telefono}</dd>
            </div>
            <div className={perfilStyles.dato}>
              <dt>Dirección</dt>
              <dd>{etiquetaDireccionPerfil(perfil)}</dd>
            </div>
            <div className={perfilStyles.dato}>
              <dt>Número de casa / departamento</dt>
              <dd>{etiquetaNumeroPerfil(perfil)}</dd>
            </div>
            <div className={`${perfilStyles.dato} ${perfilStyles.datoAncho}`}>
              <dt>Ubicación</dt>
              <dd>{etiquetaUbicacionPerfil(perfil)}</dd>
            </div>
          </dl>
        </div>
      )}

    </>
  );
}

function CambioContrasenha({ onCancelar }: { onCancelar: () => void }) {
  const enviandoRef = useRef(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");
    setExito("");

    if (nueva.length < 8) {
      setError("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (nueva !== repetir) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      await apiFetch("/perfil/contrasenha", {
        method: "PUT",
        body: JSON.stringify({
          contrasenhaActual: actual,
          contrasenhaNueva: nueva,
          confirmarContrasenhaNueva: repetir,
        }),
      });
      setActual("");
      setNueva("");
      setRepetir("");
      setExito("Tu contraseña se cambió. Por seguridad, cerramos tus otras sesiones.");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cambiar tu contraseña.");
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <section className={styles.card}>
      <h3 className={styles.sectionSubtitle}>Cambiar contraseña</h3>
      <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
        <div className={styles.field}>
          <label htmlFor="contrasenha-actual">Contraseña actual</label>
          <input
            id="contrasenha-actual"
            type="password"
            autoComplete="current-password"
            required
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="contrasenha-nueva">Contraseña nueva</label>
            <input
              id="contrasenha-nueva"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="contrasenha-repetir">Repetir contraseña nueva</label>
            <input
              id="contrasenha-repetir"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
            />
          </div>
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
        <div className={perfilStyles.acciones}>
          <button type="button" className={styles.buttonOutline} onClick={onCancelar} disabled={enviando}>
            Volver a mi perfil
          </button>
          <button type="submit" disabled={enviando} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </section>
  );
}

interface PerfilFormProps {
  perfil: Perfil;
  onCancelar: () => void;
  onGuardado: (perfil: Perfil) => void;
}

function PerfilForm({ perfil, onCancelar, onGuardado }: PerfilFormProps) {
  const enviandoRef = useRef(false);

  const [nombre, setNombre] = useState(perfil.nombre);
  const [apellido, setApellido] = useState(perfil.apellido);
  const [email, setEmail] = useState(perfil.email);
  const [usuario, setUsuario] = useState(perfil.usuario);
  const [telefono, setTelefono] = useState(perfil.telefono);
  const [calle, setCalle] = useState(perfil.calle);
  const [nombreEdificio, setNombreEdificio] = useState(perfil.nombreEdificio ?? "");
  const [numero, setNumero] = useState(
    perfil.nombreEdificio ? perfil.nroDepartamento ?? "" : perfil.nroCasa != null ? String(perfil.nroCasa) : "",
  );
  const hayEdificio = nombreEdificio.trim().length > 0;

  // El nombre de usuario solo se puede cambiar una vez cada 30 días (lo valida el backend).
  const usuarioBloqueado = perfil.proximoCambioUsuario !== null;
  const cambiaUsuario = usuario.trim() !== perfil.usuario;

  // La ubicación actual se mantiene salvo que el usuario elija cambiarla.
  const [cambiarUbicacion, setCambiarUbicacion] = useState(false);
  const [idBarrio, setIdBarrio] = useState<number | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviandoRef.current) return;
    setError("");

    const numeroLimpio = numero.trim();

    if (!nombre.trim() || !apellido.trim() || !email.trim() || !usuario.trim() || !telefono.trim() || !calle.trim() || !numeroLimpio) {
      setError("Completá todos los campos obligatorios.");
      return;
    }
    if (!/^0\d{8,9}$/.test(telefono.trim())) {
      setError("El teléfono debe empezar con 0 y tener 9 o 10 dígitos, sin espacios.");
      return;
    }
    if (!hayEdificio && (!/^\d+$/.test(numeroLimpio) || Number(numeroLimpio) > 2147483647)) {
      setError("El número de casa debe ser un número entero. Si corresponde a un departamento, completá el nombre del edificio.");
      return;
    }
    if (hayEdificio && numeroLimpio.length > 50) {
      setError("El número de departamento no puede superar los 50 caracteres.");
      return;
    }
    if (cambiarUbicacion && !idBarrio) {
      setError("Completá la ubicación hasta seleccionar un barrio.");
      return;
    }
    if (cambiaUsuario && !window.confirm("Después de cambiar tu nombre de usuario vas a tener que esperar 30 días para volver a cambiarlo. ¿Continuar?")) {
      return;
    }

    const datos: PerfilUpdateInput = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      usuario: usuario.trim(),
      telefono: telefono.trim(),
      calle: calle.trim(),
      nombreEdificio: hayEdificio ? nombreEdificio.trim() : null,
      nroCasa: hayEdificio ? null : Number(numeroLimpio),
      nroDepartamento: hayEdificio ? numeroLimpio : null,
      ...(cambiarUbicacion && idBarrio ? { idBarrio } : {}),
    };

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const resultado = await apiFetch<PerfilActualizado>("/perfil", {
        method: "PUT",
        body: JSON.stringify(datos),
      });

      // Si cambió el nombre de usuario, los tokens anteriores ya no sirven.
      if (resultado.accessToken && resultado.refreshToken) {
        localStorage.setItem("accessToken", resultado.accessToken);
        localStorage.setItem("refreshToken", resultado.refreshToken);
      }
      window.dispatchEvent(new Event("sesion-cambiada"));
      onGuardado(resultado.perfil);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar tus datos.");
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className={`${styles.card} ${styles.formCard}`}>
      <form onSubmit={enviar} className={styles.form} aria-busy={enviando}>
        <h3 className={styles.sectionSubtitle}>Datos personales</h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" required autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" required autoComplete="family-name" value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="usuario">Nombre de usuario</label>
            <input
              id="usuario"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              disabled={usuarioBloqueado}
              aria-describedby="usuario-ayuda"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
            <small id="usuario-ayuda" className={perfilStyles.ayuda}>
              {usuarioBloqueado && perfil.proximoCambioUsuario
                ? `Podrás volver a cambiarlo a partir del ${formatearFecha(perfil.proximoCambioUsuario)}.`
                : "Solo se puede cambiar una vez cada 30 días."}
            </small>
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            type="tel"
            inputMode="numeric"
            required
            autoComplete="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
          />
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
            <span>{etiquetaUbicacionPerfil(perfil)}</span>
            <button type="button" className={styles.buttonOutline} onClick={() => setCambiarUbicacion(true)}>
              Cambiar ubicación
            </button>
          </div>
        )}

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="calle">Calle</label>
            <input
              id="calle"
              required
              autoComplete="address-line1"
              maxLength={100}
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="numeroDireccion">{hayEdificio ? "Número de departamento" : "Número de casa"}</label>
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
          <label htmlFor="nombreEdificio">Nombre de edificio (opcional)</label>
          <input
            id="nombreEdificio"
            maxLength={100}
            value={nombreEdificio}
            onChange={(e) => setNombreEdificio(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.buttonOutline} onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className={styles.buttonPrimary}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
