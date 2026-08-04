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
  private readonly LAST_USER_KEY = 'checador_last_user';
  private readonly LAST_TOKEN_KEY = 'checador_last_token';
  private readonly OFFLINE_MODE_KEY = 'checador_offline_mode';

  constructor(private http: HttpClient, private router: Router) {}

  login(claveChofer: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { claveChofer, password }).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(this.LAST_USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(this.LAST_TOKEN_KEY, res.token);
        localStorage.removeItem(this.OFFLINE_MODE_KEY);
      })
    );
  }

  enterOfflineMode(): boolean {
    const lastUser = this.getLastUser();
    if (!lastUser) return false;
    localStorage.setItem(this.USER_KEY, JSON.stringify(lastUser));
    localStorage.setItem(this.OFFLINE_MODE_KEY, 'true');
    const lastToken = localStorage.getItem(this.LAST_TOKEN_KEY);
    if (lastToken) localStorage.setItem(this.TOKEN_KEY, lastToken);
    return true;
  }

  isOfflineMode(): boolean {
    return localStorage.getItem(this.OFFLINE_MODE_KEY) === 'true';
  }

  getLastUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.LAST_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.OFFLINE_MODE_KEY);
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
    return !!this.getToken() || this.isOfflineMode();
  }
}
