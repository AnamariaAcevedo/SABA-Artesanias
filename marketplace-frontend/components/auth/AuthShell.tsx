import Link from "next/link";
import type { ReactNode } from "react";
import BotonInicio from "@/components/catalogo/BotonInicio";
import styles from "./auth.module.css";

// `inicioHref` es adónde lleva la casita: la portada por defecto, o el catálogo
// en pantallas para usuarios con sesión (como solicitar ser vendedor).
export default function AuthShell({
  children,
  title,
  wide = false,
  inicioHref = "/",
}: {
  children: ReactNode;
  title: string;
  wide?: boolean;
  inicioHref?: string;
}) {
  return (
    <main className={styles.page}>
      <BotonInicio
        href={inicioHref}
        etiqueta={inicioHref === "/" ? "Volver a la portada" : "Volver al catálogo"}
        className={styles.botonInicio}
      />
      <section className={`${styles.card} ${wide ? styles.wide : ""}`} aria-labelledby="auth-title">
        <Link href="/" className={styles.brand} aria-label="SABA Artesanías, volver al inicio">
          <span className={styles.logo}>•SABA•</span>
          <span className={styles.subtitle}>Artesanías</span>
        </Link>
        <h1 id="auth-title" className={styles.srOnly}>{title}</h1>
        {children}
      </section>
    </main>
  );
}
