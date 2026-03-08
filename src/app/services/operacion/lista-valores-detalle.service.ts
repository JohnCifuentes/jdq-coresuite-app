import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateListaValoresDetalleDTO,
  UpdateListaValoresDetalleDTO,
  ResponseListaValoresDetalleDTO
} from '../../models/operacion/lista-valores-detalle.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class ListaValoresDetalleService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/lista-valores-detalle`;
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

  createListaValoresDetalle(
    createListaValoresDetalleDTO: CreateListaValoresDetalleDTO
  ): Observable<RespuestaDTO<ResponseListaValoresDetalleDTO>> {
    return this.http.post<RespuestaDTO<ResponseListaValoresDetalleDTO>>(
      this.apiUrl,
      createListaValoresDetalleDTO,
      this.getAuthOptions()
    );
  }

  updateListaValoresDetalle(
    id: number,
    updateListaValoresDetalleDTO: UpdateListaValoresDetalleDTO
  ): Observable<RespuestaDTO<ResponseListaValoresDetalleDTO>> {
    return this.http.put<RespuestaDTO<ResponseListaValoresDetalleDTO>>(
      `${this.apiUrl}/${id}`,
      updateListaValoresDetalleDTO,
      this.getAuthOptions()
    );
  }

  getAllListaValoresDetalle(): Observable<RespuestaDTO<ResponseListaValoresDetalleDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseListaValoresDetalleDTO[]>>(
      this.apiUrl,
      this.getAuthOptions()
    );
  }

  getListaValoresDetalleById(id: number): Observable<RespuestaDTO<ResponseListaValoresDetalleDTO>> {
    return this.http.get<RespuestaDTO<ResponseListaValoresDetalleDTO>>(
      `${this.apiUrl}/${id}`,
      this.getAuthOptions()
    );
  }

  getListaValoresDetalleByListaValores(
    listaValoresId: number
  ): Observable<RespuestaDTO<ResponseListaValoresDetalleDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseListaValoresDetalleDTO[]>>(
      `${this.apiUrl}/${listaValoresId}/lista-valores`,
      this.getAuthOptions()
    );
  }
}
