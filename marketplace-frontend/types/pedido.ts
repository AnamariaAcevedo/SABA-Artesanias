// Formas de datos de pedidos, alineadas con los DTOs del backend
// (PedidoCreateRequestDto / PedidoResponseDto / ProductoPedidoResponseDto).

export interface PedidoItemInput {
  idProducto: number;
  cantidad: number;
}

// Los datos de entrega son opcionales con sesión: si no vienen, el backend usa
// los de la cuenta. Para invitados son obligatorios.
export interface PedidoCreateInput {
  idTienda: number;
  items: PedidoItemInput[];
  nombreReceptor?: string;
  telefonoReceptor?: string;
  emailReceptor?: string;
  idBarrio?: number;
  direccion?: string;
  referencia?: string;
}

export interface ProductoPedido {
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Pedido {
  id: number;
  // Número correlativo dentro de la tienda (1, 2, 3...): es el que se muestra.
  numero: number;
  idTienda: number;
  nombreTienda: string;
  idUsuario: number | null;
  nombreReceptor: string;
  telefonoReceptor: string;
  emailReceptor: string;
  idBarrio: number;
  nombreBarrio: string;
  direccion: string;
  referencia: string | null;
  total: number;
  estado: string;
  fechaPedido: string;
  fechaEntrega: string | null;
  items: ProductoPedido[];
}
