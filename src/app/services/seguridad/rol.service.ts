import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRolDTO,
  UpdateRolDTO,
  InactiveRolDTO,
  ResponseRolDTO
} from '../../models/seguridad/rol.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class RolService {
  private apiUrl = `${environment.apiBaseUrl}/api/seguridad/rol`;
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

  createRol(createRolDTO: CreateRolDTO): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.post<RespuestaDTO<ResponseRolDTO>>(this.apiUrl, createRolDTO, this.getAuthOptions());
  }

  updateRol(id: number, updateRolDTO: UpdateRolDTO): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolDTO>>(`${this.apiUrl}/${id}`, updateRolDTO, this.getAuthOptions());
  }

  inactiveRol(id: number, inactiveRolDTO: InactiveRolDTO): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveRolDTO, this.getAuthOptions());
  }

  getAllRoles(): Observable<RespuestaDTO<ResponseRolDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseRolDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getRolById(id: number): Observable<RespuestaDTO<ResponseRolDTO>> {
    return this.http.get<RespuestaDTO<ResponseRolDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }

  getRolsByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseRolDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseRolDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`, this.getAuthOptions());
  }
}
