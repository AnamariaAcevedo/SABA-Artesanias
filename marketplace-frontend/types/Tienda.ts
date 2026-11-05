export interface Tienda {
  id: number;
  nombre: string;
  descripcion: string;
  idDireccion: number;
  nombreDireccion: string;
  direccionCompleta: string;
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