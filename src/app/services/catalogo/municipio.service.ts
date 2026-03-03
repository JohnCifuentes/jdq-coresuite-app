import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MunicipioDTO } from '../../models/catalogo/municipio.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class MunicipioService {
  private apiUrl = `${environment.apiBaseUrl}/api/catalogo/ciudades`;

  constructor(private http: HttpClient) {}

  getAllMunicipios(): Observable<RespuestaDTO<MunicipioDTO[]>> {
    return this.http.get<RespuestaDTO<MunicipioDTO[]>>(this.apiUrl);
  }

  getAllMunicipiosByDepartamento(departamentoId: number): Observable<RespuestaDTO<MunicipioDTO[]>> {
    return this.http.get<RespuestaDTO<MunicipioDTO[]>>(`${this.apiUrl}/${departamentoId}/departamento`);
  }

  getMunicipioById(id: number): Observable<RespuestaDTO<MunicipioDTO>> {
    return this.http.get<RespuestaDTO<MunicipioDTO>>(`${this.apiUrl}/${id}`);
  }
}
