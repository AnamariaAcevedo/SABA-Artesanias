"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import homeStyles from "@/app/home/home.module.css";
import tiendasStyles from "@/app/tiendas/tiendas.module.css";
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

        <Link href="/tiendas" className={homeStyles.navButton}>
          Tiendas
        </Link>

        <Link href="/canal" className={homeStyles.navButton}>
          Canal
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

      <div className={styles.content}>
        <header className={tiendasStyles.encabezado}>
          <p className={tiendasStyles.eyebrow}>Descuentos de las tiendas</p>
          <h2 className={tiendasStyles.pageTitle}>Cupones</h2>
        </header>

        {cargando && <p className={styles.statusMessage}>Cargando cupones...</p>}
        {!cargando && mensaje && <p className={styles.statusMessage}>{mensaje}</p>}
        {!cargando && !mensaje && cuponesFiltrados.length === 0 && (
          <p className={styles.statusMessage}>No encontramos cupones de esa tienda.</p>
        )}

        {!cargando && cuponesFiltrados.length > 0 && (
          <div className={styles.couponGrid}>
            {cuponesFiltrados.map((cupon) => (
              <article key={cupon.id} className={styles.couponCard}>
                {/* Talón del vale con el porcentaje. */}
                <div className={styles.couponStub}>
                  <span className={styles.couponDiscount}>{cupon.porcentaje}%</span>
                  <span className={styles.couponOff}>de descuento</span>
                </div>

                <div className={styles.couponBody}>
                  <h3 className={styles.couponName}>{cupon.nombre}</h3>
                  <Link href={`/tiendas/${cupon.idTienda}`} className={styles.couponStore}>
                    {cupon.nombreTienda}
                  </Link>

                  <button type="button" className={styles.obtenerButton} onClick={() => obtenerCupon(cupon)}>
                    Obtener cupón
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {cuponAbierto && <ModalCodigoCupon cupon={cuponAbierto} onCerrar={() => setCuponAbierto(null)} />}
    </main>
  );
}
