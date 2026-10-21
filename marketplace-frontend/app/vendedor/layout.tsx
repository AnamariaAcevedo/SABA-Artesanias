"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "@/components/admin/admin.module.css";
import MenuUsuario from "@/components/auth/MenuUsuario";
import { useSesion } from "@/components/auth/SesionProvider";
import {
  ACCESO,
  cumplePermisos,
  puedeAbrirRutaVendedor,
  puedeEntrarAlPanelVendedor,
} from "@/lib/access";


const secciones = [
  {
    href: "/vendedor/productos",
    label: "Productos",
    permisos: [] as string[],
  },
  {
    href: "/vendedor/tiendas",
    label: "Tiendas",
    permisos: ACCESO.editarTienda,
  },
];

export default function VendedorLayout({
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

  if (!puedeEntrarAlPanelVendedor(sesion.permisos)) {
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

  const autorizado = puedeAbrirRutaVendedor(
      pathname,
      sesion.permisos
  );

  return (
      <div className={styles.page}>
        <header className={styles.header}>
          <span className={styles.logo}>•SABA•</span>
          <span className={styles.subtitle}>
                    Panel del vendedor
                </span>
          <MenuUsuario enPanel />
        </header>

        <nav className={styles.nav} aria-label="Gestión del vendedor">
          <Link
              href="/vendedor"
              className={`${styles.navLink} ${
                  pathname === "/vendedor"
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
                <Link href="/vendedor">
                  Volver al panel
                </Link>
              </div>
          )}
        </main>
      </div>
  );
}
