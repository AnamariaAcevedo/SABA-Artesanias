"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import homeStyles from "@/app/home/home.module.css";
import styles from "../tiendas.module.css";

import { Producto } from "@/types/Producto";
import { Tienda } from "@/types/Tienda";
import { obtenerTiendaPorId } from "@/services/tiendaService";
import { obtenerProductos } from "@/services/productoService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import BotonInicio from "@/components/catalogo/BotonInicio";
import ProductoCard from "@/components/catalogo/ProductoCard";
import { useHaySesion } from "@/lib/auth";

export default function TiendaDetallePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <TiendaDetalleContenido key={id} id={id} />
  );
}

function TiendaDetalleContenido({ id }: { id: string }) {
  const haySesion = useHaySesion();
  const idTienda = Number(id);

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [tiendaRespuesta, productosRespuesta] = await Promise.all([
          obtenerTiendaPorId(idTienda),
          obtenerProductos(undefined, idTienda),
        ]);
        if (cancelado) return;

        setTienda(tiendaRespuesta.data);
        setProductos(productosRespuesta.data);
        if (productosRespuesta.data.length === 0) {
          setMensaje("Esta tienda todavía no tiene productos publicados.");
        }
      } catch (error) {
        if (cancelado) return;
        console.error("Error cargando la tienda:", error);
        setMensaje("No pudimos cargar esta tienda.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [idTienda]);

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <BotonInicio />

        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        <Link href="/tiendas" className={styles.backButton}>
          ← Volver a tiendas
        </Link>

        {haySesion === undefined ? null : haySesion ? (
          <MenuUsuario />
        ) : (
          <Link href="/login" className={homeStyles.logoutButton} style={{ marginLeft: "auto" }}>
            Iniciar sesión
          </Link>
        )}
      </header>

      <div className={styles.content}>
        {cargando && <p className={styles.statusMessage}>Cargando tienda...</p>}

        {!cargando && tienda && (
          <>
            <section className={styles.storeBanner}>
              <div className={styles.storeBannerCover} aria-hidden="true">
                <span>{tienda.nombre.charAt(0).toUpperCase()}</span>
              </div>

              <div className={styles.storeBannerInfo}>
                <h2>{tienda.nombre}</h2>
                {tienda.descripcion && <p>{tienda.descripcion}</p>}
                <span className={styles.storeCardAddress}>{tienda.direccionCompleta}</span>
              </div>
            </section>

            {mensaje && <p className={styles.statusMessage}>{mensaje}</p>}

            {productos.length > 0 && (
              <div className={homeStyles.products}>
                {productos.map((producto) => (
                  <ProductoCard key={producto.id} producto={producto} />
                ))}
              </div>
            )}
          </>
        )}

        {!cargando && !tienda && (
          <p className={styles.statusMessage}>No encontramos esta tienda.</p>
        )}
      </div>
    </main>
  );
}
