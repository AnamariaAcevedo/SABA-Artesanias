"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "@/components/admin/admin.module.css";
import LogoutButton from "@/components/auth/LogoutButton";
import { useSesion } from "@/components/auth/SesionProvider";
import {
  ACCESO,
  cumplePermisos,
  puedeAbrirRuta,
  puedeEntrarAlPanel,
} from "@/lib/access";


const secciones = [
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    permisos: ACCESO.verUsuarios,
  },
  {
    href: "/admin/roles",
    label: "Roles",
    permisos: ACCESO.verRoles,
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    permisos: ACCESO.verCategorias,
  },
];

export default function AdminLayout({
                                      children,
                                    }: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    sesion,
    cargando,
    error,
    actualizar,
  } = useSesion();

  useEffect(() => {
    if (!cargando && !error && !sesion) {
      router.replace("/login");
    }
  }, [cargando, error, sesion, router]);

  if (error) {
    return (
        <div className={styles.page}>
          <div className={styles.gateNotice} role="alert">
            <p>{error}</p>

            <button
                type="button"
                className={styles.buttonPrimary}
                onClick={() => void actualizar()}
            >
              Reintentar
            </button>

            <p>
              <Link href="/login">
                Ir a iniciar sesión
              </Link>
            </p>
          </div>
        </div>
    );
  }

  if (cargando || !sesion) {
    return (
        <div className={styles.page}>
          <p className={styles.gateNotice} role="status">
            {cargando
                ? "Verificando acceso…"
                : "Redirigiendo…"}
          </p>
        </div>
    );
  }

  if (!puedeEntrarAlPanel(sesion.permisos)) {
    return (
        <div className={styles.page}>
          <div className={styles.gateNotice}>
            <p>No tenés acceso a este panel.</p>
            <Link href="/home">Volver al inicio</Link>
          </div>
        </div>
    );
  }

  const visibles = secciones.filter((seccion) =>
      cumplePermisos(sesion.permisos, seccion.permisos)
  );

  const autorizado = puedeAbrirRuta(
      pathname,
      sesion.permisos
  );

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.logo}>•SABA•</span>
          <span className={styles.subtitle}>
                    Panel de gestión
                </span>
          <LogoutButton className={styles.logoutButton} />
        </header>

        <nav className={styles.nav} aria-label="Gestión">
          <Link
              href="/admin"
              className={`${styles.navLink} ${
                  pathname === "/admin"
                      ? styles.navLinkActive
                      : ""
              }`}
          >
            Inicio
          </Link>

          {visibles.map((seccion) => {
            const activo =
                pathname === seccion.href ||
                pathname.startsWith(`${seccion.href}/`);

            return (
                <Link
                    key={seccion.href}
                    href={seccion.href}
                    className={`${styles.navLink} ${
                        activo ? styles.navLinkActive : ""
                    }`}
                >
                  {seccion.label}
                </Link>
            );
          })}
        </nav>

        <main className={styles.main}>
          {autorizado ? (
              children
          ) : (
              <div className={styles.card}>
                <p role="alert">
                  Esta sección no está disponible
                  para tu acceso.
                </p>
                <Link href="/admin">
                  Volver al panel
                </Link>
              </div>
          )}
        </main>
      </div>
  );
}