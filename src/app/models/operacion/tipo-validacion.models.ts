export interface CreateTipoValidacionDTO {
  nombre: string;
  descripcion: string;
}

export interface UpdateTipoValidacionDTO {
  nombre: string;
  descripcion: string;
  estado?: string;
}

export interface ResponseTipoValidacionDTO {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
