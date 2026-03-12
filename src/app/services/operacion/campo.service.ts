import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateCampoDTO,
  UpdateCampoDTO,
  ResponseCampoDTO
} from '../../models/operacion/campo.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class CampoService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/campo`;
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

  createCampo(createCampoDTO: CreateCampoDTO): Observable<RespuestaDTO<ResponseCampoDTO>> {
    return this.http.post<RespuestaDTO<ResponseCampoDTO>>(
      this.apiUrl,
      createCampoDTO,
      this.getAuthOptions()
    );
  }

  updateCampo(id: number, updateCampoDTO: UpdateCampoDTO): Observable<RespuestaDTO<ResponseCampoDTO>> {
    return this.http.put<RespuestaDTO<ResponseCampoDTO>>(
      `${this.apiUrl}/${id}`,
      updateCampoDTO,
      this.getAuthOptions()
    );
  }

  getAllCampos(): Observable<RespuestaDTO<ResponseCampoDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseCampoDTO[]>>(
      this.apiUrl,
      this.getAuthOptions()
    );
  }

  getCampoById(id: number): Observable<RespuestaDTO<ResponseCampoDTO>> {
    return this.http.get<RespuestaDTO<ResponseCampoDTO>>(
      `${this.apiUrl}/${id}`,
      this.getAuthOptions()
    );
  }

  getCamposByInterfaz(interfazId: number): Observable<RespuestaDTO<ResponseCampoDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseCampoDTO[]>>(
      `${this.apiUrl}/${interfazId}/interfaz`,
      this.getAuthOptions()
    );
  }
}
