import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdateUserStatusPayload, UserRecord } from './user.models';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  list(): Observable<readonly UserRecord[]> {
    return this.http.get<readonly UserRecord[]>(`${API_URL}/users`);
  }

  findById(id: string): Observable<UserRecord> {
    return this.http.get<UserRecord>(`${API_URL}/users/${id}`);
  }

  updateStatus(id: string, payload: UpdateUserStatusPayload): Observable<UserRecord> {
    return this.http.patch<UserRecord>(`${API_URL}/users/${id}/status`, payload);
  }
}
