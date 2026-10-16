"use client";

import { useSyncExternalStore } from "react";
import type { Producto } from "@/types/Producto";

// Carrito de compras del navegador. Se guarda en localStorage para que sobreviva
// a recargas y se comparte entre pestañas (evento "storage"). Cada línea guarda
// una copia del producto al momento de agregarlo; el stock y el precio se
// vuelven a consultar al confirmar la compra.

export interface ItemCarrito {
  idProducto: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  cantidadDisponible: number;
  idTienda: number;
  nombreTienda: string;
  idImagenPrincipal: number | null;
}

const CLAVE = "carrito";
const VACIO: ItemCarrito[] = [];

let cache: ItemCarrito[] | null = null;
const oyentes = new Set<() => void>();

function leer(): ItemCarrito[] {
  if (cache) return cache;
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    cache = Array.isArray(guardado) ? guardado : [];
  } catch {
    cache = [];
  }
  return cache;
}

function guardar(items: ItemCarrito[]) {
  cache = items;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Sin Storage el carrito igualmente funciona mientras la pestaña siga abierta.
  }
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);

  function alCambiarStorage(event: StorageEvent) {
    if (event.key === CLAVE || event.key === null) {
      cache = null;
      oyente();
    }
  }

  window.addEventListener("storage", alCambiarStorage);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", alCambiarStorage);
  };
}

export function precioFinalProducto(producto: Producto): number {
  return producto.precioFinal ?? producto.precio;
}

// Agrega `cantidad` unidades sin superar el stock disponible. Devuelve cuántas
// unidades se agregaron realmente (0 si no hay stock o ya estaba todo en el carrito).
export function agregarAlCarrito(producto: Producto, cantidad: number): number {
  const items = leer();
  const existente = items.find((item) => item.idProducto === producto.id);
  const enCarrito = existente?.cantidad ?? 0;
  const agregadas = Math.max(0, Math.min(cantidad, producto.cantidadDisponible - enCarrito));
  if (agregadas === 0) return 0;

  const linea: ItemCarrito = {
    idProducto: producto.id,
    nombre: producto.nombre,
    precioUnitario: precioFinalProducto(producto),
    cantidad: enCarrito + agregadas,
    cantidadDisponible: producto.cantidadDisponible,
    idTienda: producto.idTienda,
    nombreTienda: producto.nombreTienda,
    idImagenPrincipal: producto.idImagenPrincipal,
  };

  guardar(
    existente
      ? items.map((item) => (item.idProducto === producto.id ? linea : item))
      : [...items, linea],
  );
  return agregadas;
}

// Fija la cantidad de una línea entre 1 y el stock disponible.
export function cambiarCantidadCarrito(idProducto: number, cantidad: number) {
  guardar(
    leer().map((item) =>
      item.idProducto === idProducto
        ? { ...item, cantidad: Math.max(1, Math.min(cantidad, item.cantidadDisponible)) }
        : item,
    ),
  );
}

export function quitarDelCarrito(idProducto: number) {
  guardar(leer().filter((item) => item.idProducto !== idProducto));
}

export function quitarVariosDelCarrito(idsProducto: number[]) {
  guardar(leer().filter((item) => !idsProducto.includes(item.idProducto)));
}

export function limpiarCarrito() {
  guardar([]);
}

// Actualiza precio y stock de las líneas con los datos vigentes del servidor.
export function sincronizarCarrito(productos: Producto[]) {
  guardar(
    leer().map((item) => {
      const actual = productos.find((producto) => producto.id === item.idProducto);
      return actual
        ? {
            ...item,
            nombre: actual.nombre,
            precioUnitario: precioFinalProducto(actual),
            cantidadDisponible: actual.cantidadDisponible,
          }
        : item;
    }),
  );
}

export function useCarrito() {
  const items = useSyncExternalStore(suscribir, leer, () => VACIO);
  const cantidadTotal = items.reduce((suma, item) => suma + item.cantidad, 0);
  const total = items.reduce((suma, item) => suma + item.precioUnitario * item.cantidad, 0);
  return { items, cantidadTotal, total };
}

export function formatearPrecio(valor: number): string {
  return `${Math.round(valor).toLocaleString("es-PY")} GS`;
}
