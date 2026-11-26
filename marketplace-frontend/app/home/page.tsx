"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./home.module.css";

import { Producto } from "@/types/Producto";
import { Categoria } from "@/types/Categoria";
import { Subcategoria } from "@/types/Subcategoria";

import { obtenerProductos, sugerirProductos } from "@/services/productoService";
import {
  obtenerCategorias,
  obtenerSubcategoriasPorCategoria,
} from "@/services/categoriaService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import Carrito from "@/components/carrito/Carrito";
import BotonBuscar from "@/components/catalogo/BotonBuscar";
import BuscadorConSugerencias, { type Sugerencia } from "@/components/buscador/BuscadorConSugerencias";
import ProductoCard from "@/components/catalogo/ProductoCard";
import SeccionCategoria from "@/components/catalogo/SeccionCategoria";
import CarruselDestacados from "@/components/catalogo/CarruselDestacados";
import IconoCategoria from "@/components/catalogo/IconoCategoria";
import { useHaySesion } from "@/lib/auth";

// Devuelve una copia de la lista en orden aleatorio (Fisher-Yates).
function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export default function HomePage() {
  const router = useRouter();
  const haySesion = useHaySesion();

  const [productos, setProductos] = useState<Producto[]>([]);
  // Piezas con foto para el carrusel "Conocé las artesanías" (no cambian con los filtros).
  const [destacados, setDestacados] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaHover, setCategoriaHover] = useState<number | null>(null);
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState<
    Record<number, Subcategoria[]>
  >({});

  const [categoriasListas, setCategoriasListas] = useState(false);
  // Secciones sin categoría propia ("Otros") que se expanden en el lugar.
  const [otrosExpandido, setOtrosExpandido] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  // Arranca en true: la primera carga la dispara el efecto inicial.
  const [cargando, setCargando] = useState(true);
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

      mostrarProductos(respuesta.data);
    } catch (error) {
      mostrarErrorProductos(error);
    } finally {
      setCargando(false);
    }
  }

  function mostrarProductos(lista: Producto[]) {
    setProductos(lista);
    setMensaje(lista.length === 0 ? "No se encontraron productos." : "");
  }

  function mostrarErrorProductos(error: unknown) {
    console.error("Error cargando productos:", error);
    setProductos([]);
    setMensaje("No fue posible cargar los productos.");
  }

  // Carga inicial: el estado se actualiza recién cuando llega cada respuesta
  // (`cargando` ya empieza en true), sin setState sincrónico dentro del efecto.
  useEffect(() => {
    let cancelado = false;

    obtenerProductos()
      .then((respuesta) => {
        if (!cancelado) mostrarProductos(respuesta.data);
      })
      .catch((error) => {
        if (!cancelado) mostrarErrorProductos(error);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    async function cargarCategorias() {
      try {
        const respuesta = await obtenerCategorias();

        // Precarga las subcategorías de todas las categorías antes de agrupar el
        // catálogo; si se agrupara antes, los productos caerían en "Otros" y
        // luego saltarían de sección.
        const subcategorias = await Promise.all(
          respuesta.data.map(async (categoria) => {
            try {
              const r = await obtenerSubcategoriasPorCategoria(categoria.id);
              return [categoria.id, r.data] as const;
            } catch (error) {
              console.error("Error cargando subcategorías:", error);
              return [categoria.id, [] as Subcategoria[]] as const;
            }
          })
        );

        if (cancelado) return;
        setSubcategoriasPorCategoria(Object.fromEntries(subcategorias));
        setCategorias(respuesta.data);
      } catch (error) {
        console.error("Error cargando categorías:", error);
      } finally {
        if (!cancelado) setCategoriasListas(true);
      }
    }

    async function cargarDestacados() {
      try {
        const respuesta = await obtenerProductos();
        const conFoto = respuesta.data.filter(
          (producto) => producto.idImagenPrincipal !== null && producto.cantidadDisponible > 0
        );

        if (cancelado) return;
        // Orden aleatorio para que el carrusel muestre piezas distintas en cada visita.
        setDestacados(mezclar(conFoto).slice(0, 6));
      } catch (error) {
        console.error("Error cargando destacados:", error);
      }
    }

    cargarCategorias();
    cargarDestacados();

    return () => {
      cancelado = true;
    };
  }, []);

  function buscarProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    cargarProductos(
      busqueda,
      categoriaSeleccionada ?? undefined,
      subcategoriaSeleccionada ?? undefined
    );
  }

  async function sugerirCatalogo(texto: string): Promise<Sugerencia[]> {
    const respuesta = await sugerirProductos(texto);
    return respuesta.data.map((producto) => ({
      clave: producto.id,
      texto: producto.nombre,
      detalle: `${producto.nombreTienda} · ${producto.precioFinal.toLocaleString("es-PY")} GS`,
    }));
  }

  // Al vaciar el buscador se vuelven a mostrar todos los productos (con los filtros de categoría).
  function cambiarBusqueda(valor: string) {
    setBusqueda(valor);
    if (valor.trim() === "" && busqueda.trim() !== "") {
      cargarProductos(undefined, categoriaSeleccionada ?? undefined, subcategoriaSeleccionada ?? undefined);
    }
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
    if (!sinFiltro) return [];

    const grupos = categorias.map((categoria) => ({
      categoria,
      idsSubcategoria: new Set(
        (subcategoriasPorCategoria[categoria.id] ?? []).map(
          (subcategoria) => subcategoria.subcategoriaId
        )
      ),
      productos: [] as Producto[],
    }));

    const otros: Producto[] = [];

    // Un producto aparece en cada categoría a la que pertenece (no solo en la primera).
    productos.forEach((producto) => {
      let ubicado = false;

      grupos.forEach((grupo) => {
        if (producto.idsSubcategorias.some((id) => grupo.idsSubcategoria.has(id))) {
          grupo.productos.push(producto);
          ubicado = true;
        }
      });

      if (!ubicado) otros.push(producto);
    });

    const seccionesConProductos = grupos
      .filter((grupo) => grupo.productos.length > 0)
      .map(({ categoria, productos }) => ({ categoria, productos }));

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
          <BuscadorConSugerencias
            claseContenedor={styles.searchField}
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
            valor={busqueda}
            alCambiar={cambiarBusqueda}
            obtenerSugerencias={sugerirCatalogo}
            alSeleccionar={(sugerencia) => router.push(`/productos/${sugerencia.clave}`)}
            suppressHydrationWarning
          />

          <BotonBuscar />
        </form>

        <Link href="/tiendas" className={styles.navButton}>
          Tiendas
        </Link>

        <Link href="/cupones" className={styles.navButton}>
          Cupones
        </Link>

        <Link href="/canal" className={styles.navButton}>
          Canal
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

        <Carrito />
      </header>

      <div className={styles.homeContent}>
        <aside
          className={`${styles.categories} ${menuAbierto ? styles.categoriesOpen : ""}`}
          onMouseEnter={() => setMenuEnHover(true)}
          onMouseLeave={() => setMenuEnHover(false)}
        >
          <div className={styles.categoriesContent}>
            <p className={styles.categoriesHeading}>Categorías</p>

            <button
              type="button"
              className={
                categoriaSeleccionada === null
                  ? `${styles.categoryButton} ${styles.selectedCategory}`
                  : styles.categoryButton
              }
              onClick={mostrarTodos}
            >
              <span className={styles.categoryIcon}>
                <IconoCategoria todas />
              </span>
              <span className={styles.categoryName}>Todas las artesanías</span>
            </button>

            <div className={styles.categoriesDivider} />

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
                    aria-expanded={subcategoriasCategoria.length > 0 ? desplegada : undefined}
                  >
                    <span className={styles.categoryIcon}>
                      <IconoCategoria nombre={categoria.nombre} />
                    </span>
                    <span className={styles.categoryName}>{categoria.nombre}</span>
                    {subcategoriasCategoria.length > 0 && (
                      <svg
                        className={`${styles.categoryChevron} ${desplegada ? styles.categoryChevronOpen : ""}`}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    )}
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
          <CarruselDestacados productos={destacados} />

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
                !categoriasListas ? (
                  <p className={styles.statusMessage}>Cargando catálogo...</p>
                ) : (
                  <div className={styles.categorySections}>
                    {productosPorCategoria.map(({ categoria, productos: productosCategoria }) => (
                      <SeccionCategoria
                        key={categoria.id}
                        titulo={categoria.nombre}
                        productos={productosCategoria}
                        expandida={categoria.id === -1 && otrosExpandido}
                        alVerTodos={() => {
                          if (categoria.id === -1) {
                            setOtrosExpandido(true);
                            return;
                          }
                          seleccionarCategoria(categoria.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    ))}
                  </div>
                )
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
