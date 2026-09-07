import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

export default function AuthShell({ children, title, wide = false }: { children: ReactNode; title: string; wide?: boolean }) {
  return (
    <main className={styles.page}>
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
