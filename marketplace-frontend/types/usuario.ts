// Formas de datos del módulo de usuarios, alineadas con los DTOs del backend
// (UsuarioResponseDto / UsuarioCreateRequestDto / UsuarioUpdateRequestDto / UsuarioFilterDto).

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  usuario: string;
  idRol: number;
  nombreRol: string;
  idDireccion: number;
  nombreDireccion: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioFiltro {
  page: number;
  perPage: number;
  nombre?: string;
  activo?: boolean;
}

export interface UsuarioCreateInput {
  nombre: string;
  apellido: string;
  contrasenha: string;
  email: string;
  usuario: string;
  idRol: number;
  idDireccion: number;
}

export interface UsuarioUpdateInput {
  nombre?: string;
  apellido?: string;
  email?: string;
  usuario?: string;
  idRol?: number;
  idDireccion?: number;
  activo?: boolean;
}
