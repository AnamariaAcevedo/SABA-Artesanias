"use client";

import { FormEvent, useEffect, useState } from "react";

import styles from "./home.module.css";

import { Producto } from "@/types/Producto";
import { Tienda } from "@/types/Tienda";
import { Categoria } from "@/types/Categoria";
import { Subcategoria } from "@/types/Subcategoria";

import { obtenerProductos } from "@/services/productoService";
import { obtenerTiendas } from "@/services/tiendaService";
import {
  obtenerCategorias,
  obtenerSubcategoriasPorCategoria,
} from "@/services/categoriaService";

export default function HomePage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [tiendaSeleccionada, setTiendaSeleccionada] =
    useState<number | null>(null);

  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<number | null>(null);

  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] =
    useState<number | null>(null);

  async function cargarProductos(
    nombre?: string,
    idTienda?: number,
    idCategoria?: number,
    idSubcategoria?: number
  ) {
    try {
      setCargando(true);
      setMensaje("");

      const respuesta = await obtenerProductos(
        nombre,
        idTienda,
        idCategoria,
        idSubcategoria
      );

      setProductos(respuesta.data);

      if (respuesta.data.length === 0) {
        setMensaje("No se encontraron productos.");
      }
    } catch (error) {
      console.error("Error cargando productos:", error);

      setProductos([]);
      setMensaje("No fue posible cargar los productos.");
    } finally {
      setCargando(false);
    }
  }

  async function cargarTiendas() {
    try {
      const respuesta = await obtenerTiendas();

      setTiendas(respuesta.data);
    } catch (error) {
      console.error("Error cargando tiendas:", error);
    }
  }

async function cargarCategorias() {
  try {
    const respuesta = await obtenerCategorias();

    console.log("RESPUESTA CATEGORIAS:", respuesta);
    console.log("DATA CATEGORIAS:", respuesta.data);

    setCategorias(respuesta.data);
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

  useEffect(() => {
    cargarProductos();
    cargarTiendas();
    cargarCategorias();
  }, []);

  function buscarProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    cargarProductos(
      busqueda,
      tiendaSeleccionada ?? undefined,
      categoriaSeleccionada ?? undefined,
      subcategoriaSeleccionada ?? undefined
    );
  }

  async function seleccionarCategoria(idCategoria: number) {
    /*
     * Si vuelve a presionar la categoría ya seleccionada,
     * la cerramos y quitamos ese filtro.
     */
    if (categoriaSeleccionada === idCategoria) {
      setCategoriaSeleccionada(null);
      setSubcategoriaSeleccionada(null);
      setSubcategorias([]);

      cargarProductos(
        busqueda,
        tiendaSeleccionada ?? undefined
      );

      return;
    }

    try {
      setCategoriaSeleccionada(idCategoria);
      setSubcategoriaSeleccionada(null);

      const respuesta =
        await obtenerSubcategoriasPorCategoria(idCategoria);

      setSubcategorias(respuesta.data);

      cargarProductos(
        busqueda,
        tiendaSeleccionada ?? undefined,
        idCategoria
      );
    } catch (error) {
      console.error(
        "Error cargando subcategorías:",
        error
      );

      setSubcategorias([]);
    }
  }

  function seleccionarSubcategoria(idSubcategoria: number) {
    setSubcategoriaSeleccionada(idSubcategoria);

    cargarProductos(
      busqueda,
      tiendaSeleccionada ?? undefined,
      categoriaSeleccionada ?? undefined,
      idSubcategoria
    );
  }

  function seleccionarTienda(idTienda: number) {
    setTiendaSeleccionada(idTienda);

    cargarProductos(
      busqueda,
      idTienda,
      categoriaSeleccionada ?? undefined,
      subcategoriaSeleccionada ?? undefined
    );
  }

  function mostrarTodos() {
    setBusqueda("");

    setTiendaSeleccionada(null);

    setCategoriaSeleccionada(null);
    setSubcategoriaSeleccionada(null);
    setSubcategorias([]);

    cargarProductos();
  }

  return (
    <main className={styles.homeContainer}>
      <header className={styles.homeHeader}>
        <div className={styles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        <form
          className={styles.searchBar}
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

      <div className={styles.homeContent}>
        <aside className={styles.categories}>
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className={styles.categoryGroup}
            >
              <button
                type="button"
                className={
                  categoriaSeleccionada === categoria.id
                    ? `${styles.categoryButton} ${styles.selectedCategory}`
                    : styles.categoryButton
                }
                onClick={() =>
                  seleccionarCategoria(categoria.id)
                }
              >
                {categoria.nombre} →
              </button>

              {categoriaSeleccionada === categoria.id &&
                subcategorias.length > 0 && (
                  <div className={styles.subcategories}>
                    {subcategorias.map(
                      (subcategoria) => (
                        <button
                          type="button"
                          key={
                            subcategoria.subcategoriaId
                          }
                          className={
                            subcategoriaSeleccionada ===
                            subcategoria.subcategoriaId
                              ? `${styles.subcategoryButton} ${styles.selectedSubcategory}`
                              : styles.subcategoryButton
                          }
                          onClick={() =>
                            seleccionarSubcategoria(
                              subcategoria.subcategoriaId
                            )
                          }
                        >
                          {
                            subcategoria.subcategoriaNombre
                          }
                        </button>
                      )
                    )}
                  </div>
                )}
            </div>
          ))}

          {tiendas.length > 0 && (
            <div className={styles.storeFilter}>
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
                      ? styles.selectedStore
                      : ""
                  }
                >
                  {tienda.nombre}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className={styles.mainContent}>
          <section className={styles.banner}>
            <h2>
              CONOCÉ LAS
              <br />
              ARTESANÍAS
            </h2>
          </section>

          <div className={styles.dots}>
            <span className={styles.activeDot}></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <section className={styles.storeSection}>
            <div className={styles.storeTitle}>
              <h3>
                {tiendaSeleccionada
                  ? tiendas.find(
                      (tienda) =>
                        tienda.id ===
                        tiendaSeleccionada
                    )?.nombre
                  : categoriaSeleccionada
                    ? categorias.find(
                        (categoria) =>
                          categoria.id ===
                          categoriaSeleccionada
                      )?.nombre
                    : "Artesanías disponibles"}
              </h3>

              {(tiendaSeleccionada ||
                categoriaSeleccionada ||
                subcategoriaSeleccionada) && (
                <button
                  type="button"
                  className={styles.showAllButton}
                  onClick={mostrarTodos}
                >
                  Ver todas
                </button>
              )}
            </div>

            {cargando && (
              <p className={styles.statusMessage}>
                Cargando productos...
              </p>
            )}

            {!cargando && mensaje && (
              <p className={styles.statusMessage}>
                {mensaje}
              </p>
            )}

            {!cargando &&
              productos.length > 0 && (
                <div className={styles.products}>
                  {productos.map((producto) => (
                    <article
                      className={styles.productCard}
                      key={producto.id}
                    >
                      <div
                        className={styles.productImage}
                      >
                        <span>
                          {producto.nombre}
                        </span>
                      </div>

                      <div
                        className={styles.productInfo}
                      >
                        <div>
                          <h4>
                            {producto.nombre}
                          </h4>

                          <small>
                            {
                              producto.nombreTienda
                            }
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
                        <p
                          className={
                            styles.productDescription
                          }
                        >
                          {producto.descripcion}
                        </p>
                      )}

                      {producto.nombresSubcategorias &&
                        producto
                          .nombresSubcategorias
                          .length > 0 && (
                          <div
                            className={
                              styles.productCategories
                            }
                          >
                            {producto.nombresSubcategorias.map(
                              (
                                nombreSubcategoria
                              ) => (
                                <span
                                  key={
                                    nombreSubcategoria
                                  }
                                >
                                  {
                                    nombreSubcategoria
                                  }
                                </span>
                              )
                            )}
                          </div>
                        )}

                      <div
                        className={styles.productExtra}
                      >
                        {producto.puntuacion !==
                          null && (
                          <span>
                            ★{" "}
                            {
                              producto.puntuacion
                            }
                          </span>
                        )}

                        <span>
                          Stock:{" "}
                          {
                            producto.cantidadDisponible
                          }
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