import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateCodigoDTO, ConfirmarUsuarioCodigoDTO } from '../../models/seguridad/codigo.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class CodigoService {
  private apiUrl = `${environment.apiBaseUrl}/api/seguridad/codigo`;

  constructor(private http: HttpClient) {}

  generar(codigoDTO: CreateCodigoDTO): Observable<RespuestaDTO<string>> {
    return this.http.post<RespuestaDTO<string>>(
      `${this.apiUrl}/generar?correoElectronico=${encodeURIComponent(codigoDTO.correoElectronico)}`,
      {}
    );
  }

  confirmarCodigo(codigoDTO: ConfirmarUsuarioCodigoDTO): Observable<RespuestaDTO<string>> {
    return this.http.post<RespuestaDTO<string>>(
      `${this.apiUrl}/confirmar?correoElectronico=${encodeURIComponent(codigoDTO.correoElectronico)}&codigo=${encodeURIComponent(codigoDTO.codigo)}`,
      {}
    );
  }
}
