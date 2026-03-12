import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTipoValidacionDTO,
  UpdateTipoValidacionDTO,
  ResponseTipoValidacionDTO
} from '../../models/operacion/tipo-validacion.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class TipoValidacionService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/tipo-validacion`;
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

  createTipoValidacion(
    createTipoValidacionDTO: CreateTipoValidacionDTO
  ): Observable<RespuestaDTO<ResponseTipoValidacionDTO>> {
    return this.http.post<RespuestaDTO<ResponseTipoValidacionDTO>>(
      this.apiUrl,
      createTipoValidacionDTO,
      this.getAuthOptions()
    );
  }

  updateTipoValidacion(
    id: number,
    updateTipoValidacionDTO: UpdateTipoValidacionDTO
  ): Observable<RespuestaDTO<ResponseTipoValidacionDTO>> {
    return this.http.put<RespuestaDTO<ResponseTipoValidacionDTO>>(
      `${this.apiUrl}/${id}`,
      updateTipoValidacionDTO,
      this.getAuthOptions()
    );
  }

  getAllTipoValidaciones(): Observable<RespuestaDTO<ResponseTipoValidacionDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseTipoValidacionDTO[]>>(
      this.apiUrl,
      this.getAuthOptions()
    );
  }

  getTipoValidacionById(id: number): Observable<RespuestaDTO<ResponseTipoValidacionDTO>> {
    return this.http.get<RespuestaDTO<ResponseTipoValidacionDTO>>(
      `${this.apiUrl}/${id}`,
      this.getAuthOptions()
    );
  }
}
