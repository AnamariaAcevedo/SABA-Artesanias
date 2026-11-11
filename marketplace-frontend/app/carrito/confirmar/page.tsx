"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import homeStyles from "@/app/home/home.module.css";
import styles from "./confirmar.module.css";

import type { Pedido, PedidoCreateInput } from "@/types/pedido";
import type { DatosPagoTienda } from "@/types/Tienda";
import { obtenerDatosPagoTienda } from "@/services/tiendaService";
import type { CuponPreview } from "@/types/cupon";
import { obtenerProductoPorId } from "@/services/productoService";
import { errorDeComprobante } from "@/lib/pedidos";
import { cancelarPedidoPropio, crearPedido } from "@/services/pedidoService";
import MenuUsuario from "@/components/auth/MenuUsuario";
import { confirmar as pedirConfirmacion } from "@/components/dialogos/Dialogos";
import UbicacionFields from "@/components/auth/UbicacionFields";
import BotonInicio from "@/components/catalogo/BotonInicio";
import SelectorPuntoEntrega from "@/components/mapa/SelectorPuntoEntrega";
import ModalCupon from "@/components/carrito/ModalCupon";
import { useHaySesion } from "@/lib/auth";
import { LARGO_MAXIMO_REFERENCIA, armarReferencia, type Punto } from "@/lib/mapa";
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

  const [cuponesPorTienda, setCuponesPorTienda] = useState<Record<number, CuponPreview>>({});
  const [modalCuponTienda, setModalCuponTienda] = useState<number | null>(null);

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
  // Comprobante elegido para cada tienda: cada una recibe su propio pago.
  const [comprobantes, setComprobantes] = useState<Record<number, File>>({});
  const [errorComprobante, setErrorComprobante] = useState("");
  // Datos de cuenta por tienda: sin clave = cargando; null = no disponibles.
  const [datosPago, setDatosPago] = useState<Record<number, DatosPagoTienda | null>>({});
  // Punto exacto de entrega marcado en el mapa (opcional).
  const [punto, setPunto] = useState<Punto | null>(null);

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

  const idsTiendas = [...new Set(items.map((item) => item.idTienda))].join(",");

  useEffect(() => {
    let cancelado = false;
    const ids = idsTiendas ? idsTiendas.split(",").map(Number) : [];

    async function cargarDatosPago() {
      const respuestas = await Promise.all(
        ids.map(async (id) => [id, await obtenerDatosPagoTienda(id).catch(() => null)] as const),
      );
      if (!cancelado) setDatosPago(Object.fromEntries(respuestas));
    }

    void cargarDatosPago();
    return () => {
      cancelado = true;
    };
  }, [idsTiendas]);

  const verificando = verificados !== idsProductos;
  const usarCuenta = haySesion === true && entrega === "cuenta";

  const porTienda = items.reduce<Record<number, ItemCarrito[]>>((grupos, item) => {
    (grupos[item.idTienda] ??= []).push(item);
    return grupos;
  }, {});

  function subtotalDeTienda(lineas: ItemCarrito[]): number {
    return lineas.reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0);
  }

  function totalDeTienda(idTienda: number, lineas: ItemCarrito[]): number {
    const subtotal = subtotalDeTienda(lineas);
    const cupon = cuponesPorTienda[idTienda];
    return cupon ? subtotal - subtotal * (cupon.porcentaje / 100) : subtotal;
  }

  function quitarCupon(idTienda: number) {
    setCuponesPorTienda((actuales) => {
      const { [idTienda]: _quitado, ...resto } = actuales;
      return resto;
    });
  }

  // Cancelar un pedido o la compra no toca el carrito: los productos quedan
  // guardados para comprarlos más adelante. Solo se excluyen de esta compra.
  const incluidos = items.filter((item) => !excluidas.includes(item.idTienda));
  const totalIncluido = Object.entries(porTienda).reduce((suma, [idTienda, lineas]) => {
    if (excluidas.includes(Number(idTienda))) return suma;
    return suma + totalDeTienda(Number(idTienda), lineas);
  }, 0);
  const sinStockSuficiente = incluidos.filter((item) => item.cantidad > item.cantidadDisponible);
  const tiendasIncluidas = Object.entries(porTienda)
    .map(([idTienda, lineas]) => ({ idTienda: Number(idTienda), lineas }))
    .filter(({ idTienda }) => !excluidas.includes(idTienda));
  const cargandoDatosPago = tiendasIncluidas.some(({ idTienda }) => datosPago[idTienda] === undefined);
  const haySinDatosPago = tiendasIncluidas.some(({ idTienda }) => datosPago[idTienda] === null);

  function cancelarPedidoTienda(idTienda: number) {
    setExcluidas((actuales) => [...actuales, idTienda]);
  }

  function incluirPedidoTienda(idTienda: number) {
    setExcluidas((actuales) => actuales.filter((id) => id !== idTienda));
  }

  function cancelarCompra() {
    router.push("/home");
  }

  function elegirComprobante(idTienda: number, evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    const invalido = archivo ? errorDeComprobante(archivo) : null;
    if (invalido) evento.target.value = "";
    setErrorComprobante(invalido ?? "");
    setComprobantes((actuales) => {
      const siguientes = { ...actuales };
      if (archivo && !invalido) siguientes[idTienda] = archivo;
      else delete siguientes[idTienda];
      return siguientes;
    });
  }

  // Cancela un pedido ya registrado (solo con sesión y mientras siga pendiente).
  async function cancelarRegistrado(pedido: Pedido) {
    if (cancelandoId !== null) return;
    const confirmado = await pedirConfirmacion({
      titulo: "¿Cancelar este pedido?",
      mensaje: `Vas a cancelar el pedido N.º ${pedido.numero} de ${pedido.nombreTienda}.`,
      textoConfirmar: "Cancelar pedido",
      textoCancelar: "Volver",
      peligro: true,
    });
    if (!confirmado) return;

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
    if (enviando || sinStockSuficiente.length > 0 || incluidos.length === 0 || cargandoDatosPago || haySinDatosPago) return;

    const sinComprobante = tiendasIncluidas.find(({ idTienda }) => !comprobantes[idTienda]);
    if (sinComprobante) {
      setError(`Adjuntá el comprobante de pago para ${sinComprobante.lineas[0].nombreTienda}.`);
      return;
    }

    const datos = new FormData(evento.currentTarget);
    const idBarrio = Number(datos.get("idBarrio")) || undefined;

    if (!usarCuenta && !idBarrio) {
      setError("Seleccioná la ubicación de entrega hasta el barrio.");
      return;
    }

    const entregaBase: Omit<PedidoCreateInput, "idTienda" | "items"> = {
      referencia: armarReferencia(texto(datos, "referencia"), punto),
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
        const pedido = await crearPedido(
          {
            ...entregaBase,
            idTienda: Number(idTienda),
            items: lineas.map((linea) => ({ idProducto: linea.idProducto, cantidad: linea.cantidad })),
            codigoCupon: cuponesPorTienda[Number(idTienda)]?.codigo,
          },
          comprobantes[Number(idTienda)],
        );
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
                    Pedido N.º {pedido.numero} en {pedido.nombreTienda}: {formatearPrecio(pedido.total)}
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

        {haySesion !== undefined && items.length === 0 && creados.length === 0 && (
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
                  {!excluida && (
                    <p className={styles.nota}>
                      {cuponesPorTienda[Number(idTienda)] ? (
                        <>
                          Cupón <strong>{cuponesPorTienda[Number(idTienda)].codigo}</strong> aplicado (−
                          {cuponesPorTienda[Number(idTienda)].porcentaje}%) ·{" "}
                          <button
                            type="button"
                            className={styles.enlaceCancelar}
                            onClick={() => quitarCupon(Number(idTienda))}
                            disabled={enviando}
                          >
                            Quitar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={styles.enlaceIncluir}
                          onClick={() => setModalCuponTienda(Number(idTienda))}
                          disabled={enviando}
                        >
                          Utilizar cupón
                        </button>
                      )}
                    </p>
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
                <>
                  <SelectorPuntoEntrega punto={punto} alCambiar={setPunto} />
                  <label className={styles.campo}>
                    Referencia (opcional)
                    <input
                      name="referencia"
                      maxLength={LARGO_MAXIMO_REFERENCIA}
                      placeholder="Ej.: portón negro, frente a la plaza"
                    />
                  </label>
                </>
              )}

              {haySesion !== undefined && (
                <fieldset className={styles.comprobantes}>
                  <legend>Pago</legend>
                  <p className={styles.nota}>
                    Transferí el total a la cuenta de la tienda y adjuntá el comprobante. PNG, JPG o PDF de hasta 5 MB.
                  </p>
                  {tiendasIncluidas.map(({ idTienda, lineas }) => {
                    const cuenta = datosPago[idTienda];
                    return (
                      <div key={idTienda} className={styles.pagoTienda}>
                        <strong>{lineas[0].nombreTienda}</strong>
                        {cuenta === undefined && <p className={styles.nota}>Cargando datos de cuenta…</p>}
                        {cuenta === null && (
                          <p className={styles.alerta}>
                            Los datos de cuenta de esta tienda no están disponibles, así que por ahora no se le puede
                            comprar. {tiendasIncluidas.length > 1 && "Podés cancelar este pedido y seguir con el resto."}
                          </p>
                        )}
                        {cuenta && (
                          <>
                            <dl className={styles.cuenta}>
                              <dt>A transferir</dt>
                              <dd>
                                <strong>
                                  {formatearPrecio(lineas.reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0))}
                                </strong>
                              </dd>
                              <dt>Banco</dt>
                              <dd>{cuenta.banco}</dd>
                              <dt>N.º de cuenta</dt>
                              <dd>{cuenta.nroCuenta}</dd>
                              <dt>Titular</dt>
                              <dd>{cuenta.titularCuenta}</dd>
                              <dt>Cédula o RUC</dt>
                              <dd>{cuenta.documentoTitular}</dd>
                              {cuenta.aliasCuenta && (
                                <>
                                  <dt>Alias</dt>
                                  <dd>{cuenta.aliasCuenta}</dd>
                                </>
                              )}
                            </dl>
                            <label className={styles.comprobante}>
                              Comprobante de pago
                              <input
                                type="file"
                                required
                                accept="image/png,image/jpeg,application/pdf"
                                onChange={(evento) => elegirComprobante(idTienda, evento)}
                                disabled={enviando}
                              />
                            </label>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {errorComprobante && (
                    <p className={styles.alerta} role="alert">
                      {errorComprobante}
                    </p>
                  )}
                </fieldset>
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
                  sinStockSuficiente.length > 0 ||
                  cargandoDatosPago ||
                  haySinDatosPago
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

      {modalCuponTienda !== null && (
        <ModalCupon
          idTienda={modalCuponTienda}
          onAplicar={(cupon) => setCuponesPorTienda((actuales) => ({ ...actuales, [modalCuponTienda]: cupon }))}
          onCerrar={() => setModalCuponTienda(null)}
        />
      )}
    </main>
  );
}
