import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRolDTO,
  UpdateRolDTO,
  InactiveRolDTO,
  ResponseRolDTO
} from '../../models/seguridad/rol.models';

interface RespuestaDTO<T> {
  error: boolean;
  datos: T;
}

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private apiUrl = `${environment.apiBaseUrl}/api/seguridad/rol`;

  constructor(private http: HttpClient) {}

  createRol(createRolDTO: CreateRolDTO): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.post<RespuestaDTO<ResponseRolDTO>>(this.apiUrl, createRolDTO);
  }

  updateRol(id: number, updateRolDTO: UpdateRolDTO): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolDTO>>(`${this.apiUrl}/${id}`, updateRolDTO);
  }

  inactiveRol(id: number, inactiveRolDTO: InactiveRolDTO): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveRolDTO);
  }

  getAllRoles(): Observable<RespuestaDTO<ResponseRolDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseRolDTO[]>>(this.apiUrl);
  }

  getRolById(id: number): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.get<RespuestaDTO<ResponseRolDTO>>(`${this.apiUrl}/${id}`);
  }

  getRolsByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseRolDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseRolDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`);
  }
}
