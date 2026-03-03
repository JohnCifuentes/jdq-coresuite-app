import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

  createEmpresa(createEmpresaDTO: CreateEmpresaDTO): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.post<RespuestaDTO<ResponseEmpresaDTO>>(this.apiUrl, createEmpresaDTO);
  }

  updateEmpresa(id: number, updateEmpresaDTO: UpdateEmpresaDTO): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.put<RespuestaDTO<ResponseEmpresaDTO>>(`${this.apiUrl}/${id}`, updateEmpresaDTO);
  }

  inactiveEmpresa(id: number, inactiveEmpresaDTO: InactiveEmpresaDTO): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.put<RespuestaDTO<ResponseEmpresaDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveEmpresaDTO);
  }

  getAllEmpresas(): Observable<RespuestaDTO<ResponseEmpresaDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseEmpresaDTO[]>>(this.apiUrl);
  }

  getEmpresaById(id: number): Observable<RespuestaDTO<ResponseEmpresaDTO>> {
    return this.http.get<RespuestaDTO<ResponseEmpresaDTO>>(`${this.apiUrl}/${id}`);
  }
}
