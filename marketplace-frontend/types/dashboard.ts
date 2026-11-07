export type VentaDiaria = {
  fecha: string;
  pedidos: number;
  total: number;
};

export type ResumenTienda = {
  idTienda: number;
  nombreTienda: string;
  pedidos: number;
  totalVendido: number;
  pendientes: number;
};

export type PedidoReciente = {
  id: number;
  numero: number;
  idTienda: number;
  nombreTienda: string;
  nombreReceptor: string;
  total: number;
  estado: string;
  fechaPedido: string;
};

export type DashboardResumen = {
  periodoDias: number;
  desde: string;
  hasta: string;
  pedidosPendientes: number;
  pedidosPeriodo: number;
  pedidosEntregadosPeriodo: number;
  pedidosCanceladosPeriodo: number;
  ventasHoy: number;
  ventasMes: number;
  ventasPeriodo: number;
  ticketPromedio: number;
  productosStockBajo: number;
  solicitudesVendedorPendientes: number;
  ventasDiarias: VentaDiaria[];
  tiendas: ResumenTienda[];
  pedidosRecientes: PedidoReciente[];
};
