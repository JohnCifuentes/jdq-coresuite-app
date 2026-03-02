export interface Empresa {
  id: number;
  razonSocial: string;
}

export interface TipoIdentificacion {
  id: number;
  nombre: string;
}

export interface CreateUsuarioDTO {
  empresaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  telefono: string;
  correoElectronico: string;
}

export interface UpdateUsuarioDTO {
  empresaId: number;
  tipoIdentificacionId: number;
  numeroIdentificacion: string;
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  telefono: string;
  correoElectronico: string;
}

export interface InactiveUsuarioDTO {
  estado: string;
}

export interface UsuarioCredencialesDTO {
  correoElectronico: string;
  password: string;
}

export interface ResponseUsuarioDTO {
  id: number;
  empresa: Empresa;
  tipoIdentificacion: TipoIdentificacion;
  numeroIdentificacion: string;
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  telefono: string;
  correoElectronico: string;
  primerAcceso: boolean;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
