import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateInterfaceGrupoCamposDTO,
  UpdateInterfaceGrupoCamposDTO,
  ResponseInterfaceGrupoCamposDTO
} from '../../models/operacion/interface-grupo-campos.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class InterfaceGrupoCamposService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/interface-grupo-campos`;
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

  createInterfaceGrupoCampos(
    createInterfaceGrupoCamposDTO: CreateInterfaceGrupoCamposDTO
  ): Observable<RespuestaDTO<ResponseInterfaceGrupoCamposDTO>> {
    return this.http.post<RespuestaDTO<ResponseInterfaceGrupoCamposDTO>>(
      this.apiUrl,
      createInterfaceGrupoCamposDTO,
      this.getAuthOptions()
    );
  }

  updateInterfaceGrupoCampos(
    id: number,
    updateInterfaceGrupoCamposDTO: UpdateInterfaceGrupoCamposDTO
  ): Observable<RespuestaDTO<ResponseInterfaceGrupoCamposDTO>> {
    return this.http.put<RespuestaDTO<ResponseInterfaceGrupoCamposDTO>>(
      `${this.apiUrl}/${id}`,
      updateInterfaceGrupoCamposDTO,
      this.getAuthOptions()
    );
  }

  getAllInterfaceGrupoCampos(): Observable<RespuestaDTO<ResponseInterfaceGrupoCamposDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseInterfaceGrupoCamposDTO[]>>(
      this.apiUrl,
      this.getAuthOptions()
    );
  }

  getInterfaceGrupoCamposById(id: number): Observable<RespuestaDTO<ResponseInterfaceGrupoCamposDTO>> {
    return this.http.get<RespuestaDTO<ResponseInterfaceGrupoCamposDTO>>(
      `${this.apiUrl}/${id}`,
      this.getAuthOptions()
    );
  }

  getInterfaceGrupoCamposByInterfaz(
    interfazId: number
  ): Observable<RespuestaDTO<ResponseInterfaceGrupoCamposDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseInterfaceGrupoCamposDTO[]>>(
      `${this.apiUrl}/${interfazId}/interfaz`,
      this.getAuthOptions()
    );
  }
}
