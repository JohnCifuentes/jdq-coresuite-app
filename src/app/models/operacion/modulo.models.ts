export interface Empresa {
  id: number;
  razonSocial: string;
}

export interface CreateModuloDTO {
  empresaId: number;
  nombre: string;
  descripcion: string;
  indice: number;
}

export interface UpdateModuloDTO {
  empresaId: number;
  nombre: string;
  descripcion: string;
  indice: number;
  estado: string;
}

export interface ResponseModuloDTO {
  id: number;
  empresa: Empresa;
  nombre: string;
  descripcion: string;
  indice: number;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
