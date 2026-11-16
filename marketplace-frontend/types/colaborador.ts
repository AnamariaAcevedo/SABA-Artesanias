// Integrante del equipo de la tienda: el dueño (PRINCIPAL) o un colaborador (SECUNDARIO).
// `id` es el del vínculo con la tienda, que es lo que se usa para quitarlo.
export type Colaborador = {
  id: number;
  idUsuario: number;
  usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  tipo: "PRINCIPAL" | "SECUNDARIO";
  fechaAlta: string | null;
};

// Sugerencia del buscador: usuario que coincide con lo escrito y, si no se puede
// sumar al equipo, el motivo (null cuando está disponible).
export type UsuarioDisponible = {
  usuario: string;
  nombre: string;
  apellido: string;
  motivoNoDisponible: string | null;
};
