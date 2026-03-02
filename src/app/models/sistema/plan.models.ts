export interface CreatePlanDTO {
  cantidadUsuarios: number;
  nombre: string;
  valor: number;
  descripcion: string;
}

export interface UpdatePlanDTO {
  cantidadUsuarios: number;
  nombre: string;
  valor: number;
  descripcion: string;
}

export interface InactivePlanDTO {
  estado: string;
}

export interface ResponsePlanDTO {
  id: number;
  cantidadUsuarios: number;
  nombre: string;
  valor: number;
  descripcion: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
