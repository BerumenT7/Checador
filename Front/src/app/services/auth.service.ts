import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthUser {
  claveChofer: string;
  nombreCompleto: string;
  departamento: string;
  rol: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly TOKEN_KEY = 'checador_token';
  private readonly USER_KEY  = 'checador_user';

  constructor(private http: HttpClient, private router: Router) {}

  login(claveChofer: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { claveChofer, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
