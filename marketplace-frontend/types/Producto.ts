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

  createdAt: string;
  updatedAt: string;
}