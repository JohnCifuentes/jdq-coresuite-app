import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// reuse RespuestaDTO from shared models
import { RespuestaDTO } from '../../models/response.dto';

interface LoginResponse {
  token: string;
}

interface LoginRequest {
  correoElectronico: string;
  password: string;
}

export type UserRole = 'SUPER-ADMIN' | 'ADMIN-EMPRESA' | 'OPERACION';

interface TokenClaims {
  rol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = `${environment.apiBaseUrl}/api/login`;
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

  login(credentials: LoginRequest): Observable<RespuestaDTO<LoginResponse>> {
    return this.http.post<RespuestaDTO<LoginResponse>>(this.apiUrl, credentials);
  }

  cerrarSesion(usuarioId: number): Observable<RespuestaDTO<string>> {
    return this.http.put<RespuestaDTO<string>>(this.apiUrl, usuarioId, this.getAuthOptions());
  }

  setToken(token: string) {
    localStorage.setItem(this.storageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  clearToken() {
    localStorage.removeItem(this.storageKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getRoleFromToken(token: string | null = this.getToken()): UserRole {
    if (!token) {
      return 'OPERACION';
    }

    try {
      const payload = token.split('.')[1];

      if (!payload) {
        return 'OPERACION';
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
      const paddedPayload = normalizedPayload + '='.repeat(paddingLength);
      const decodedPayload = atob(paddedPayload);
      const claims = JSON.parse(decodedPayload) as TokenClaims;
      const role = (claims.rol ?? '').toUpperCase();

      if (role === 'SUPER-ADMIN' || role === 'ADMIN-EMPRESA' || role === 'OPERACION') {
        return role;
      }

      return 'OPERACION';
    } catch {
      return 'OPERACION';
    }
  }

  getRedirectByRole(role: UserRole): string {
    if (role === 'SUPER-ADMIN') {
      return '/app/super-admin-home';
    }

    if (role === 'ADMIN-EMPRESA') {
      return '/app/admin-empresa-home';
    }

    return '/app/operacion';
  }

  getRedirectFromToken(token: string | null = this.getToken()): string {
    return this.getRedirectByRole(this.getRoleFromToken(token));
  }
}
