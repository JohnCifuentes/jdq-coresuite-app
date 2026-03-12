import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateCampoValidacionDTO,
  UpdateCampoValidacionDTO,
  ResponseCampoValidacionDTO
} from '../../models/operacion/campo-validacion.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class CampoValidacionService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/campo-validacion`;
  private storageKey = 'auth_token';

  constructor(
    private http: HttpClient
  ) {}

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

  createCampoValidacion(
    createCampoValidacionDTO: CreateCampoValidacionDTO
  ): Observable<RespuestaDTO<ResponseCampoValidacionDTO>> {
    return this.http.post<RespuestaDTO<ResponseCampoValidacionDTO>>(
      this.apiUrl,
      createCampoValidacionDTO,
      this.getAuthOptions()
    );
  }

  updateCampoValidacion(
    id: number,
    updateCampoValidacionDTO: UpdateCampoValidacionDTO
  ): Observable<RespuestaDTO<ResponseCampoValidacionDTO>> {
    return this.http.put<RespuestaDTO<ResponseCampoValidacionDTO>>(
      `${this.apiUrl}/${id}`,
      updateCampoValidacionDTO,
      this.getAuthOptions()
    );
  }

  getAllCampoValidaciones(): Observable<RespuestaDTO<ResponseCampoValidacionDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseCampoValidacionDTO[]>>(
      this.apiUrl,
      this.getAuthOptions()
    );
  }

  getCampoValidacionById(id: number): Observable<RespuestaDTO<ResponseCampoValidacionDTO>> {
    return this.http.get<RespuestaDTO<ResponseCampoValidacionDTO>>(
      `${this.apiUrl}/${id}`,
      this.getAuthOptions()
    );
  }

  getCampoValidacionesByCampo(campoId: number): Observable<RespuestaDTO<ResponseCampoValidacionDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseCampoValidacionDTO[]>>(
      `${this.apiUrl}/${campoId}/campo`,
      this.getAuthOptions()
    );
  }
}
