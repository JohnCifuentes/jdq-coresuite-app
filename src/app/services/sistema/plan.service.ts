import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}

  createPlan(createPlanDTO: CreatePlanDTO): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.post<RespuestaDTO<ResponsePlanDTO>>(this.apiUrl, createPlanDTO);
  }

  updatePlan(id: number, updatePlanDTO: UpdatePlanDTO): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.put<RespuestaDTO<ResponsePlanDTO>>(`${this.apiUrl}/${id}`, updatePlanDTO);
  }

  inactivePlan(id: number, inactivePlanDTO: InactivePlanDTO): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.put<RespuestaDTO<ResponsePlanDTO>>(`${this.apiUrl}/${id}/inactive`, inactivePlanDTO);
  }

  getAllPlanes(): Observable<RespuestaDTO<ResponsePlanDTO[]>> {
    return this.http.get<RespuestaDTO<ResponsePlanDTO[]>>(this.apiUrl);
  }

  getPlanById(id: number): Observable<RespuestaDTO<ResponsePlanDTO>> {
    return this.http.get<RespuestaDTO<ResponsePlanDTO>>(`${this.apiUrl}/${id}`);
  }
}
