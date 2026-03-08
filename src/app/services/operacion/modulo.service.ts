import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CreateModuloDTO,
  UpdateModuloDTO,
  ResponseModuloDTO
} from '../../models/operacion/modulo.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class ModuloService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/modulo`;
  private storageKey = 'auth_token';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  private getAuthOptions() {
    if (!isPlatformBrowser(this.platformId)) {
      return {};
    }

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

  createModulo(createModuloDTO: CreateModuloDTO): Observable<RespuestaDTO<ResponseModuloDTO>> {
    return this.http.post<RespuestaDTO<ResponseModuloDTO>>(this.apiUrl, createModuloDTO, this.getAuthOptions());
  }

  updateModulo(id: number, updateModuloDTO: UpdateModuloDTO): Observable<RespuestaDTO<ResponseModuloDTO>> {
    return this.http.put<RespuestaDTO<ResponseModuloDTO>>(`${this.apiUrl}/${id}`, updateModuloDTO, this.getAuthOptions());
  }

  getAllModulos(): Observable<RespuestaDTO<ResponseModuloDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseModuloDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getModuloById(id: number): Observable<RespuestaDTO<ResponseModuloDTO>> {
    return this.http.get<RespuestaDTO<ResponseModuloDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }

  getModulosByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseModuloDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseModuloDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`, this.getAuthOptions());
  }
}
