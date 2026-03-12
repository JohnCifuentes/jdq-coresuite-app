import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInterfazDTO,
  UpdateInterfazDTO,
  ResponseInterfazDTO
} from '../../models/operacion/interfaz.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class InterfazService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/interfaz`;
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

  createInterfaz(createInterfazDTO: CreateInterfazDTO): Observable<RespuestaDTO<ResponseInterfazDTO>> {
    return this.http.post<RespuestaDTO<ResponseInterfazDTO>>(
      this.apiUrl,
      createInterfazDTO,
      this.getAuthOptions()
    );
  }

  updateInterfaz(id: number, updateInterfazDTO: UpdateInterfazDTO): Observable<RespuestaDTO<ResponseInterfazDTO>> {
    return this.http.put<RespuestaDTO<ResponseInterfazDTO>>(
      `${this.apiUrl}/${id}`,
      updateInterfazDTO,
      this.getAuthOptions()
    );
  }

  getAllInterfaz(): Observable<RespuestaDTO<ResponseInterfazDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseInterfazDTO[]>>(
      this.apiUrl,
      this.getAuthOptions()
    );
  }

  getInterfazById(id: number): Observable<RespuestaDTO<ResponseInterfazDTO>> {
    return this.http.get<RespuestaDTO<ResponseInterfazDTO>>(
      `${this.apiUrl}/${id}`,
      this.getAuthOptions()
    );
  }

  getInterfazByModulo(moduloId: number): Observable<RespuestaDTO<ResponseInterfazDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseInterfazDTO[]>>(
      `${this.apiUrl}/${moduloId}/modulo`,
      this.getAuthOptions()
    );
  }
}
