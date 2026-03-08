import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateListaValoresDTO,
  UpdateListaValoresDTO,
  ResponseListaValoresDTO
} from '../../models/operacion/lista-valores.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class ListaValoresService {
  private apiUrl = `${environment.apiBaseUrl}/api/operacion/lista-valores`;
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

  createListaValores(createListaValoresDTO: CreateListaValoresDTO): Observable<RespuestaDTO<ResponseListaValoresDTO>> {
    return this.http.post<RespuestaDTO<ResponseListaValoresDTO>>(this.apiUrl, createListaValoresDTO, this.getAuthOptions());
  }

  updateListaValores(id: number, updateListaValoresDTO: UpdateListaValoresDTO): Observable<RespuestaDTO<ResponseListaValoresDTO>> {
    return this.http.put<RespuestaDTO<ResponseListaValoresDTO>>(`${this.apiUrl}/${id}`, updateListaValoresDTO, this.getAuthOptions());
  }

  getAllListaValores(): Observable<RespuestaDTO<ResponseListaValoresDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseListaValoresDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getListaValoresById(id: number): Observable<RespuestaDTO<ResponseListaValoresDTO>> {
    return this.http.get<RespuestaDTO<ResponseListaValoresDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }

  getListaValoresByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseListaValoresDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseListaValoresDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`, this.getAuthOptions());
  }
}
