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
  createdAt: string;
  updatedAt: string;
}