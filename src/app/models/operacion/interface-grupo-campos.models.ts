export interface Interfaz {
  id: number;
  modulo?: {
    id: number;
    nombre?: string;
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

export interface CreateInterfaceGrupoCamposDTO {
  interfazId: number;
  nombre: string;
  descripcion: string;
  indice: number;
}

export interface UpdateInterfaceGrupoCamposDTO {
  interfazId: number;
  nombre: string;
  descripcion: string;
  indice: number;
  estado?: string;
}

export interface ResponseInterfaceGrupoCamposDTO {
  id: number;
  interfaz: Interfaz;
  nombre: string;
  descripcion: string;
  indice: number;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
