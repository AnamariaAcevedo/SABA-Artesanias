"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import AuthShell from "@/components/auth/AuthShell";
import styles from "@/components/auth/auth.module.css";
import { ApiError, apiFetch } from "@/lib/api";

export default function RecuperarPage() {
  const busy = useRef(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    setError("");
    if (!email.trim()) {
      setError("Ingresá tu correo electrónico.");
      return;
    }
    busy.current = true;
    setLoading(true);
    try {
      await apiFetch("/recuperar", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setEnviado(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "No pudimos procesar tu pedido. Intentá nuevamente.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <AuthShell title="Revisá tu correo">
        <p className={styles.linkText} role="status">
          Te enviamos un link para elegir una nueva contraseña. El link vence en 30 minutos.
        </p>
        <p className={styles.linkText}>
          <Link href="/login">Volver al inicio de sesión</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Recuperar contraseña">
      <form onSubmit={enviar} className={styles.form} aria-busy={loading}>
        <div className={styles.field}>
          <label htmlFor="email-recuperar">Correo electrónico:</label>
          <input
            id="email-recuperar"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={loading}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.formActions}>
          <Link href="/login" className={styles.cancelLink}>Cancelar</Link>
          <button className={styles.submit} disabled={loading} type="submit">
            {loading ? "Enviando…" : "Enviar link"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
