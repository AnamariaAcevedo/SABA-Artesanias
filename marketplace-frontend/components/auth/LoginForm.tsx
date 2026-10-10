"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/auth/auth.module.css";
import { apiFetch } from "@/lib/api";
import { puedeEntrarAlPanel } from "@/lib/access";

type Props = {
  idPrefix?: string;
  onSuccess?: () => void;
  showSellerLink?: boolean;
  successDestination?: string;
};

export default function LoginForm({ idPrefix = "", onSuccess, showSellerLink = true, successDestination }: Props) {
  const router = useRouter();
  const busy = useRef(false);
  const [usuario, setUsuario] = useState("");
  const [contrasenha, setContrasenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setError("");
    if (!usuario.trim() || !contrasenha.trim()) {
      setError("Completá tu usuario y contraseña.");
      return;
    }
    busy.current = true;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ||
        (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "");
      if (!apiUrl) throw new Error("El inicio de sesión no está disponible en este momento.");
      let response: Response;
      try {
        response = await fetch(`${apiUrl.replace(/\/$/, "")}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: usuario.trim(), contrasenha }),
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw new Error("No pudimos conectar con el servidor. Intentá nuevamente.");
      }
      if (response.status === 401 || response.status === 403) throw new Error("Usuario o contraseña incorrectos.");
      if (response.status === 429) throw new Error("Demasiados intentos. Esperá un momento e intentá nuevamente.");
      if (!response.ok) throw new Error("No pudimos iniciar sesión. Intentá nuevamente en unos momentos.");
      const result = await response.json().catch(() => null);
      if (result?.success === false) throw new Error("Usuario o contraseña incorrectos.");
      if (result?.success !== true || typeof result.data?.accessToken !== "string" || !result.data.accessToken ||
        typeof result.data?.refreshToken !== "string" || !result.data.refreshToken) {
        throw new Error("El servidor devolvió una respuesta inesperada.");
      }
      try {
        localStorage.setItem("accessToken", result.data.accessToken);
        localStorage.setItem("refreshToken", result.data.refreshToken);
        window.dispatchEvent(new Event("sesion-cambiada"));
      } catch {
        try { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); } catch { /* Storage unavailable. */ }
        throw new Error("Habilitá el almacenamiento de este sitio en tu navegador para iniciar sesión.");
      }
      let destination = successDestination ?? "/home";
      if (!successDestination) {
        // The claim selects navigation only. The backend must enforce authorization.
        try {
          const sesion = await apiFetch<{
            permisos: string[];
          }>("/me");

          if (puedeEntrarAlPanel(sesion.permisos)) {
            destination = "/admin";
          }
        } catch {
          // El proveedor de sesión mostrará el error de verificación.
          // No se concede acceso al panel por el contenido del token.
        }
      }
      onSuccess?.();
      router.replace(destination);
    } catch (cause) {
      setError(
          cause instanceof Error
              ? cause.message
              : "No pudimos iniciar sesión."
      );
      setMostrarRecuperar(true);
      busy.current = false;
      setLoading(false);
    }
  }
  return (
    <>
      <form onSubmit={iniciarSesion} className={styles.form} aria-busy={loading}>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}usuario`} suppressHydrationWarning>Nombre de usuario:</label>
          <input id={`${idPrefix}usuario`} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
            required value={usuario} disabled={loading} onChange={(e) => { setUsuario(e.target.value); setError(""); }} />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${idPrefix}contrasenha`} suppressHydrationWarning>Contraseña:</label>
          <input id={`${idPrefix}contrasenha`} name="password" type="password" autoComplete="current-password"
            required value={contrasenha} disabled={loading} onChange={(e) => { setContrasenha(e.target.value); setError(""); }} />
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.formActions}>
          <Link href="/" className={styles.cancelLink}>Cancelar</Link>
          <button className={styles.submit} disabled={loading} type="submit">{loading ? "Ingresando…" : "LOGIN"}</button>
        </div>
        <span className={styles.srOnly} role="status">{loading ? "Verificando tus datos." : ""}</span>
      </form>
      <p className={styles.linkText}>¿No tenés cuenta? <Link href="/registro">Registrate.</Link></p>
      {showSellerLink && (
        <p className={styles.linkText}>¿Querés vender tus artesanías? <Link href="/solicitar-vendedor">Solicitá ser vendedor.</Link></p>
      )}
      {mostrarRecuperar && (
        <p className={styles.linkText}><Link href="/recuperar">¿Olvidaste tu contraseña?</Link></p>
      )}
    </>
  );
}
