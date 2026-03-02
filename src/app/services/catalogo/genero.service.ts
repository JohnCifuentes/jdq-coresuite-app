import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GeneroDTO } from '../../models/catalogo/genero.models';

interface RespuestaDTO<T> {
  error: boolean;
  datos: T;
}

@Injectable({
  providedIn: 'root'
})
export class GeneroService {
  private apiUrl = `${environment.apiBaseUrl}/api/catalogo/generos`;

  constructor(private http: HttpClient) {}

  getAllGeneros(): Observable<RespuestaDTO<GeneroDTO[]>> {
    return this.http.get<RespuestaDTO<GeneroDTO[]>>(this.apiUrl);
  }

  getGeneroById(id: number): Observable<RespuestaDTO<GeneroDTO>> {
    return this.http.get<RespuestaDTO<GeneroDTO>>(`${this.apiUrl}/${id}`);
  }
}
