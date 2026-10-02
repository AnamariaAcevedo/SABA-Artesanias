"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "@/components/admin/admin.module.css";
import AvatarUsuario from "@/components/auth/AvatarUsuario";
import MenuUsuario from "@/components/auth/MenuUsuario";
import { useSesion } from "@/components/auth/SesionProvider";
import perfilStyles from "./perfil.module.css";

// Perfil propio de solo lectura. Usa los datos que ya expone /me (vía
// SesionProvider), que cualquier usuario autenticado puede consultar.
export default function PerfilPage() {
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
          {cargando ? "Cargando perfil…" : "Redirigiendo…"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>•SABA•</span>
        <span className={styles.subtitle}>Mi perfil</span>
        <MenuUsuario />
      </header>

      <main className={styles.main}>
        <div className={perfilStyles.contenedor}>
          <Link href="/home" className={styles.backLink}>
            ← Volver al inicio
          </Link>

          <div className={perfilStyles.encabezado}>
            <AvatarUsuario
              nombre={sesion.nombre}
              apellido={sesion.apellido}
              className={perfilStyles.foto}
            />
            <h2 className={styles.title}>
              {sesion.nombre} {sesion.apellido}
            </h2>
          </div>

          <div className={styles.card}>
            <dl className={perfilStyles.datos}>
              <div className={perfilStyles.dato}>
                <dt>Nombre</dt>
                <dd>{sesion.nombre}</dd>
              </div>
              <div className={perfilStyles.dato}>
                <dt>Apellido</dt>
                <dd>{sesion.apellido}</dd>
              </div>
              <div className={perfilStyles.dato}>
                <dt>Nombre de usuario</dt>
                <dd>{sesion.usuario}</dd>
              </div>
              <div className={perfilStyles.dato}>
                <dt>Correo electrónico</dt>
                <dd>{sesion.email}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
