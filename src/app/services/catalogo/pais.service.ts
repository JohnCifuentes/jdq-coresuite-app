import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaisDTO } from '../../models/catalogo/pais.models';

interface RespuestaDTO<T> {
  error: boolean;
  datos: T;
}

@Injectable({
  providedIn: 'root'
})
export class PaisService {
  private apiUrl = `${environment.apiBaseUrl}/api/catalogo/paises`;

  constructor(private http: HttpClient) {}

  getAllPaises(): Observable<RespuestaDTO<PaisDTO[]>> {
    return this.http.get<RespuestaDTO<PaisDTO[]>>(this.apiUrl);
  }

  getPaisById(id: number): Observable<RespuestaDTO<PaisDTO>> {
    return this.http.get<RespuestaDTO<PaisDTO>>(`${this.apiUrl}/${id}`);
  }
}
