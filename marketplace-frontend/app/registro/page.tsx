"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import AuthShell from "@/components/auth/AuthShell";
import styles from "@/components/auth/auth.module.css";
import UbicacionFields from "@/components/auth/UbicacionFields";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [creado, setCreado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const envioEnCurso = useRef(false);
  const [nombreEdificio, setNombreEdificio] = useState("");
  const hayEdificio = nombreEdificio.trim().length > 0;
  const campoNumero = hayEdificio ? "nroDepartamento" : "nroCasa";

  async function validarRegistro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (envioEnCurso.current || creado) return;
    setError("");
    const form = event.currentTarget;
    const datos = new FormData(form);
    const valor = (nombre: string) => String(datos.get(nombre) ?? "");

    for (const nombre of ["nombre", "apellido", "usuario", "email", "contrasenha", "confirmar", "calle", campoNumero]) {
      if (!valor(nombre).trim()) {
        setError("Completá los campos obligatorios. No pueden contener solamente espacios.");
        (form.elements.namedItem(nombre) as HTMLInputElement)?.focus();
        return;
      }
    }
    if (valor("contrasenha").length < 8 || valor("confirmar").length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      (form.elements.namedItem("contrasenha") as HTMLInputElement).focus();
      return;
    }
    if (valor("contrasenha") !== valor("confirmar")) {
      setError("Las contraseñas no coinciden.");
      (form.elements.namedItem("confirmar") as HTMLInputElement).focus();
      return;
    }
    if (!["idPais", "idDepartamento", "idCiudad", "idBarrio"].every((nombre) => valor(nombre))) {
      setError("Completá tu ubicación hasta seleccionar un barrio.");
      form.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus();
      return;
    }
    const numero = valor(campoNumero).trim();
    if (!hayEdificio && (!/^\d+$/.test(numero) || Number(numero) > 2147483647)) {
      setError("El número de casa debe ser un número entero entre 0 y 2147483647. Si corresponde a un departamento, completá el nombre del edificio.");
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
    const api = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!api) {
      setError("El registro no está disponible en este momento.");
      return;
    }

    const payload = {
      nombre: valor("nombre").trim(),
      apellido: valor("apellido").trim(),
      usuario: valor("usuario").trim(),
      email: valor("email").trim(),
      contrasenha: valor("contrasenha"),
      calle: valor("calle").trim(),
      nombreEdificio: hayEdificio ? nombreEdificio.trim() : null,
      nroCasa: hayEdificio ? null : Number(numero),
      nroDepartamento: hayEdificio ? numero : null,
      idBarrio,
    };

    envioEnCurso.current = true;
    setEnviando(true);
    try {
      const response = await fetch(`${api.replace(/\/$/, "")}/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const resultado = await response.json().catch(() => null);
      if (!response.ok || resultado?.success !== true) {
        const mensajes = Array.isArray(resultado?.errors)
          ? resultado.errors.filter((mensaje: unknown): mensaje is string => typeof mensaje === "string")
          : [];
        if (mensajes.length) throw new Error(mensajes.join(" "));
        if (response.status === 409) throw new Error("Ya existe una cuenta con ese usuario o correo.");
        if (response.status === 400) throw new Error("Revisá los datos ingresados. El servidor no pudo aceptar el registro.");
        if (response.status === 429) throw new Error("Demasiados intentos. Esperá un momento antes de volver a intentar.");
        if (response.ok) throw new Error("No pudimos confirmar el registro. Intentá iniciar sesión antes de volver a enviarlo.");
        throw new Error("No se pudo completar el registro. Intentá nuevamente en unos momentos.");
      }
      setCreado(true);
      // Do not retain the submitted password in the form after account creation.
      (form.elements.namedItem("contrasenha") as HTMLInputElement).value = "";
      (form.elements.namedItem("confirmar") as HTMLInputElement).value = "";
      const sesion = resultado.data;
      if (typeof sesion?.accessToken !== "string" || !sesion.accessToken ||
          typeof sesion?.refreshToken !== "string" || !sesion.refreshToken) {
        throw new Error("Tu cuenta se creó, pero no pudimos iniciar la sesión. Ingresá desde Iniciar sesión.");
      }
      try {
        localStorage.setItem("accessToken", sesion.accessToken);
        localStorage.setItem("refreshToken", sesion.refreshToken);
      } catch {
        try { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); } catch { /* Storage unavailable. */ }
        throw new Error("Tu cuenta se creó, pero el navegador no permitió guardar la sesión. Habilitá el almacenamiento e iniciá sesión.");
      }
      router.replace("/home");
    } catch (cause) {
      if (cause instanceof TypeError || (cause instanceof DOMException && ["TimeoutError", "AbortError"].includes(cause.name))) {
        setError("Se perdió la conexión o el servidor tardó demasiado. No pudimos confirmar si se creó tu cuenta; intentá iniciar sesión antes de repetir el registro.");
      } else {
        setError(cause instanceof Error ? cause.message : "No pudimos completar el registro.");
      }
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  }

  function limpiarMensaje() {
    setError("");
  }

  return (
    <AuthShell title="Crear una cuenta" wide>
      <form onSubmit={validarRegistro} onChange={limpiarMensaje} aria-busy={enviando}>
        <fieldset className={styles.form} disabled={enviando || creado}>
        <div className={styles.row}>
          <div className={styles.field}><label htmlFor="nombre">Nombre:</label><input id="nombre" name="nombre" autoComplete="given-name" required /></div>
          <div className={styles.field}><label htmlFor="apellido">Apellido:</label><input id="apellido" name="apellido" autoComplete="family-name" required /></div>
        </div>
        <div className={styles.field}><label htmlFor="nuevo-usuario">Nombre de usuario:</label><input id="nuevo-usuario" name="usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} required /></div>
        <div className={styles.field}><label htmlFor="correo">Correo electrónico:</label><input id="correo" name="email" type="email" autoComplete="email" required /></div>
        <div className={styles.field}><label htmlFor="nueva-contrasenha">Contraseña:</label><input id="nueva-contrasenha" name="contrasenha" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-help" /><small id="password-help">Mínimo 8 caracteres.</small></div>
        <div className={styles.field}><label htmlFor="confirmar">Confirmar contraseña:</label><input id="confirmar" name="confirmar" type="password" autoComplete="new-password" required minLength={8} /></div>
        <UbicacionFields onSelectionChange={limpiarMensaje} />
        <div className={styles.row}>
          <div className={styles.field}><label htmlFor="calle">Calle:</label><input id="calle" name="calle" autoComplete="address-line1" maxLength={100} required /></div>
          <div className={styles.field}>
            <label htmlFor="casa">{hayEdificio ? "Nro. de departamento:" : "Nro. de casa:"}</label>
            <input id="casa" name={campoNumero} type="text" inputMode={hayEdificio ? "text" : "numeric"}
              required aria-describedby="numero-help" />
            <small id="numero-help">{hayEdificio ? "Podés usar números y letras, por ejemplo: 4B." : "Ingresá solo números. Para un departamento, completá el edificio."}</small>
          </div>
        </div>
        <div className={styles.field}><label htmlFor="nombre_edificio">Nombre edificio (opcional):</label><input id="nombre_edificio" name="nombreEdificio" type="text" maxLength={100}
          value={nombreEdificio} onChange={(event) => setNombreEdificio(event.target.value)} /></div>
        <button type="submit" className={styles.submit} disabled={enviando || creado}>{creado ? "Cuenta creada" : enviando ? "Creando cuenta…" : "Crear cuenta"}</button>
        </fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {enviando && <p role="status">Estamos creando tu cuenta…</p>}
        {creado && !error && <p role="status">Tu cuenta se creó correctamente. Entrando al catálogo…</p>}
      </form>
      <p className={styles.linkText}>¿Ya tenés cuenta? <Link href="/login">Iniciá sesión.</Link></p>
    </AuthShell>
  );
}
