// Forma de datos del módulo de direcciones (DireccionResponseDto), usada para el
// selector de dirección al crear o editar un usuario.

export interface Direccion {
  id: number;
  calle: string;
  nombreEdificio: string | null;
  nroCasa: number | null;
  nroDepartamento: string | null;
  idBarrio: number;
  nombreBarrio: string;
  idCiudad: number;
  nombreCiudad: string;
  idDepartamento: number;
  nombreDepartamento: string;
  idPais: number;
  nombrePais: string;
  createdAt: string;
  updatedAt: string;
}

export function etiquetaDireccion(direccion: Direccion): string {
  const numero = direccion.nombreEdificio
    ? `${direccion.nombreEdificio}${direccion.nroDepartamento ? ` ${direccion.nroDepartamento}` : ""}`
    : direccion.nroCasa ?? "";
  return `${direccion.calle} ${numero}, ${direccion.nombreBarrio}, ${direccion.nombreCiudad}`.trim();
}
