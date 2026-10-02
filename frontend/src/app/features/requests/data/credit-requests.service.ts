import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiCreditRequest,
  CreateCreditRequestPayload,
  DecisionPayload,
  UpdateCreditRequestPayload,
} from './credit-requests.models';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class CreditRequestsService {
  private readonly http = inject(HttpClient);

  list(): Observable<readonly ApiCreditRequest[]> {
    return this.http.get<readonly ApiCreditRequest[]>(`${API_URL}/credit-requests`);
  }

  findById(id: string): Observable<ApiCreditRequest> {
    return this.http.get<ApiCreditRequest>(`${API_URL}/credit-requests/${id}`);
  }

  create(payload: CreateCreditRequestPayload): Observable<ApiCreditRequest> {
    return this.http.post<ApiCreditRequest>(`${API_URL}/credit-requests`, payload);
  }

  update(id: string, payload: UpdateCreditRequestPayload): Observable<ApiCreditRequest> {
    return this.http.patch<ApiCreditRequest>(`${API_URL}/credit-requests/${id}`, payload);
  }

  updateStatus(id: string, status: 'APPROVED' | 'REJECTED', comment?: string): Observable<ApiCreditRequest> {
    return this.http.patch<ApiCreditRequest>(`${API_URL}/credit-requests/${id}/status`, {
      status,
      decisionComment: comment,
    });
  }

  approve(id: string, payload: DecisionPayload): Observable<ApiCreditRequest> {
    return this.http.post<ApiCreditRequest>(`${API_URL}/credit-requests/${id}/approve`, payload);
  }

  reject(id: string, payload: DecisionPayload): Observable<ApiCreditRequest> {
    return this.http.post<ApiCreditRequest>(`${API_URL}/credit-requests/${id}/reject`, payload);
  }
}
