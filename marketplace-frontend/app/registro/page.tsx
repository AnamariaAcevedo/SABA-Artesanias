"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import AuthShell from "@/components/auth/AuthShell";
import styles from "@/components/auth/auth.module.css";
import UbicacionFields from "@/components/auth/UbicacionFields";

export default function RegistroPage() {
  const [error, setError] = useState("");
  const [validado, setValidado] = useState(false);

  function validarRegistro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setValidado(false);
    const form = event.currentTarget;
    const datos = new FormData(form);
    const valor = (nombre: string) => String(datos.get(nombre) ?? "");

    for (const nombre of ["nombre", "apellido", "usuario", "email", "contrasenha", "confirmar", "calle", "numeroCasa"]) {
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
    setValidado(true);
  }

  function limpiarMensaje() {
    setError("");
    setValidado(false);
  }

  return (
    <AuthShell title="Crear una cuenta" wide>
      <form className={styles.form} onSubmit={validarRegistro} onChange={limpiarMensaje} aria-describedby="registro-notice">
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
          <div className={styles.field}><label htmlFor="calle">Calle:</label><input id="calle" name="calle" autoComplete="address-line1" required /></div>
          <div className={styles.field}><label htmlFor="casa">Nro. de casa/Dpto:</label><input id="casa" name="numeroCasa" type="text" required /></div>
        </div>
        <div className={styles.field}><label htmlFor="nombre_edificio">Nombre edificio (opcional):</label><input id="nombre_edificio" name="nombreEdificio" type="text" /></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {validado && <p className={styles.notice} role="status">Los datos son válidos. La cuenta todavía no se creó: falta conectar el envío del registro.</p>}
        <button type="submit" className={styles.submit}>Crear cuenta</button>
      </form>
      <p id="registro-notice" className={styles.notice}>Todos los campos son obligatorios excepto el nombre del edificio. Por ahora, el botón valida los datos; todavía no los guarda.</p>
      <p className={styles.linkText}>¿Ya tenés cuenta? <Link href="/login">Iniciá sesión.</Link></p>
    </AuthShell>
  );
}
