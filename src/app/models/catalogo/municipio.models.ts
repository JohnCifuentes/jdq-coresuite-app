export interface Departamento {
  id: number;
  codigo: string;
  nombre: string;
}

export interface MunicipioDTO {
  id: number;
  departamento: Departamento;
  codigo: string;
  nombre: string;
}
