import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRolUsuarioDTO,
  UpdateRolUsuarioDTO,
  InactiveRolUsuarioDTO,
  ResponseRolUsuarioDTO
} from '../../models/seguridad/rol-usuario.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {
  private apiUrl = `${environment.apiBaseUrl}/api/seguridad/rol-usuario`;
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

  createRolUsuario(createRolUsuarioDTO: CreateRolUsuarioDTO): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.post<RespuestaDTO<ResponseRolUsuarioDTO>>(this.apiUrl, createRolUsuarioDTO, this.getAuthOptions());
  }

  updateRolUsuario(id: number, updateRolUsuarioDTO: UpdateRolUsuarioDTO): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolUsuarioDTO>>(`${this.apiUrl}/${id}`, updateRolUsuarioDTO, this.getAuthOptions());
  }

  inactiveRolUsuario(id: number, inactiveRolUsuarioDTO: InactiveRolUsuarioDTO): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolUsuarioDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveRolUsuarioDTO, this.getAuthOptions());
  }

  getAllRolUsuarios(): Observable<RespuestaDTO<ResponseRolUsuarioDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseRolUsuarioDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getRolUsuarioById(id: number): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.get<RespuestaDTO<ResponseRolUsuarioDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }

  getRolUsuariosByEmpresa(empresaId: number): Observable<ResponseRolUsuarioDTO[]> {
    return this.http.get<ResponseRolUsuarioDTO[]>(`${this.apiUrl}/${empresaId}/empresa`, this.getAuthOptions());
  }
}
