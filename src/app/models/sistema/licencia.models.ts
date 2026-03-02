export interface Empresa {
  id: number;
  razonSocial: string;
}

export interface Plan {
  id: number;
  nombre: string;
}

export interface CreateLicenciaDTO {
  empresaId: number;
  planId: number;
  fechaCompra: string;
  fechaExpiracion: string;
  activo: boolean;
}

export interface UpdateLicenciaDTO {
  empresaId: number;
  planId: number;
  fechaCompra: string;
  fechaExpiracion: string;
  activo: boolean;
}

export interface InactiveLicenciaDTO {
  estado: string;
}

export interface ResponseLicenciaDTO {
  id: number;
  empresa: Empresa;
  plan: Plan;
  fechaCompra: string;
  fechaExpiracion: string;
  activo: boolean;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
