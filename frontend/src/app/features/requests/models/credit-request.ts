export type RequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface CreditRequest {
  readonly id: string;
  readonly backendId?: string;
  readonly date: string;
  readonly client: string;
  readonly nationalId: string;
  readonly amount: string;
  readonly term: string;
  readonly email: string;
  readonly phone: string;
  readonly status: RequestStatus;
  readonly initials: string;
}
