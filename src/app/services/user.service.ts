// user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalstorageService } from './localstorage.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private http = inject(HttpClient);
  private localstorage = inject(LocalstorageService);
  private apiUrl = 'http://localhost:8000/';

  private getHeaders(): HttpHeaders {
    const user = this.localstorage.getItem('user');
    const token = this.localstorage.getItem('token') || user?.token || '';
    return new HttpHeaders()
      .set('authorization', token)
      .set('Content-Type', 'application/json');
  }

  getProfile(idusers: string): Observable<any> {
    const params = new HttpParams().set('idusers', idusers);
    return this.http.get<any>(`${this.apiUrl}user/getProfile`, {
      headers: this.getHeaders(),
      params,
    });
  }

  updateProfile(userData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}user/updateProfile`, userData, {
      headers: this.getHeaders(),
    });
  }
}
