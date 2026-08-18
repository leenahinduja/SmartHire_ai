import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'APPLICANT' | 'RECRUITER';
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private API = '';
  private userSubject = new BehaviorSubject<User | null>(this.loadUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ✅ Load user from localStorage
  private loadUser(): User | null {
    const u = localStorage.getItem('smarthire_user');
    return u ? JSON.parse(u) : null;
  }

  get currentUser(): User | null { return this.userSubject.value; }
  get isLoggedIn(): boolean { return !!this.currentUser; }
  get isRecruiter(): boolean { return this.currentUser?.role === 'RECRUITER'; }
  get isApplicant(): boolean { return this.currentUser?.role === 'APPLICANT'; }

  // ✅ REGISTER
  register(data: { name: string; email: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.API}/auth/register`, data);
  }

  // 🔥 LOGIN (FIXED WITH ROLE NORMALIZATION)
login(email: string, password: string): Observable<any> {
  const body = new URLSearchParams();
  body.set('email', email);
  body.set('password', password);

  return this.http.post<any>(
    `${this.API}/auth/login`,
    body.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true // 🔥 VERY IMPORTANT
    }
  ).pipe(
    tap((res: any) => {

      const normalizedRole = res.role?.replace('ROLE_', '');

      const user: User = {
        id: res.id || 1,
        name: res.name || res.email,
        email: res.email,
        role: normalizedRole as 'APPLICANT' | 'RECRUITER'
      };

      localStorage.setItem('smarthire_user', JSON.stringify(user));
      this.userSubject.next(user);
    })
  );
}
  // ✅ LOGOUT
  logout(): void {
    localStorage.removeItem('smarthire_user');
    localStorage.removeItem('token');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ✅ FORGOT PASSWORD
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API}/auth/forget-password`, { email });
  }

  validateToken(token: string) {
    return this.http.post(`${this.API}/auth/valid-token`, { token });
  }

  resetPassword(data: { token: string; password: string }) {
    return this.http.post(`${this.API}/auth/update-password`, data);
  }

  // ✅ GET TOKEN (optional if JWT later)
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}