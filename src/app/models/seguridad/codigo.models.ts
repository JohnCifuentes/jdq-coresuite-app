export interface CreateCodigoDTO {
  correoElectronico: string;
}

export interface ConfirmarUsuarioCodigoDTO {
  correoElectronico: string;
  codigo: string;
}
