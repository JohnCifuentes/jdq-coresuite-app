import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePlanDTO,
  UpdatePlanDTO,
  InactivePlanDTO,
  ResponsePlanDTO
} from '../../models/sistema/plan.models';
import { RespuestaDTO } from '../../models/response.dto';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private apiUrl = `${environment.apiBaseUrl}/api/sistema/plan`;
  private storageKey = 'auth_token';

  constructor(private http: HttpClient) {}

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

  createPlan(createPlanDTO: CreatePlanDTO): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.post<RespuestaDTO<ResponsePlanDTO>>(this.apiUrl, createPlanDTO, this.getAuthOptions());
  }

  updatePlan(id: number, updatePlanDTO: UpdatePlanDTO): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.put<RespuestaDTO<ResponsePlanDTO>>(`${this.apiUrl}/${id}`, updatePlanDTO, this.getAuthOptions());
  }

  inactivePlan(id: number, inactivePlanDTO: InactivePlanDTO): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.put<RespuestaDTO<ResponsePlanDTO>>(`${this.apiUrl}/${id}/inactive`, inactivePlanDTO, this.getAuthOptions());
  }

  getAllPlanes(): Observable<RespuestaDTO<ResponsePlanDTO[]>> {
    return this.http.get<RespuestaDTO<ResponsePlanDTO[]>>(this.apiUrl, this.getAuthOptions());
  }

  getPlanById(id: number): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.get<RespuestaDTO<ResponsePlanDTO>>(`${this.apiUrl}/${id}`, this.getAuthOptions());
  }
}
