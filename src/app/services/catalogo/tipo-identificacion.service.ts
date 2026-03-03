import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TipoIdentificacionDTO } from '../../models/catalogo/tipo-identificacion.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class TipoIdentificacionService {
  private apiUrl = `${environment.apiBaseUrl}/api/catalogo/tipos-identificacion`;

  constructor(private http: HttpClient) {}

  getAllTiposIdentificacion(): Observable<RespuestaDTO<TipoIdentificacionDTO[]>> {
    return this.http.get<RespuestaDTO<TipoIdentificacionDTO[]>>(this.apiUrl);
  }

  getTipoIdentificacionById(id: number): Observable<RespuestaDTO<TipoIdentificacionDTO>> {
    return this.http.get<RespuestaDTO<TipoIdentificacionDTO>>(`${this.apiUrl}/${id}`);
  }
}
