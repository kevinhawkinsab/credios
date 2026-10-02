import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from './auth.models';

const API_URL = 'http://localhost:3000/api';
const ACCESS_TOKEN_KEY = 'crediplus.accessToken';
const REFRESH_TOKEN_KEY = 'crediplus.refreshToken';
const USER_KEY = 'crediplus.user';
const REMEMBER_KEY = 'crediplus.remember';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<AuthUser | null>(this.readUser());
  private readonly accessToken = signal<string | null>(this.readStorage(ACCESS_TOKEN_KEY));

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  login(payload: LoginPayload, rememberDevice: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, payload).pipe(
      tap((response) => this.saveSession(response, rememberDevice)),
    );
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, payload).pipe(
      tap((response) => this.saveSession(response, true)),
    );
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API_URL}/auth/me`).pipe(
      tap((user) => this.currentUser.set(user)),
    );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return of(null as unknown as AuthResponse);
    }

    return this.http.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken }).pipe(
      tap((response) => this.saveSession(response, this.shouldRemember())),
    );
  }

  logout(): Observable<{ message: string }> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return of({ message: 'Sesión cerrada correctamente' });
    }

    const headers = accessToken
      ? new HttpHeaders({ Authorization: `Bearer ${accessToken}` })
      : undefined;

    this.clearSession();
    return this.http.post<{ message: string }>(`${API_URL}/auth/logout`, { refreshToken }, { headers }).pipe(
      catchError(() => of({ message: 'Sesión cerrada localmente' })),
    );
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getRefreshToken(): string | null {
    return this.readStorage(REFRESH_TOKEN_KEY);
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(REMEMBER_KEY);
    this.accessToken.set(null);
    this.currentUser.set(null);
  }

  private saveSession(response: AuthResponse, rememberDevice: boolean): void {
    const storage = rememberDevice ? localStorage : sessionStorage;
    this.clearSession();
    storage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    storage.setItem(USER_KEY, JSON.stringify(response.user));
    storage.setItem(REMEMBER_KEY, String(rememberDevice));
    this.accessToken.set(response.accessToken);
    this.currentUser.set(response.user);
  }

  private shouldRemember(): boolean {
    return this.readStorage(REMEMBER_KEY) !== 'false';
  }

  private readUser(): AuthUser | null {
    const raw = this.readStorage(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private readStorage(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }
}
