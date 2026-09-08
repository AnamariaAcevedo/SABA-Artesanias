"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "@/components/admin/admin.module.css";
import { esRolAdministrador, useRolSesion } from "@/lib/auth";

const enlaces = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const rol = useRolSesion();
  const verificando = rol === undefined;
  const autorizado = esRolAdministrador(rol);

  useEffect(() => {
    if (verificando || autorizado) return;
    // Sin sesión válida -> login; con sesión pero sin rol admin -> su propia área.
    router.replace(rol ? "/home" : "/login");
  }, [verificando, autorizado, rol, router]);

  function cerrarSesion() {
    if (!window.confirm("¿Querés cerrar sesión?")) return;
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch {
      /* Storage unavailable. */
    }
    router.replace("/");
  }

  if (verificando || !autorizado) {
    return (
      <div className={styles.page}>
        <p className={styles.gateNotice}>{verificando ? "Verificando acceso…" : "Redirigiendo…"}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>•SABA•</span>
        <span className={styles.subtitle}>Administración</span>
        <button type="button" onClick={cerrarSesion} className={`${styles.buttonGhost} ${styles.logoutButton}`}>
          Cerrar sesión
        </button>
      </header>

      <nav className={styles.nav}>
        {enlaces.map((enlace) => {
          const activo = enlace.href === "/admin" ? pathname === "/admin" : pathname.startsWith(enlace.href);
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              className={`${styles.navLink} ${activo ? styles.navLinkActive : ""}`}
            >
              {enlace.label}
            </Link>
          );
        })}
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
