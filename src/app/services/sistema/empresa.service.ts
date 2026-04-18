import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateEmpresaDTO,
  UpdateEmpresaDTO,
  InactiveEmpresaDTO,
  ResponseEmpresaDTO
} from '../../models/sistema/empresa.models';

import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = `${environment.apiBaseUrl}/api/sistema/empresa`;
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

  createEmpresa(createEmpresaDTO: CreateEmpresaDTO): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.post<RespuestaDTO<ResponseEmpresaDTO>>(this.apiUrl, createEmpresaDTO, this.getAuthOptions());
  }

  updateEmpresa(id: number, updateEmpresaDTO: UpdateEmpresaDTO): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.put<RespuestaDTO<ResponseEmpresaDTO>>(`${this.apiUrl}/${id}`, updateEmpresaDTO, this.getAuthOptions());
  }

  inactiveEmpresa(id: number, inactiveEmpresaDTO: InactiveEmpresaDTO): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.put<RespuestaDTO<ResponseEmpresaDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveEmpresaDTO, this.getAuthOptions());
  }

  getAllEmpresas(): Observable<RespuestaDTO<ResponseEmpresaDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseEmpresaDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getEmpresaById(id: number): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.get<RespuestaDTO<ResponseEmpresaDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }
}
