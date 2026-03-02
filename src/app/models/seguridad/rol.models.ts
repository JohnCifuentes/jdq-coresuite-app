export interface Empresa {
  id: number;
  razonSocial: string;
}

export interface CreateRolDTO {
  empresaId: number;
  nombre: string;
  descripcion: string;
}

export interface UpdateRolDTO {
  empresaId: number;
  nombre: string;
  descripcion: string;
}

export interface InactiveRolDTO {
  estado: string;
}

export interface ResponseRolDTO {
  id: number;
  empresa: Empresa;
  nombre: string;
  descripcion: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
