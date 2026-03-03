import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DepartamentoDTO } from '../../models/catalogo/departamento.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class DepartamentoService {
  private apiUrl = `${environment.apiBaseUrl}/api/catalogo/departamentos`;

  constructor(private http: HttpClient) {}

  getAllDepartamentos(): Observable<RespuestaDTO<DepartamentoDTO[]>> {
    return this.http.get<RespuestaDTO<DepartamentoDTO[]>>(this.apiUrl);
  }

  getAllDepartamentosByPais(paisId: number): Observable<RespuestaDTO<DepartamentoDTO[]>> {
    return this.http.get<RespuestaDTO<DepartamentoDTO[]>>(`${this.apiUrl}/${paisId}/pais`);
  }

  getDepartamentoById(id: number): Observable<RespuestaDTO<DepartamentoDTO>> {
    return this.http.get<RespuestaDTO<DepartamentoDTO>>(`${this.apiUrl}/${id}/`);
  }
}
