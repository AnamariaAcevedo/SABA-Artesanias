"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import homeStyles from "@/app/home/home.module.css";
import styles from "./cupones.module.css";

import type { CuponPublico } from "@/types/cupon";
import { listarCuponesPublicos } from "@/services/cuponService";
import ModalCodigoCupon from "@/components/cupones/ModalCodigoCupon";
import MenuUsuario from "@/components/auth/MenuUsuario";
import Carrito from "@/components/carrito/Carrito";
import BotonBuscar from "@/components/catalogo/BotonBuscar";
import BuscadorConSugerencias, { coincide } from "@/components/buscador/BuscadorConSugerencias";
import BotonInicio from "@/components/catalogo/BotonInicio";
import { useHaySesion } from "@/lib/auth";

// Catálogo público de cupones vigentes de todas las tiendas. El código se
// muestra solo al pedirlo (botón "Obtener"), para que la lista quede limpia
// y el comprador copie el código recién cuando lo necesita.
export default function CuponesPage() {
  const haySesion = useHaySesion();

  const [cupones, setCupones] = useState<CuponPublico[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  // Cupón cuyo modal con el código está abierto (botón "Obtener").
  const [cuponAbierto, setCuponAbierto] = useState<CuponPublico | null>(null);
  const [busqueda, setBusqueda] = useState("");
  // Filtro por nombre de tienda, aplicado al escribir Enter o al vaciar el buscador.
  const [busquedaAplicada, setBusquedaAplicada] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargarCupones() {
      try {
        const { data } = await listarCuponesPublicos(1, 50);
        if (cancelado) return;
        setCupones(data);
        if (data.length === 0) setMensaje("No hay cupones disponibles por el momento.");
      } catch (error) {
        if (cancelado) return;
        console.error("Error cargando cupones:", error);
        setMensaje("No pudimos cargar los cupones.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarCupones();
    return () => {
      cancelado = true;
    };
  }, []);

  const cuponesFiltrados = useMemo(() => {
    if (!busquedaAplicada.trim()) return cupones;
    return cupones.filter((cupon) => coincide(cupon.nombreTienda, busquedaAplicada));
  }, [cupones, busquedaAplicada]);

  function buscarPorTienda(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setBusquedaAplicada(busqueda);
  }

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor);
    if (valor.trim() === "") setBusquedaAplicada("");
  }

  // Los cupones ya están cargados: las sugerencias se calculan sin ir al servidor.
  function sugerirTiendas(texto: string) {
    const nombres = new Set<string>();
    return cupones
      .filter((cupon) => coincide(cupon.nombreTienda, texto) && !nombres.has(cupon.nombreTienda) && nombres.add(cupon.nombreTienda))
      .map((cupon) => ({ clave: cupon.idTienda, texto: cupon.nombreTienda }));
  }

  function obtenerCupon(cupon: CuponPublico) {
    setCuponAbierto(cupon);
  }

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <BotonInicio />

        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        <form className={homeStyles.searchBar} onSubmit={buscarPorTienda}>
          <BuscadorConSugerencias
            claseContenedor={homeStyles.searchField}
            placeholder="Buscar por tienda..."
            aria-label="Buscar cupones por tienda"
            valor={busqueda}
            alCambiar={cambiarBusqueda}
            obtenerSugerencias={sugerirTiendas}
            alSeleccionar={(sugerencia) => {
              setBusqueda(sugerencia.texto);
              setBusquedaAplicada(sugerencia.texto);
            }}
            suppressHydrationWarning
          />

          <BotonBuscar />
        </form>

        {haySesion === undefined ? null : haySesion ? (
          <MenuUsuario />
        ) : (
          <Link href="/login" className={homeStyles.logoutButton} style={{ marginLeft: "auto" }}>
            Iniciar sesión
          </Link>
        )}

        <Carrito />
      </header>

      <div className={styles.content}>
        <h2 className={styles.pageTitle}>Cupones</h2>

        {cargando && <p className={styles.statusMessage}>Cargando cupones...</p>}
        {!cargando && mensaje && <p className={styles.statusMessage}>{mensaje}</p>}
        {!cargando && !mensaje && cuponesFiltrados.length === 0 && (
          <p className={styles.statusMessage}>No encontramos cupones de esa tienda.</p>
        )}

        {!cargando && cuponesFiltrados.length > 0 && (
          <div className={styles.couponGrid}>
            {cuponesFiltrados.map((cupon) => (
              <div key={cupon.id} className={styles.couponCard}>
                <div className={styles.couponHeader}>
                  <div>
                    <h3>{cupon.nombre}</h3>
                    <p className={styles.couponStore}>{cupon.nombreTienda}</p>
                  </div>
                  <span className={styles.couponDiscount}>−{cupon.porcentaje}%</span>
                </div>

                <button type="button" className={styles.obtenerButton} onClick={() => obtenerCupon(cupon)}>
                  Obtener
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {cuponAbierto && <ModalCodigoCupon cupon={cuponAbierto} onCerrar={() => setCuponAbierto(null)} />}
    </main>
  );
}
