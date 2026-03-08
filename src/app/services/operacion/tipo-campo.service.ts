import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTipoCampoDTO,
  UpdateTipoCampoDTO,
  ResponseTipoCampoDTO
} from '../../models/operacion/tipo-campo.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class TipoCampoService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/tipo-campo`;
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

  createTipoCampo(createTipoCampoDTO: CreateTipoCampoDTO): Observable<RespuestaDTO<ResponseTipoCampoDTO>> {
    return this.http.post<RespuestaDTO<ResponseTipoCampoDTO>>(this.apiUrl, createTipoCampoDTO, this.getAuthOptions());
  }

  updateTipoCampo(id: number, updateTipoCampoDTO: UpdateTipoCampoDTO): Observable<RespuestaDTO<ResponseTipoCampoDTO>> {
    return this.http.put<RespuestaDTO<ResponseTipoCampoDTO>>(`${this.apiUrl}/${id}`, updateTipoCampoDTO, this.getAuthOptions());
  }

  getAllTipoCampos(): Observable<RespuestaDTO<ResponseTipoCampoDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseTipoCampoDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getTipoCampoById(id: number): Observable<RespuestaDTO<ResponseTipoCampoDTO>> {
    return this.http.get<RespuestaDTO<ResponseTipoCampoDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }
}
