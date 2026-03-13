import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateLicenciaDTO,
  UpdateLicenciaDTO,
  InactiveLicenciaDTO,
  ResponseLicenciaDTO
} from '../../models/sistema/licencia.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class LicenciaService {
  private apiUrl = `${environment.apiBaseUrl}/api/sistema/licencia`;
  private storageKey = 'auth_token';

  constructor(private http: HttpClient) {}

  private getAuthOptions() {
    const token = localStorage.getItem(this.storageKey);
    if (!token) {
      return {};
    }

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  createLicencia(createLicenciaDTO: CreateLicenciaDTO): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.post<RespuestaDTO<ResponseLicenciaDTO>>(this.apiUrl, createLicenciaDTO, this.getAuthOptions());
  }

  updateLicencia(id: number, updateLicenciaDTO: UpdateLicenciaDTO): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.put<RespuestaDTO<ResponseLicenciaDTO>>(`${this.apiUrl}/${id}`, updateLicenciaDTO, this.getAuthOptions());
  }

  inactiveLicencia(id: number, inactiveLicenciaDTO: InactiveLicenciaDTO): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.put<RespuestaDTO<ResponseLicenciaDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveLicenciaDTO, this.getAuthOptions());
  }

  getAllLicencias(): Observable<RespuestaDTO<ResponseLicenciaDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseLicenciaDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getLicenciaById(id: number): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.get<RespuestaDTO<ResponseLicenciaDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }

  getLicenciasByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseLicenciaDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseLicenciaDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`, this.getAuthOptions());
  }
}
