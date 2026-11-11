"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "@/components/admin/admin.module.css";
import MenuUsuario from "@/components/auth/MenuUsuario";
import miTiendaStyles from "@/components/mi-tienda/miTienda.module.css";
import BotonInicio from "@/components/catalogo/BotonInicio";
import { useSesion } from "@/components/auth/SesionProvider";
import { ACCESO, cumplePermisos } from "@/lib/access";

// Secciones de "Mi tienda": cada una se ve con cualquiera de sus permisos, que se
// asignan al rol desde el panel. El backend vuelve a verificar el permiso y el
// vínculo con la tienda en cada operación.
const secciones: { href: string; label: string; permisos: string[][] }[] = [
  { href: "/mi-tienda", label: "Inicio", permisos: [] },
  { href: "/mi-tienda/productos", label: "Productos", permisos: [ACCESO.verMisProductos] },
  { href: "/mi-tienda/pedidos", label: "Pedidos", permisos: [ACCESO.verPedidosTienda] },
  { href: "/mi-tienda/cupones", label: "Cupones", permisos: [] },
  { href: "/mi-tienda/publicaciones", label: "Publicaciones", permisos: [ACCESO.verMisPublicaciones] },
  { href: "/mi-tienda/datos", label: "Datos de la tienda", permisos: [ACCESO.verMiTienda, ACCESO.verMisContactos] },
];

export default function MiTiendaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { sesion, cargando, error, actualizar } = useSesion();

  useEffect(() => {
    if (!cargando && !error && !sesion) router.replace("/login");
  }, [cargando, error, sesion, router]);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.gateNotice} role="alert">
          <p>{error}</p>
          <button type="button" className={styles.buttonPrimary} onClick={() => void actualizar()}>
            Reintentar
          </button>
          <p>
            <Link href="/login">Ir a iniciar sesión</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className={styles.page}>
        <p className={styles.gateNotice} role="status">
          {cargando ? "Verificando acceso…" : "Redirigiendo…"}
        </p>
      </div>
    );
  }

  if (sesion.idTienda === null) {
    return (
      <div className={styles.page}>
        <div className={styles.gateNotice}>
          <p>No gestionás ninguna tienda.</p>
          <Link href="/home">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const permitida = (seccion: (typeof secciones)[number]) =>
    seccion.permisos.length === 0 || seccion.permisos.some((permisos) => cumplePermisos(sesion.permisos, permisos));
  const visibles = secciones.filter(permitida);
  const seccionActual = secciones.find((seccion) =>
    seccion.href === "/mi-tienda" ? pathname === "/mi-tienda" : pathname.startsWith(seccion.href),
  );
  const autorizado = !seccionActual || permitida(seccionActual);

  return (
    <div className={styles.page}>
      <header className={`${styles.header} ${miTiendaStyles.header}`}>
        <BotonInicio />
        <div className={miTiendaStyles.marca}>
          <span className={styles.logo}>•SABA•</span>
          <span className={styles.subtitle}>{sesion.nombreTienda}</span>
        </div>
        <MenuUsuario />
      </header>

      <nav className={styles.nav} aria-label="Mi tienda">
        {visibles.map((seccion) => (
          <Link
            key={seccion.href}
            href={seccion.href}
            className={`${styles.navLink} ${seccion === seccionActual ? styles.navLinkActive : ""}`}
            aria-current={seccion === seccionActual ? "page" : undefined}
          >
            {seccion.label}
          </Link>
        ))}
        {/* Vista pública de la tienda, tal como la ven los clientes, en otra pestaña. */}
        <Link
          href={`/tiendas/${sesion.idTienda}`}
          className={styles.navLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver tienda ↗<span className={styles.visuallyHidden}> (se abre en otra pestaña)</span>
        </Link>
      </nav>

      <main className={styles.main}>
        {autorizado ? (
          children
        ) : (
          <div className={styles.card}>
            <p role="alert">Tu rol no tiene permiso para ver esta sección.</p>
            <Link href="/mi-tienda">Volver al inicio de Mi tienda</Link>
          </div>
        )}
      </main>
    </div>
  );
}
