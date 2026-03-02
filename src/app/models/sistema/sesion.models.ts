export interface Empresa {
  id: number;
  razonSocial: string;
}

export interface Usuario {
  id: number;
  nombre: string;
}

export interface CreateSesionDTO {
  empresaId: number;
  usuarioId: number;
  fechaInicio: string;
  fechaUltimoAcceso: string;
  fechaCierre: string;
}

export interface UpdateSesionDTO {
  empresaId: number;
  usuarioId: number;
  fechaInicio: string;
  fechaUltimoAcceso: string;
  fechaCierre: string;
}

export interface InactiveSesionDTO {
  estado: string;
}

export interface ResponseSesionDTO {
  id: number;
  empresa: Empresa;
  usuario: Usuario;
  fechaInicio: string;
  fechaUltimoAcceso: string;
  fechaCierre: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
