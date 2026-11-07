"use client";

import Link from "next/link";

import homeStyles from "@/app/home/home.module.css";
import tiendasStyles from "@/app/tiendas/tiendas.module.css";

import MenuUsuario from "@/components/auth/MenuUsuario";
import Carrito from "@/components/carrito/Carrito";
import BotonInicio from "@/components/catalogo/BotonInicio";
import FeedPublicaciones from "@/components/publicaciones/FeedPublicaciones";
import { useHaySesion } from "@/lib/auth";

// Canal general: novedades y promociones vigentes de todas las tiendas.
export default function CanalPage() {
  const haySesion = useHaySesion();

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <BotonInicio />

        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        <Link href="/tiendas" className={homeStyles.navButton}>
          Tiendas
        </Link>

        {haySesion === undefined ? null : haySesion ? (
          <MenuUsuario />
        ) : (
          <Link href="/login" className={homeStyles.logoutButton} style={{ marginLeft: "auto" }}>
            Iniciar sesión
          </Link>
        )}

        <Carrito />
      </header>

      <div className={tiendasStyles.content}>
        <h2 className={tiendasStyles.pageTitle}>Canal</h2>
        <FeedPublicaciones textoVacio="Todavía no hay publicaciones disponibles." />
      </div>
    </main>
  );
}
