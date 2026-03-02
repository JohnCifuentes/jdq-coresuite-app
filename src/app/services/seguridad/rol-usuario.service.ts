import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRolUsuarioDTO,
  UpdateRolUsuarioDTO,
  InactiveRolUsuarioDTO,
  ResponseRolUsuarioDTO
} from '../../models/seguridad/rol-usuario.models';

interface RespuestaDTO<T> {
  error: boolean;
  datos: T;
}

@Injectable({
  providedIn: 'root'
})
export class RolUsuarioService {
  private apiUrl = `${environment.apiBaseUrl}/api/seguridad/rol-usuario`;

  constructor(private http: HttpClient) {}

  createRolUsuario(createRolUsuarioDTO: CreateRolUsuarioDTO): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.post<RespuestaDTO<ResponseRolUsuarioDTO>>(this.apiUrl, createRolUsuarioDTO);
  }

  updateRolUsuario(id: number, updateRolUsuarioDTO: UpdateRolUsuarioDTO): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolUsuarioDTO>>(`${this.apiUrl}/${id}`, updateRolUsuarioDTO);
  }

  inactiveRolUsuario(id: number, inactiveRolUsuarioDTO: InactiveRolUsuarioDTO): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseRolUsuarioDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveRolUsuarioDTO);
  }

  getAllRolUsuarios(): Observable<RespuestaDTO<ResponseRolUsuarioDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseRolUsuarioDTO[]>>(this.apiUrl);
  }

  getRolUsuarioById(id: number): Observable<RespuestaDTO<ResponseRolUsuarioDTO>> {
    return this.http.get<RespuestaDTO<ResponseRolUsuarioDTO>>(`${this.apiUrl}/${id}`);
  }

  getRolUsuariosByEmpresa(empresaId: number): Observable<ResponseRolUsuarioDTO[]> {
    return this.http.get<ResponseRolUsuarioDTO[]>(`${this.apiUrl}/${empresaId}/empresa`);
  }
}
