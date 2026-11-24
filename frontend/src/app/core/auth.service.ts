import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type UserRole = 'ADMIN' | 'USER';
export type UserAccess = 'VIEW' | 'CREATE';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  access: UserAccess | null;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  access?: UserAccess;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/auth';
  private readonly tokenKey = 'logistics_token';
  private readonly userKey = 'logistics_user';

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(
    this.readStoredUser()
  );

  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  register(payload: RegisterPayload): Observable<{ user: AuthUser }> {
    return this.http.post<{ user: AuthUser }>(
      `${this.apiUrl}/register`,
      payload
    );
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          sessionStorage.setItem(this.tokenKey, response.token);
          sessionStorage.setItem(this.userKey, JSON.stringify(response.user));
          this.userSubject.next(response.user);
        })
      );
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    this.userSubject.next(null);
  }

  private readStoredUser(): AuthUser | null {
    const storedUser = sessionStorage.getItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      sessionStorage.removeItem(this.userKey);
      return null;
    }
  }
}