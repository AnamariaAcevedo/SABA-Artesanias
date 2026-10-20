"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import AuthShell from "@/components/auth/AuthShell";
import styles from "@/components/auth/auth.module.css";
import { ApiError, apiFetch } from "@/lib/api";

export default function RecuperarNuevaPage() {
  const busy = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  async function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !token) return;
    setError("");
    if (nueva.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nueva !== repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    busy.current = true;
    setLoading(true);
    try {
      await apiFetch("/recuperar/confirmar", {
        method: "POST",
        body: JSON.stringify({ token, contrasenhaNueva: nueva, confirmarContrasenhaNueva: repetir }),
      });
      setListo(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos cambiar tu contraseña. Intentá nuevamente.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (token === null) {
    return <AuthShell title="Nueva contraseña"><p className={styles.linkText}>Cargando…</p></AuthShell>;
  }

  if (!token) {
    return (
      <AuthShell title="Link no válido">
        <p className={styles.linkText} role="alert">Este link no es válido. Pedí uno nuevo.</p>
        <p className={styles.linkText}><Link href="/recuperar">Pedir un nuevo link</Link></p>
      </AuthShell>
    );
  }

  if (listo) {
    return (
      <AuthShell title="Contraseña cambiada">
        <p className={styles.linkText} role="status">Tu contraseña se cambió. Ya podés iniciar sesión con la nueva.</p>
        <p className={styles.linkText}><Link href="/login">Ir a iniciar sesión</Link></p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Elegí una nueva contraseña">
      <form onSubmit={confirmar} className={styles.form} aria-busy={loading}>
        <div className={styles.field}>
          <label htmlFor="nueva-contrasenha">Contraseña nueva:</label>
          <input
            id="nueva-contrasenha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={nueva}
            disabled={loading}
            onChange={(e) => {
              setNueva(e.target.value);
              setError("");
            }}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="repetir-contrasenha">Repetir contraseña:</label>
          <input
            id="repetir-contrasenha"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={repetir}
            disabled={loading}
            onChange={(e) => {
              setRepetir(e.target.value);
              setError("");
            }}
          />
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.formActions}>
          <Link href="/login" className={styles.cancelLink}>Cancelar</Link>
          <button className={styles.submit} disabled={loading} type="submit">
            {loading ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
