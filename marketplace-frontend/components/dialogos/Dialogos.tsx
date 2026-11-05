"use client";

import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import styles from "./dialogos.module.css";

// Popups propios del sistema para reemplazar window.confirm y window.alert.
// Uso: `if (!(await confirmar({ titulo: "¿Eliminar?" }))) return;`
// <DialogosHost /> se monta una sola vez en el layout raíz y muestra los
// pedidos de a uno, en el orden en que llegan.

export type OpcionesConfirmar = {
  titulo: string;
  mensaje?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  // Acciones destructivas: botón rojo y el foco arranca en "Cancelar".
  peligro?: boolean;
};

export type OpcionesAviso = {
  titulo: string;
  mensaje?: string;
  textoBoton?: string;
};

type Pedido = {
  id: number;
  tipo: "confirmar" | "aviso";
  titulo: string;
  mensaje?: string;
  textoConfirmar: string;
  textoCancelar: string;
  peligro: boolean;
  resolver: (aceptado: boolean) => void;
};

let cola: Pedido[] = [];
let siguienteId = 1;
const oyentes = new Set<() => void>();

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

function pedidoActual() {
  return cola[0] ?? null;
}

function sinPedidosEnServidor() {
  return null;
}

function encolar(pedido: Omit<Pedido, "id">) {
  cola = [...cola, { ...pedido, id: siguienteId++ }];
  oyentes.forEach((oyente) => oyente());
}

function responder(aceptado: boolean) {
  const [actual, ...resto] = cola;
  if (!actual) return;
  cola = resto;
  oyentes.forEach((oyente) => oyente());
  actual.resolver(aceptado);
}

export function confirmar({
  titulo,
  mensaje,
  textoConfirmar = "Aceptar",
  textoCancelar = "Cancelar",
  peligro = false,
}: OpcionesConfirmar): Promise<boolean> {
  return new Promise((resolver) =>
    encolar({ tipo: "confirmar", titulo, mensaje, textoConfirmar, textoCancelar, peligro, resolver })
  );
}

export function avisar({ titulo, mensaje, textoBoton = "Entendido" }: OpcionesAviso): Promise<void> {
  return new Promise((resolver) =>
    encolar({
      tipo: "aviso",
      titulo,
      mensaje,
      textoConfirmar: textoBoton,
      textoCancelar: "",
      peligro: false,
      resolver: () => resolver(),
    })
  );
}

export default function DialogosHost() {
  const actual = useSyncExternalStore(suscribir, pedidoActual, sinPedidosEnServidor);
  if (!actual) return null;
  return <Dialogo key={actual.id} pedido={actual} />;
}

function Dialogo({ pedido }: { pedido: Pedido }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const botonConfirmar = useRef<HTMLButtonElement>(null);
  const botonCancelar = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();
  const idMensaje = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    const focoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!elemento.open) elemento.showModal();
    (pedido.peligro ? botonCancelar.current : botonConfirmar.current)?.focus();

    return () => {
      if (focoPrevio?.isConnected) focoPrevio.focus();
    };
  }, [pedido.peligro]);

  const esConfirmacion = pedido.tipo === "confirmar";
  const icono = pedido.peligro ? <IconoPeligro /> : esConfirmacion ? <IconoPregunta /> : <IconoInfo />;

  return (
    <dialog
      ref={dialogo}
      className={styles.dialogo}
      aria-labelledby={idTitulo}
      aria-describedby={pedido.mensaje ? idMensaje : undefined}
      // Escape y clic en el fondo equivalen a cancelar.
      onCancel={(event) => {
        event.preventDefault();
        responder(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) responder(false);
      }}
    >
      <div className={styles.contenido}>
        <div className={styles.encabezado}>
          <span className={`${styles.icono} ${pedido.peligro ? styles.iconoPeligro : ""}`} aria-hidden="true">
            {icono}
          </span>
          <div className={styles.textos}>
            <h2 id={idTitulo} className={styles.titulo}>{pedido.titulo}</h2>
            {pedido.mensaje && <p id={idMensaje} className={styles.mensaje}>{pedido.mensaje}</p>}
          </div>
        </div>

        <div className={styles.acciones}>
          {esConfirmacion && (
            <button
              ref={botonCancelar}
              type="button"
              className={styles.botonSecundario}
              onClick={() => responder(false)}
            >
              {pedido.textoCancelar}
            </button>
          )}
          <button
            ref={botonConfirmar}
            type="button"
            className={pedido.peligro ? styles.botonPeligro : styles.botonPrincipal}
            onClick={() => responder(true)}
          >
            {pedido.textoConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function IconoPregunta() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.6-2.8 4.2" />
      <path d="M12 17.6h.01" />
    </svg>
  );
}

function IconoPeligro() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.2v4.4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function IconoInfo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6h.01" />
    </svg>
  );
}
