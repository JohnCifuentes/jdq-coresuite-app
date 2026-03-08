export interface Empresa {
  id: number;
  razonSocial: string;
}

export interface CreateListaValoresDTO {
  empresaId: number;
  nombre: string;
  descripcion: string;
}

export interface UpdateListaValoresDTO {
  empresaId: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface ResponseListaValoresDTO {
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
