export interface CreateTipoCampoDTO {
  nombre: string;
  descripcion: string;
}

export interface UpdateTipoCampoDTO {
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface ResponseTipoCampoDTO {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
