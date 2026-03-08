import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  InactiveUsuarioDTO,
  UsuarioCredencialesDTO,
  ResponseUsuarioDTO
} from '../../models/seguridad/usuario.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiBaseUrl}/api/seguridad/usuario`;
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

  createUsuario(createUsuarioDTO: CreateUsuarioDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.post<RespuestaDTO<ResponseUsuarioDTO>>(this.apiUrl, createUsuarioDTO, this.getAuthOptions());
  }

  updateUsuario(id: number, updateUsuarioDTO: UpdateUsuarioDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/${id}`, updateUsuarioDTO, this.getAuthOptions());
  }

  inactiveUsuario(id: number, inactiveUsuarioDTO: InactiveUsuarioDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveUsuarioDTO, this.getAuthOptions());
  }

  getAllUsuarios(): Observable<RespuestaDTO<ResponseUsuarioDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseUsuarioDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getUsuarioById(id: number): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.get<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }

  getUsuariosByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseUsuarioDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseUsuarioDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`, this.getAuthOptions());
  }

  getUsuarioByCorreoElectronicoAndPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.get<RespuestaDTO<ResponseUsuarioDTO>>(
      `${this.apiUrl}/obtener/${encodeURIComponent(usuarioCredencialesDTO.correoElectronico)}/${encodeURIComponent(usuarioCredencialesDTO.password)}/usuario`
    );
  }

  asignarPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/asignar/password`, usuarioCredencialesDTO, this.getAuthOptions());
  }

  recuperarPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(
      `${this.apiUrl}/recuperar/password?correoElectronico=${encodeURIComponent(usuarioCredencialesDTO.correoElectronico)}&password=${encodeURIComponent(usuarioCredencialesDTO.password)}`,
      {}
    );
  }

  actualizarPassword(usuarioCredencialesDTO: UsuarioCredencialesDTO): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(`${this.apiUrl}/actualizar/password`, usuarioCredencialesDTO, this.getAuthOptions());
  }

  bloquearUsuario(correoElectronico: string): Observable<RespuestaDTO<ResponseUsuarioDTO>> {
    return this.http.put<RespuestaDTO<ResponseUsuarioDTO>>(
      `${this.apiUrl}/${encodeURIComponent(correoElectronico)}/bloquear/usuario`,
      {}
    );
  }
}
