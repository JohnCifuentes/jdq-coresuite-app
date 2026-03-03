import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

  createSesion(createSesionDTO: CreateSesionDTO): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.post<RespuestaDTO<ResponseSesionDTO>>(this.apiUrl, createSesionDTO);
  }

  updateSesion(id: number, updateSesionDTO: UpdateSesionDTO): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.put<RespuestaDTO<ResponseSesionDTO>>(`${this.apiUrl}/${id}`, updateSesionDTO);
  }

  inactiveSesion(id: number, inactiveSesionDTO: InactiveSesionDTO): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.put<RespuestaDTO<ResponseSesionDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveSesionDTO);
  }

  getAllSesiones(): Observable<RespuestaDTO<ResponseSesionDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseSesionDTO[]>>(this.apiUrl);
  }

  getSesionById(id: number): Observable<RespuestaDTO<ResponseSesionDTO>> {
    return this.http.get<RespuestaDTO<ResponseSesionDTO>>(`${this.apiUrl}/${id}`);
  }

  getSesionesByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseSesionDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseSesionDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`);
  }
}
