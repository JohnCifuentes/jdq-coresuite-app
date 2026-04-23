import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateSesionDTO,
  UpdateSesionDTO,
  InactiveSesionDTO,
  ResponseSesionDTO
} from '../../models/sistema/sesion.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class SesionService {
  private apiUrl = `${environment.apiBaseUrl}/api/sistema/sesion`;
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

  createSesion(createSesionDTO: CreateSesionDTO): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.post<RespuestaDTO<ResponseSesionDTO>>(this.apiUrl, createSesionDTO, this.getAuthOptions());
  }

  updateSesion(id: number, updateSesionDTO: UpdateSesionDTO): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.put<RespuestaDTO<ResponseSesionDTO>>(`${this.apiUrl}/${id}`, updateSesionDTO, this.getAuthOptions());
  }

  inactiveSesion(id: number, inactiveSesionDTO: InactiveSesionDTO): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.put<RespuestaDTO<ResponseSesionDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveSesionDTO, this.getAuthOptions());
  }

  getAllSesiones(): Observable<RespuestaDTO<ResponseSesionDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseSesionDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getSesionById(id: number): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.get<RespuestaDTO<ResponseSesionDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }

  getSesionesByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseSesionDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseSesionDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`, this.getAuthOptions());
  }
  
}
