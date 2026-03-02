export interface TipoIdentificacion {
  id: number;
  nombre: string;
}

export interface Pais {
  id: number;
  nombre: string;
}

export interface Departamento {
  id: number;
  nombre: string;
}

export interface Municipio {
  id: number;
  nombre: string;
}

export interface CreateEmpresaDTO {
  tipoIdentificacionId: number;
  paisId: number;
  departamentoId: number;
  municipioId: number;
  numeroIdentificacion: string;
  razonSocial: string;
  direccion: string;
  correoElectronico: string;
  telefono: string;
}

export interface UpdateEmpresaDTO {
  tipoIdentificacionId: number;
  paisId: number;
  departamentoId: number;
  municipioId: number;
  numeroIdentificacion: string;
  razonSocial: string;
  direccion: string;
  correoElectronico: string;
  telefono: string;
}

export interface InactiveEmpresaDTO {
  estado: string;
}

export interface ResponseEmpresaDTO {
  id: number;
  tipoIdentificacion: TipoIdentificacion;
  pais: Pais;
  departamento: Departamento;
  municipio: Municipio;
  numeroIdentificacion: string;
  razonSocial: string;
  direccion: string;
  correoElectronico: string;
  telefono: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}

export interface RespuestaDTO<T> {
  error: boolean;
  datos: T;
}
