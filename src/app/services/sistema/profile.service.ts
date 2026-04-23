import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RespuestaDTO } from '../../models/response.dto';
import { ResponseLicenciaDTO, UpdateLicenciaDTO } from '../../models/sistema/licencia.models';
import { UpdateUserPlanRequest } from '../../models/sistema/payment.models';
import { LicenciaService } from './licencia.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private licenciaService: LicenciaService) {}

  updateUserPlan(request: UpdateUserPlanRequest): Observable<RespuestaDTO<ResponseLicenciaDTO>> {
    const payload: UpdateLicenciaDTO = {
      empresaId: request.empresaId,
      planId: request.planId,
      fechaCompra: request.fechaCompra,
      fechaExpiracion: request.fechaExpiracion,
      activo: request.activo
    };

    return this.licenciaService.updateLicencia(request.licenciaId, payload);
  }
}
