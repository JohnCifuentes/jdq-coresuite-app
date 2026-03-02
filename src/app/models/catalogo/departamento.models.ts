export interface Pais {
  id: number;
  codigo: string;
  iso3: string;
  nombre: string;
}

export interface DepartamentoDTO {
  id: number;
  pais: Pais;
  codigo: string;
  nombre: string;
  abreviatura: string;
}
