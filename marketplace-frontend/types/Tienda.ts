export interface Tienda {
  id: number;
  nombre: string;
  descripcion: string;
  idDireccion: number;
  nombreDireccion: string;
  direccionCompleta: string;
  // Inactiva: no aparece en el catálogo ni recibe pedidos.
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatosPagoTienda {
  banco: string;
  titularCuenta: string;
  documentoTitular: string;
  nroCuenta: string;
  aliasCuenta: string | null;
}