export interface ListaValores {
  id: number;
  empresa: {
    id: number;
    razonSocial: string;
  };
  nombre: string;
  descripcion: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}

export interface CreateListaValoresDetalleDTO {
  listaValoresId: number;
  nombre: string;
}

export interface UpdateListaValoresDetalleDTO {
  listaValoresId: number;
  nombre: string;
  estado: string;
}

export interface ResponseListaValoresDetalleDTO {
  id: number;
  listaValores: ListaValores;
  nombre: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
