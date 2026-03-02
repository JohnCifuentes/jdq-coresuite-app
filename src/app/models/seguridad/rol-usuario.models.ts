export interface Empresa {
  id: number;
  razonSocial: string;
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  nombre1: string;
  apellido1: string;
}

export interface CreateRolUsuarioDTO {
  empresaId: number;
  rolId: number;
  usuarioId: number;
}

export interface UpdateRolUsuarioDTO {
  empresaId: number;
  rolId: number;
  usuarioId: number;
}

export interface InactiveRolUsuarioDTO {
  estado: string;
}

export interface ResponseRolUsuarioDTO {
  id: number;
  empresa: Empresa;
  rol: Rol;
  usuario: Usuario;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
