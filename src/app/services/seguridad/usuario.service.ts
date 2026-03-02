import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  InactiveUsuarioDTO,
  UsuarioCredencialesDTO,
  ResponseUsuarioDTO
} from '../../models/seguridad/usuario.models';

interface RespuestaDTO<T> {
  error: boolean;
  datos: T;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiBaseUrl}/api/seguridad/usuario`;

  constructor(private http: HttpClient) {}

  createUsuario(createUsuarioDTO: CreateUsuarioDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.post<RespuestaDTO<ResponseUsuarioDTO>>(this.apiUrl, createUsuarioDTO);
  }

  updateUsuario(id: number, updateUsuarioDTO: UpdateUsuarioDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/${id}`, updateUsuarioDTO);
  }

  inactiveUsuario(id: number, inactiveUsuarioDTO: InactiveUsuarioDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveUsuarioDTO);
  }

  getAllUsuarios(): Observable<RespuestaDTO<ResponseUsuarioDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseUsuarioDTO[]>>(this.apiUrl);
  }

  getUsuarioById(id: number): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.get<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/${id}`);
  }

  getUsuariosByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseUsuarioDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseUsuarioDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`);
  }

  getUsuarioByCorreoElectronicoAndPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.post<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/usuario/correo/password`, usuarioCredencialesDTO);
  }

  asignarPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/asignar/password`, usuarioCredencialesDTO);
  }

  recuperarPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/recuperar/password`, usuarioCredencialesDTO);
  }

  actualizarPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/actualizar/password`, usuarioCredencialesDTO);
  }
}
