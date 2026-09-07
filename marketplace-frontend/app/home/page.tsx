"use client";

import { FormEvent, useEffect, useState } from "react";
import "./home.css";

import { Producto } from "@/types/Producto";
import { Tienda } from "@/types/Tienda";

import { obtenerProductos } from "@/services/productoService";
import { obtenerTiendas } from "@/services/tiendaService";

export default function HomePage() {
  // Estas categorías son solamente visuales por ahora.
  // El backend actual todavía no tiene categorías/subcategorías.
  const categorias = [
    "Cuero",
    "Madera",
    "Cerámica",
    "Bordados",
    "Ñandutí",
    "Tejidos",
    "Metal",
  ];

  // Lista de productos obtenidos del backend.
  const [productos, setProductos] = useState<Producto[]>([]);

  // Lista de tiendas obtenidas del backend.
  const [tiendas, setTiendas] = useState<Tienda[]>([]);

  // Texto escrito en el buscador.
  const [busqueda, setBusqueda] = useState("");

  // Sirve para mostrar "Cargando productos..."
  const [cargando, setCargando] = useState(false);

  // Mensajes de error o cuando no existen productos.
  const [mensaje, setMensaje] = useState("");

  // Guarda la tienda seleccionada.
  const [tiendaSeleccionada, setTiendaSeleccionada] =
    useState<number | null>(null);

  /*
   * Obtiene los productos utilizando productoService.ts.
   *
   * Puede recibir:
   * - nombre del producto
   * - id de una tienda
   */
  async function cargarProductos(
    nombre?: string,
    idTienda?: number
  ) {
    try {
      setCargando(true);
      setMensaje("");

      const respuesta = await obtenerProductos(
        nombre,
        idTienda
      );

      setProductos(respuesta.data);

      if (respuesta.data.length === 0) {
        setMensaje("No se encontraron productos.");
      }
    } catch (error) {
      console.error("Error cargando productos:", error);

      setProductos([]);

      setMensaje(
        "No fue posible cargar los productos."
      );
    } finally {
      setCargando(false);
    }
  }

  /*
   * Obtiene las tiendas existentes.
   */
  async function cargarTiendas() {
    try {
      const respuesta = await obtenerTiendas();

      setTiendas(respuesta.data);
    } catch (error) {
      console.error("Error cargando tiendas:", error);
    }
  }

  /*
   * Se ejecuta una vez cuando se abre el Home.
   *
   * Carga:
   * - productos
   * - tiendas
   */
  useEffect(() => {
    cargarProductos();
    cargarTiendas();
  }, []);

  /*
   * Se ejecuta cuando el usuario presiona Buscar
   * o Enter dentro del buscador.
   */
  function buscarProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    cargarProductos(
      busqueda,
      tiendaSeleccionada ?? undefined
    );
  }

  /*
   * Filtra los productos por tienda.
   */
  function seleccionarTienda(idTienda: number) {
    setTiendaSeleccionada(idTienda);

    cargarProductos(
      busqueda,
      idTienda
    );
  }

  /*
   * Elimina los filtros y vuelve a mostrar todo.
   */
  function mostrarTodos() {
    setBusqueda("");
    setTiendaSeleccionada(null);

    cargarProductos();
  }

  return (
    <main className="home-container">

      {/* =========================
          CABECERA
      ========================== */}

      <header className="home-header">

        <div className="logo">
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        {/* BUSCADOR */}

        <form
          className="search-bar"
          onSubmit={buscarProducto}
        >
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(evento) =>
              setBusqueda(evento.target.value)
            }
          />

          <button type="submit">
            Buscar
          </button>
        </form>

      </header>

      {/* =========================
          CONTENIDO
      ========================== */}

      <div className="home-content">

        {/* =========================
            MENÚ IZQUIERDO
        ========================== */}

        <aside className="categories">

          {categorias.map((categoria) => (
            <button
              type="button"
              key={categoria}
              className="category-button"
            >
              {categoria} →
            </button>
          ))}

          {/* TIENDAS REALES DEL BACKEND */}

          {tiendas.length > 0 && (
            <div className="store-filter">

              <h4>Tiendas</h4>

              <button
                type="button"
                onClick={mostrarTodos}
              >
                Todas
              </button>

              {tiendas.map((tienda) => (
                <button
                  type="button"
                  key={tienda.id}
                  onClick={() =>
                    seleccionarTienda(tienda.id)
                  }
                  className={
                    tiendaSeleccionada === tienda.id
                      ? "selected-store"
                      : ""
                  }
                >
                  {tienda.nombre}
                </button>
              ))}

            </div>
          )}

        </aside>

        {/* =========================
            PARTE PRINCIPAL
        ========================== */}

        <section className="main-content">

          {/* BANNER */}

          <section className="banner">

            <h2>
              CONOCÉ LAS
              <br />
              ARTESANÍAS
            </h2>

          </section>

          {/* PUNTOS DEL BANNER */}

          <div className="dots">
            <span className="active-dot"></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* =========================
              PRODUCTOS
          ========================== */}

          <section className="store-section">

            <div className="store-title">

              <h3>
                {tiendaSeleccionada
                  ? tiendas.find(
                      (tienda) =>
                        tienda.id === tiendaSeleccionada
                    )?.nombre
                  : "Artesanías disponibles"}
              </h3>

              {tiendaSeleccionada && (
                <button
                  type="button"
                  className="show-all-button"
                  onClick={mostrarTodos}
                >
                  Ver todas
                </button>
              )}

            </div>

            {/* CARGANDO */}

            {cargando && (
              <p className="status-message">
                Cargando productos...
              </p>
            )}

            {/* MENSAJE */}

            {!cargando && mensaje && (
              <p className="status-message">
                {mensaje}
              </p>
            )}

            {/* PRODUCTOS */}

            {!cargando && productos.length > 0 && (

              <div className="products">

                {productos.map((producto) => (

                  <article
                    className="product-card"
                    key={producto.id}
                  >

                    {/*
                      El backend todavía no tiene imágenes.
                      Por ahora dejamos este espacio visual.
                    */}

                    <div className="product-image">
                      <span>
                        {producto.nombre}
                      </span>
                    </div>

                    <div className="product-info">

                      <div>

                        <h4>
                          {producto.nombre}
                        </h4>

                        <small>
                          {producto.nombreTienda}
                        </small>

                      </div>

                      <strong>
                        {producto.precio.toLocaleString(
                          "es-PY"
                        )}{" "}
                        GS
                      </strong>

                    </div>

                    {producto.descripcion && (

                      <p className="product-description">
                        {producto.descripcion}
                      </p>

                    )}

                    <div className="product-extra">

                      {producto.puntuacion !== null && (
                        <span>
                          ★ {producto.puntuacion}
                        </span>
                      )}

                      <span>
                        Stock:{" "}
                        {producto.cantidadDisponible}
                      </span>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </section>

        </section>

      </div>

    </main>
  );
}