"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import homeStyles from "@/app/home/home.module.css";
import styles from "./tiendas.module.css";

import { Producto } from "@/types/Producto";
import { Tienda } from "@/types/Tienda";
import { obtenerTiendas } from "@/services/tiendaService";
import { obtenerProductos } from "@/services/productoService";
import LogoutButton from "@/components/auth/LogoutButton";
import { useRolSesion } from "@/lib/auth";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8080").replace(/\/+$/, "");

const CANTIDAD_RECAP = 4;

export default function TiendasPage() {
  const rol = useRolSesion();

  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [productosPorTienda, setProductosPorTienda] = useState<Record<number, Producto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargarTiendas() {
      try {
        const respuesta = await obtenerTiendas();
        if (cancelado) return;

        setTiendas(respuesta.data);
        if (respuesta.data.length === 0) {
          setMensaje("No hay tiendas disponibles.");
          return;
        }

        // Recap: traemos algunos productos de cada tienda para mostrar
        // una vista previa en el listado.
        const resultados = await Promise.all(
          respuesta.data.map((tienda) =>
            obtenerProductos(undefined, tienda.id).catch(() => ({ data: [] as Producto[] }))
          )
        );
        if (cancelado) return;

        const mapa: Record<number, Producto[]> = {};
        respuesta.data.forEach((tienda, indice) => {
          mapa[tienda.id] = resultados[indice].data;
        });
        setProductosPorTienda(mapa);
      } catch (error) {
        if (cancelado) return;
        console.error("Error cargando tiendas:", error);
        setMensaje("No pudimos cargar las tiendas.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarTiendas();
    return () => {
      cancelado = true;
    };
  }, []);

  const tiendasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return tiendas;
    return tiendas.filter((tienda) => tienda.nombre.toLowerCase().includes(texto));
  }, [tiendas, busqueda]);

  function buscarTienda(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
  }

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        <Link href="/home" className={styles.backButton}>
          ← Volver al catálogo
        </Link>

        <form className={homeStyles.searchBar} onSubmit={buscarTienda}>
          <span className={homeStyles.searchIcon} aria-hidden="true">⌕</span>

          <input
            type="text"
            placeholder="Buscar tiendas..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            suppressHydrationWarning
          />

          <button type="submit" className={homeStyles.searchButton} suppressHydrationWarning>
            Buscar
          </button>
        </form>

        {rol === undefined ? null : rol ? (
          <LogoutButton className={homeStyles.logoutButton} />
        ) : (
          <Link href="/login" className={homeStyles.logoutButton} style={{ marginLeft: "auto" }}>
            Iniciar sesión
          </Link>
        )}
      </header>

      <div className={styles.content}>
        <h2 className={styles.pageTitle}>Tiendas</h2>

        {cargando && <p className={styles.statusMessage}>Cargando tiendas...</p>}
        {!cargando && mensaje && <p className={styles.statusMessage}>{mensaje}</p>}
        {!cargando && !mensaje && tiendasFiltradas.length === 0 && (
          <p className={styles.statusMessage}>No encontramos tiendas con ese nombre.</p>
        )}

        {!cargando && tiendasFiltradas.length > 0 && (
          <div className={styles.storeGrid}>
            {tiendasFiltradas.map((tienda) => {
              const recap = (productosPorTienda[tienda.id] ?? []).slice(0, CANTIDAD_RECAP);

              return (
                <Link key={tienda.id} href={`/tiendas/${tienda.id}`} className={styles.storeRow}>
                  <div className={styles.storeCover} aria-hidden="true">
                    <span>{tienda.nombre.charAt(0).toUpperCase()}</span>
                  </div>

                  <div className={styles.storeInfo}>
                    <h3>{tienda.nombre}</h3>
                    {tienda.descripcion && <p>{tienda.descripcion}</p>}
                    <span className={styles.storeCardAddress}>{tienda.nombreDireccion}</span>

                    {recap.length > 0 && (
                      <div className={styles.storeRecap}>
                        {recap.map((producto) => (
                          <div key={producto.id} className={styles.recapItem}>
                            <div className={styles.recapImage}>
                              {producto.idImagenPrincipal ? (
                                <img
                                  src={`${API_URL}/imagenes/${producto.idImagenPrincipal}`}
                                  alt={producto.nombre}
                                />
                              ) : (
                                <span>{producto.nombre}</span>
                              )}
                            </div>
                            <span className={styles.recapName}>{producto.nombre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
