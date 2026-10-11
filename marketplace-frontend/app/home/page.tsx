"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import styles from "./home.module.css";

import { Producto } from "@/types/Producto";
import { Categoria } from "@/types/Categoria";
import { Subcategoria } from "@/types/Subcategoria";

import { obtenerProductos } from "@/services/productoService";
import {
  obtenerCategorias,
  obtenerSubcategoriasPorCategoria,
} from "@/services/categoriaService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import BotonBuscar from "@/components/catalogo/BotonBuscar";
import ProductoCard from "@/components/catalogo/ProductoCard";
import { useHaySesion } from "@/lib/auth";

export default function HomePage() {
  const haySesion = useHaySesion();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaHover, setCategoriaHover] = useState<number | null>(null);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState<
    Record<number, Subcategoria[]>
  >({});

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [menuFijado, setMenuFijado] = useState(false);
  const [menuEnHover, setMenuEnHover] = useState(false);
  const menuAbierto = menuFijado || menuEnHover;

  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<number | null>(null);

  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] =
    useState<number | null>(null);

  async function cargarProductos(
    nombre?: string,
    idCategoria?: number,
    idSubcategoria?: number
  ) {
    try {
      setCargando(true);
      setMensaje("");

      const respuesta = await obtenerProductos(
        nombre,
        undefined,
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

async function cargarCategorias() {
  try {
    const respuesta = await obtenerCategorias();

    console.log("RESPUESTA CATEGORIAS:", respuesta);
    console.log("DATA CATEGORIAS:", respuesta.data);

    setCategorias(respuesta.data);

    // Precarga las subcategorías de todas las categorías para poder
    // agrupar el catálogo completo por categoría (ver `productosPorCategoria`).
    respuesta.data.forEach((categoria) => {
      asegurarSubcategorias(categoria.id);
    });
  } catch (error) {
    console.error("Error cargando categorías:", error);
  }
}

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  function buscarProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    cargarProductos(
      busqueda,
      categoriaSeleccionada ?? undefined,
      subcategoriaSeleccionada ?? undefined
    );
  }

  async function asegurarSubcategorias(idCategoria: number) {
    if (subcategoriasPorCategoria[idCategoria]) return;

    try {
      const respuesta = await obtenerSubcategoriasPorCategoria(idCategoria);

      setSubcategoriasPorCategoria((previo) => ({
        ...previo,
        [idCategoria]: respuesta.data,
      }));
    } catch (error) {
      console.error("Error cargando subcategorías:", error);
    }
  }

  async function seleccionarCategoria(idCategoria: number) {
    /*
     * Si vuelve a presionar la categoría ya seleccionada,
     * la cerramos y quitamos ese filtro.
     */
    if (categoriaSeleccionada === idCategoria) {
      setCategoriaSeleccionada(null);
      setSubcategoriaSeleccionada(null);

      cargarProductos(busqueda);

      return;
    }

    setCategoriaSeleccionada(idCategoria);
    setSubcategoriaSeleccionada(null);

    await asegurarSubcategorias(idCategoria);

    cargarProductos(busqueda, idCategoria);
  }

  function seleccionarSubcategoria(idCategoria: number, idSubcategoria: number) {
    setCategoriaSeleccionada(idCategoria);
    setSubcategoriaSeleccionada(idSubcategoria);

    cargarProductos(busqueda, idCategoria, idSubcategoria);
  }

  function mostrarTodos() {
    setBusqueda("");

    setCategoriaSeleccionada(null);
    setSubcategoriaSeleccionada(null);

    cargarProductos();
  }

  // Sin un filtro de categoría activo, el catálogo se separa en secciones
  // por categoría en vez de mostrar todos los productos juntos.
  const sinFiltro = categoriaSeleccionada === null;

  const productosPorCategoria = useMemo(() => {
    if (!sinFiltro || categorias.length === 0) return [];

    const grupos = categorias.map((categoria) => ({
      categoria,
      productos: [] as Producto[],
    }));

    const otros: Producto[] = [];

    productos.forEach((producto) => {
      const grupo = grupos.find(({ categoria }) => {
        const idsSubcategoria =
          subcategoriasPorCategoria[categoria.id]?.map(
            (subcategoria) => subcategoria.subcategoriaId
          ) ?? [];

        return producto.idsSubcategorias.some((id) =>
          idsSubcategoria.includes(id)
        );
      });

      if (grupo) {
        grupo.productos.push(producto);
      } else {
        otros.push(producto);
      }
    });

    const seccionesConProductos = grupos.filter(
      (grupo) => grupo.productos.length > 0
    );

    if (otros.length > 0) {
      seccionesConProductos.push({
        categoria: { id: -1, nombre: "Otros" } as Categoria,
        productos: otros,
      });
    }

    return seccionesConProductos;
  }, [sinFiltro, productos, categorias, subcategoriasPorCategoria]);

  return (
    <main className={styles.homeContainer}>
      <header className={styles.homeHeader}>
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={menuAbierto ? "Cerrar menú de categorías" : "Abrir menú de categorías"}
          aria-expanded={menuAbierto}
          onClick={() => setMenuFijado((valor) => !valor)}
          onMouseEnter={() => setMenuEnHover(true)}
          onMouseLeave={() => setMenuEnHover(false)}
          suppressHydrationWarning
        >
          <span className={styles.menuBar} />
          <span className={styles.menuBar} />
          <span className={styles.menuBar} />
        </button>

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
            suppressHydrationWarning
          />

          <BotonBuscar />
        </form>

        <Link href="/tiendas" className={styles.navButton}>
          Tiendas
        </Link>

        {haySesion === undefined ? null : haySesion ? (
          <MenuUsuario />
        ) : (
          <>
            {/* Sin sesión, acceso a la portada (/) junto a "Iniciar sesión". */}
            <Link href="/" className={styles.navButton} style={{ marginLeft: "auto" }}>
              Inicio
            </Link>
            <Link href="/login" className={styles.logoutButton}>
              Iniciar sesión
            </Link>
          </>
        )}
      </header>

      <div className={styles.homeContent}>
        <aside
          className={`${styles.categories} ${menuAbierto ? styles.categoriesOpen : ""}`}
          onMouseEnter={() => setMenuEnHover(true)}
          onMouseLeave={() => setMenuEnHover(false)}
        >
          <div className={styles.categoriesContent}>
            {categorias.map((categoria) => {
              const subcategoriasCategoria =
                subcategoriasPorCategoria[categoria.id] ?? [];
              const desplegada =
                categoriaHover === categoria.id ||
                categoriaSeleccionada === categoria.id;

              return (
                <div
                  key={categoria.id}
                  className={styles.categoryGroup}
                  onMouseEnter={() => {
                    setCategoriaHover(categoria.id);
                    asegurarSubcategorias(categoria.id);
                  }}
                  onMouseLeave={() =>
                    setCategoriaHover((actual) =>
                      actual === categoria.id ? null : actual
                    )
                  }
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
                    {categoria.nombre}
                  </button>

                  {desplegada && subcategoriasCategoria.length > 0 && (
                    <div className={styles.subcategories}>
                      {subcategoriasCategoria.map(
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
                                categoria.id,
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
              );
            })}
          </div>
        </aside>

        <section className={styles.mainContent}>
          <section className={styles.banner}>
            <h2>CONOCÉ LAS ARTESANÍAS</h2>
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
                {categoriaSeleccionada
                  ? categorias.find(
                      (categoria) =>
                        categoria.id ===
                        categoriaSeleccionada
                    )?.nombre
                  : "Artesanías disponibles"}
              </h3>

              {(categoriaSeleccionada || subcategoriaSeleccionada) && (
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
              productos.length > 0 &&
              (sinFiltro ? (
                <div className={styles.categorySections}>
                  {productosPorCategoria.map(({ categoria, productos: productosCategoria }) => (
                    <section key={categoria.id} className={styles.categorySection}>
                      <h4 className={styles.categorySectionTitle}>
                        {categoria.nombre}
                      </h4>

                      <div className={styles.products}>
                        {productosCategoria.map((producto) => (
                          <ProductoCard key={producto.id} producto={producto} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className={styles.products}>
                  {productos.map((producto) => (
                    <ProductoCard key={producto.id} producto={producto} />
                  ))}
                </div>
              ))}
          </section>
        </section>
      </div>
    </main>
  );
}
