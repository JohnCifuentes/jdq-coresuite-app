export interface Interfaz {
  id: number;
  nombre?: string;
  descripcion?: string;
  indice?: number;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string;
}

export interface InterfaceGrupoCampos {
  id: number;
  interfaz?: {
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

export interface TipoCampo {
  id: number;
  nombre?: string;
  descripcion?: string;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string;
}

export interface ListaValores {
  id: number;
  empresa?: {
    id: number;
    razonSocial?: string;
  };
  nombre?: string;
  descripcion?: string;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion?: string;
  usuarioActualizacion?: string;
  fechaActualizacion?: string;
}

export interface CreateCampoDTO {
  interfazId: number;
  interfaceGrupoCamposId: number;
  tipoCampoId: number;
  listaValoresId: number | null;
  nombre: string;
  etiqueta: string;
  descripcion: string;
  indice: number;
  columnas: number;
  valorDefecto: string | null;
}

export interface UpdateCampoDTO {
  interfazId: number;
  interfaceGrupoCamposId: number;
  tipoCampoId: number;
  listaValoresId: number | null;
  nombre: string;
  etiqueta: string;
  descripcion: string;
  indice: number;
  columnas: number;
  valorDefecto: string | null;
}

export interface ResponseCampoDTO {
  id: number;
  interfaz: Interfaz;
  interfaceGrupoCampos: InterfaceGrupoCampos;
  tipoCampo: TipoCampo;
  listaValores: ListaValores;
  nombre: string;
  etiqueta: string;
  descripcion: string;
  indice: number;
  columnas: number;
  valorDefecto: string;
  estado: string;
  usuarioCreacion: string;
  fechaCreacion: string;
  usuarioActualizacion: string;
  fechaActualizacion: string;
}
