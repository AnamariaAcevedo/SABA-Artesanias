"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import homeStyles from "@/app/home/home.module.css";
import styles from "./confirmar.module.css";

import type { Pedido, PedidoCreateInput } from "@/types/pedido";
import { obtenerProductoPorId } from "@/services/productoService";
import { cancelarPedidoPropio, crearPedido } from "@/services/pedidoService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import UbicacionFields from "@/components/auth/UbicacionFields";
import BotonInicio from "@/components/catalogo/BotonInicio";
import { useHaySesion } from "@/lib/auth";
import {
  cambiarCantidadCarrito,
  formatearPrecio,
  quitarDelCarrito,
  quitarVariosDelCarrito,
  sincronizarCarrito,
  useCarrito,
  type ItemCarrito,
} from "@/lib/carrito";

type Entrega = "cuenta" | "otra";

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? "").trim();
}

// Confirmación de la compra: resume el carrito, vuelve a consultar el stock de
// cada producto y pide los datos de entrega. Como cada pedido pertenece a una
// sola tienda, se registra un pedido por cada tienda presente en el carrito.
export default function ConfirmarCompraPage() {
  const router = useRouter();
  const haySesion = useHaySesion();
  const { items } = useCarrito();

  // Lista de productos (ids) cuyo stock ya se consultó en el servidor.
  const [verificados, setVerificados] = useState<string | null>(null);
  const [entrega, setEntrega] = useState<Entrega>("cuenta");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [creados, setCreados] = useState<Pedido[]>([]);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [errorCancelacion, setErrorCancelacion] = useState("");
  // Tiendas cuyo pedido se canceló antes de confirmar (sus productos siguen en el carrito).
  const [excluidas, setExcluidas] = useState<number[]>([]);

  const idsProductos = items.map((item) => item.idProducto).join(",");

  // Refresca precio y stock vigentes antes de dejar confirmar.
  useEffect(() => {
    let cancelado = false;
    const ids = idsProductos ? idsProductos.split(",").map(Number) : [];

    async function verificar() {
      const respuestas = await Promise.all(
        ids.map((id) => obtenerProductoPorId(id).then((r) => r.data).catch(() => null)),
      );
      if (cancelado) return;
      sincronizarCarrito(respuestas.filter((producto) => producto !== null));
      setVerificados(ids.join(","));
    }

    void verificar();
    return () => {
      cancelado = true;
    };
  }, [idsProductos]);

  const verificando = verificados !== idsProductos;
  const usarCuenta = haySesion === true && entrega === "cuenta";

  const porTienda = items.reduce<Record<number, ItemCarrito[]>>((grupos, item) => {
    (grupos[item.idTienda] ??= []).push(item);
    return grupos;
  }, {});

  // Cancelar un pedido o la compra no toca el carrito: los productos quedan
  // guardados para comprarlos más adelante. Solo se excluyen de esta compra.
  const incluidos = items.filter((item) => !excluidas.includes(item.idTienda));
  const totalIncluido = incluidos.reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0);
  const sinStockSuficiente = incluidos.filter((item) => item.cantidad > item.cantidadDisponible);

  function cancelarPedidoTienda(idTienda: number) {
    setExcluidas((actuales) => [...actuales, idTienda]);
  }

  function incluirPedidoTienda(idTienda: number) {
    setExcluidas((actuales) => actuales.filter((id) => id !== idTienda));
  }

  function cancelarCompra() {
    router.push("/home");
  }

  // Cancela un pedido ya registrado (solo con sesión y mientras siga pendiente).
  async function cancelarRegistrado(pedido: Pedido) {
    if (cancelandoId !== null) return;
    if (!window.confirm(`¿Querés cancelar el pedido #${pedido.id}?`)) return;

    setCancelandoId(pedido.id);
    setErrorCancelacion("");
    try {
      const cancelado = await cancelarPedidoPropio(pedido.id);
      setCreados((actuales) => actuales.map((actual) => (actual.id === cancelado.id ? cancelado : actual)));
    } catch (cause) {
      setErrorCancelacion(cause instanceof Error ? cause.message : "No pudimos cancelar el pedido.");
    } finally {
      setCancelandoId(null);
    }
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando || sinStockSuficiente.length > 0 || incluidos.length === 0) return;

    const datos = new FormData(evento.currentTarget);
    const idBarrio = Number(datos.get("idBarrio")) || undefined;

    if (!usarCuenta && !idBarrio) {
      setError("Seleccioná la ubicación de entrega hasta el barrio.");
      return;
    }

    const entregaBase: Omit<PedidoCreateInput, "idTienda" | "items"> = {
      referencia: texto(datos, "referencia") || undefined,
    };
    if (!usarCuenta) {
      entregaBase.idBarrio = idBarrio;
      entregaBase.direccion = texto(datos, "direccion");
    }
    if (haySesion !== true) {
      entregaBase.nombreReceptor = texto(datos, "nombreReceptor");
      entregaBase.telefonoReceptor = texto(datos, "telefonoReceptor");
      entregaBase.emailReceptor = texto(datos, "emailReceptor");
    }

    setEnviando(true);
    setError("");

    const registrados: Pedido[] = [];
    try {
      for (const [idTienda, lineas] of Object.entries(porTienda)) {
        if (excluidas.includes(Number(idTienda))) continue;
        const pedido = await crearPedido({
          ...entregaBase,
          idTienda: Number(idTienda),
          items: lineas.map((linea) => ({ idProducto: linea.idProducto, cantidad: linea.cantidad })),
        });
        registrados.push(pedido);
        quitarVariosDelCarrito(lineas.map((linea) => linea.idProducto));
      }
    } catch (cause) {
      setError(
        (registrados.length > 0
          ? `Se registraron ${registrados.length} pedido(s), pero no pudimos registrar el resto: `
          : "") + (cause instanceof Error ? cause.message : "No pudimos registrar el pedido."),
      );
    } finally {
      setCreados((anteriores) => [...anteriores, ...registrados]);
      setEnviando(false);
    }
  }

  return (
    <main className={homeStyles.homeContainer}>
      <header className={homeStyles.homeHeader}>
        <BotonInicio />

        <div className={homeStyles.logo}>
          <h1>•SABA•</h1>
          <p>Artesanías</p>
        </div>

        {haySesion === undefined ? null : haySesion ? (
          <MenuUsuario />
        ) : (
          <Link href="/login" className={homeStyles.logoutButton} style={{ marginLeft: "auto" }}>
            Iniciar sesión
          </Link>
        )}
      </header>

      <div className={styles.content}>
        <h2 className={styles.titulo}>Confirmar compra</h2>

        {creados.length > 0 && (
          <section className={styles.exito} role="status">
            <h3>¡Gracias por tu compra!</h3>
            <ul>
              {creados.map((pedido) => (
                <li key={pedido.id} className={styles.pedidoCreado}>
                  <span>
                    Pedido #{pedido.id} en {pedido.nombreTienda}: {formatearPrecio(pedido.total)}
                    {pedido.estado === "CANCELADO" && <strong> · Cancelado</strong>}
                  </span>
                  {haySesion === true && pedido.estado === "PENDIENTE" && (
                    <button
                      type="button"
                      className={styles.botonSecundario}
                      onClick={() => cancelarRegistrado(pedido)}
                      disabled={cancelandoId !== null}
                    >
                      {cancelandoId === pedido.id ? "Cancelando…" : "Cancelar pedido"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {errorCancelacion && (
              <p className={styles.alerta} role="alert">
                {errorCancelacion}
              </p>
            )}
            <p>
              {creados.every((pedido) => pedido.estado === "CANCELADO")
                ? "Tus pedidos fueron cancelados."
                : "La tienda va a confirmar tu pedido y coordinar la entrega."}
              {haySesion === false &&
                " Si necesitás cancelarlo, comunicate con la tienda indicando el número de pedido."}
            </p>
            {items.length === 0 && (
              <Link href="/home" className={styles.botonPrincipal}>
                Seguir comprando
              </Link>
            )}
          </section>
        )}

        {items.length === 0 && creados.length === 0 && (
          <p className={styles.mensaje}>
            Tu carrito está vacío. <Link href="/home">Volver al catálogo</Link>
          </p>
        )}

        {items.length > 0 && (
          <div className={styles.columnas}>
            <section className={styles.resumen} aria-label="Resumen del carrito">
              {Object.entries(porTienda).map(([idTienda, lineas]) => {
                const excluida = excluidas.includes(Number(idTienda));
                return (
                <div key={idTienda} className={excluida ? `${styles.grupo} ${styles.grupoExcluido}` : styles.grupo}>
                  <div className={styles.grupoCabecera}>
                    <h3>{lineas[0].nombreTienda}</h3>
                    {excluida ? (
                      <button
                        type="button"
                        className={styles.enlaceIncluir}
                        onClick={() => incluirPedidoTienda(Number(idTienda))}
                        disabled={enviando}
                      >
                        Volver a incluir
                      </button>
                    ) : (
                      Object.keys(porTienda).length > 1 && (
                        <button
                          type="button"
                          className={styles.enlaceCancelar}
                          onClick={() => cancelarPedidoTienda(Number(idTienda))}
                          disabled={enviando}
                        >
                          Cancelar pedido
                        </button>
                      )
                    )}
                  </div>
                  {excluida ? (
                    <p className={styles.nota}>
                      Pedido cancelado: no se incluye en esta compra, pero sus productos siguen en tu carrito.
                    </p>
                  ) : (
                  <ul>
                    {lineas.map((item) => (
                      <li key={item.idProducto} className={styles.linea}>
                        <div>
                          <Link href={`/productos/${item.idProducto}`}>{item.nombre}</Link>
                          <span>{formatearPrecio(item.precioUnitario)} c/u</span>
                          <div className={styles.cantidad} role="group" aria-label={`Cantidad de ${item.nombre}`}>
                            <button
                              type="button"
                              aria-label="Bajar cantidad"
                              onClick={() => cambiarCantidadCarrito(item.idProducto, item.cantidad - 1)}
                              disabled={enviando || item.cantidad <= 1}
                            >
                              −
                            </button>
                            <span aria-live="polite">{item.cantidad}</span>
                            <button
                              type="button"
                              aria-label="Subir cantidad"
                              onClick={() => cambiarCantidadCarrito(item.idProducto, item.cantidad + 1)}
                              disabled={enviando || item.cantidad >= item.cantidadDisponible}
                            >
                              +
                            </button>
                          </div>
                          {item.cantidad > item.cantidadDisponible ? (
                            <span className={styles.alerta}>
                              {item.cantidadDisponible === 0
                                ? "Sin stock: quitalo para continuar."
                                : `Solo quedan ${item.cantidadDisponible} unidades: bajá la cantidad para continuar.`}
                            </span>
                          ) : (
                            item.cantidad === item.cantidadDisponible && (
                              <small className={styles.nota}>Llegaste al stock disponible.</small>
                            )
                          )}
                        </div>
                        <strong>{formatearPrecio(item.precioUnitario * item.cantidad)}</strong>
                        <button
                          type="button"
                          className={styles.quitar}
                          aria-label={`Quitar ${item.nombre} del carrito`}
                          onClick={() => quitarDelCarrito(item.idProducto)}
                          disabled={enviando}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                  )}
                </div>
                );
              })}

              <p className={styles.total}>
                <span>Total</span>
                <strong>{formatearPrecio(totalIncluido)}</strong>
              </p>
              {Object.keys(porTienda).length - excluidas.length > 1 && (
                <p className={styles.nota}>
                  Tu carrito tiene productos de varias tiendas: se va a registrar un pedido por tienda.
                </p>
              )}
            </section>

            <form className={styles.formulario} onSubmit={confirmar}>
              <h3>Datos de entrega</h3>

              {haySesion === undefined && <p>Verificando tu sesión...</p>}

              {haySesion === true && (
                <fieldset className={styles.opciones}>
                  <legend>¿Dónde lo entregamos?</legend>
                  <label>
                    <input
                      type="radio"
                      name="entrega"
                      checked={entrega === "cuenta"}
                      onChange={() => setEntrega("cuenta")}
                    />
                    En la dirección de mi cuenta
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="entrega"
                      checked={entrega === "otra"}
                      onChange={() => setEntrega("otra")}
                    />
                    En otra dirección
                  </label>
                </fieldset>
              )}

              {haySesion === false && (
                <>
                  <label className={styles.campo}>
                    Nombre y apellido
                    <input name="nombreReceptor" required autoComplete="name" />
                  </label>
                  <label className={styles.campo}>
                    Teléfono
                    <input
                      name="telefonoReceptor"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="0\d{8,9}"
                      placeholder="0981123456"
                      title="Debe empezar con 0 y tener 9 o 10 dígitos, sin espacios"
                    />
                  </label>
                  <label className={styles.campo}>
                    Email
                    <input name="emailReceptor" type="email" required autoComplete="email" />
                  </label>
                  <p className={styles.nota}>
                    Te vamos a enviar la confirmación del pedido a este email.{" "}
                    <Link href="/login">¿Ya tenés cuenta? Iniciá sesión</Link>
                  </p>
                </>
              )}

              {haySesion !== undefined && !usarCuenta && (
                <>
                  <div className={styles.campoUbicacion}>
                    <UbicacionFields onSelectionChange={() => setError("")} />
                  </div>
                  <label className={styles.campo}>
                    Dirección
                    <input name="direccion" required placeholder="Calle, número de casa o edificio" />
                  </label>
                </>
              )}

              {haySesion !== undefined && (
                <label className={styles.campo}>
                  Referencia (opcional)
                  <input name="referencia" placeholder="Ej.: portón negro, frente a la plaza" />
                </label>
              )}

              {error && (
                <p className={styles.alerta} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={styles.botonPrincipal}
                disabled={
                  enviando ||
                  verificando ||
                  haySesion === undefined ||
                  incluidos.length === 0 ||
                  sinStockSuficiente.length > 0
                }
              >
                {enviando ? "Registrando pedido…" : verificando ? "Verificando stock…" : "Confirmar pedido"}
              </button>
              <button
                type="button"
                className={styles.botonSecundario}
                onClick={cancelarCompra}
                disabled={enviando}
              >
                Cancelar compra
              </button>
              {sinStockSuficiente.length > 0 && (
                <p className={styles.alerta}>
                  Hay productos sin stock suficiente. Quitalos del carrito para poder confirmar.
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
