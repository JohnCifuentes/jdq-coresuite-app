export interface Campo {
  id: number;
  interfazGrupoCampos?: {
    id: number;
    nombre?: string;
  };
  tipoCampo?: {
    id: number;
    nombre?: string;
  };
  nombre?: string;
  descripcion?: string;
  indice?: number;
  requerido?: boolean;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string;
}

export interface TipoValidacion {
  id: number;
  nombre?: string;
  descripcion?: string;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string;
}

export interface CreateCampoValidacionDTO {
  campoId: number;
  tipoValidacionId: number;
  valor: string;
  campoReferenciaId: number | null;
}

export interface UpdateCampoValidacionDTO {
  campoId: number;
  tipoValidacionId: number;
  valor: string;
  campoReferenciaId: number | null;
}

export interface ResponseCampoValidacionDTO {
  id: number;
  campo: Campo;
  tipoValidacion: TipoValidacion;
  valor: string;
  campoReferencia: Campo;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
