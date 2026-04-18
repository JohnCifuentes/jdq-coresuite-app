export interface RespuestaDTO<T> {
  error: boolean;
  contenido: T;
}

export interface TokenDTO {
  token: string;
}
