import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = `${environment.apiBaseUrl}/api/login`;
  private storageKey = 'auth_token';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<RespuestaDTO<LoginResponse>> {
    return this.http.post<RespuestaDTO<LoginResponse>>(this.apiUrl, credentials);
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
}
