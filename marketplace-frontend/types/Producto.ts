export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  puntuacion: number | null;
  descuento: number | null;
  cantidadDisponible: number;
  idTienda: number;
  nombreTienda: string;

  idsSubcategorias: number[];
  nombresSubcategorias: string[];

  createdAt: string;
  updatedAt: string;
}