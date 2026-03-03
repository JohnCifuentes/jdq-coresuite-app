import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateLicenciaDTO,
  UpdateLicenciaDTO,
  InactiveLicenciaDTO,
  ResponseLicenciaDTO
} from '../../models/sistema/licencia.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class LicenciaService {
  private apiUrl = `${environment.apiBaseUrl}/api/sistema/licencia`;

  constructor(private http: HttpClient) {}

  createLicencia(createLicenciaDTO: CreateLicenciaDTO): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.post<RespuestaDTO<ResponseLicenciaDTO>>(this.apiUrl, createLicenciaDTO);
  }

  updateLicencia(id: number, updateLicenciaDTO: UpdateLicenciaDTO): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.put<RespuestaDTO<ResponseLicenciaDTO>>(`${this.apiUrl}/${id}`, updateLicenciaDTO);
  }

  inactiveLicencia(id: number, inactiveLicenciaDTO: InactiveLicenciaDTO): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.put<RespuestaDTO<ResponseLicenciaDTO>>(`${this.apiUrl}/${id}/inactive`, inactiveLicenciaDTO);
  }

  getAllLicencias(): Observable<RespuestaDTO<ResponseLicenciaDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseLicenciaDTO[]>>(this.apiUrl);
  }

  getLicenciaById(id: number): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    return this.http.get<RespuestaDTO<ResponseLicenciaDTO>>(`${this.apiUrl}/${id}`);
  }

  getLicenciasByEmpresa(empresaId: number): Observable<RespuestaDTO<ResponseLicenciaDTO[]>> {
    return this.http.get<RespuestaDTO<ResponseLicenciaDTO[]>>(`${this.apiUrl}/${empresaId}/empresa`);
  }
}
