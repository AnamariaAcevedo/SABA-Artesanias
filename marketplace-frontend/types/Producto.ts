export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  // Precio con el descuento ya aplicado; igual a precio si no tiene descuento.
  precioFinal: number;
  puntuacion: number | null;
  descuento: number | null;
  cantidadDisponible: number;
  idTienda: number;
  nombreTienda: string;

  idsSubcategorias: number[];
  nombresSubcategorias: string[];

  idImagenPrincipal: number | null;

  // Inactivo: no aparece en el catálogo ni se puede comprar; el dueño lo puede reactivar.
  activo: boolean;
  // Si la tienda está desactivada, el producto tampoco se puede comprar.
  tiendaActiva: boolean;

  createdAt: string;
  updatedAt: string;
}