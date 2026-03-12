export interface Modulo {
  id: number;
  empresa?: {
    id: number;
    razonSocial?: string;
  };
  nombre?: string;
  descripcion?: string;
  indice?: number;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string;
}

export interface CreateInterfazDTO {
  moduloId: number;
  nombre: string;
  descripcion: string;
  indice: number;
}

export interface UpdateInterfazDTO {
  moduloId: number;
  nombre: string;
  descripcion: string;
  indice: number;
}

export interface ResponseInterfazDTO {
  id: number;
  modulo: Modulo;
  nombre: string;
  descripcion: string;
  indice: number;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
