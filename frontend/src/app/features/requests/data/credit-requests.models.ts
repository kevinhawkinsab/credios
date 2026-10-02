export type ApiCreditRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApiCreditRequest {
  readonly id: string;
  readonly requestNumber: string;
  readonly applicant: {
    readonly id: string;
    readonly fullName: string;
    readonly nationalId: string | null;
    readonly email: string;
  };
  readonly createdBy: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
  };
  readonly amount: number;
  readonly termMonths: number;
  readonly status: ApiCreditRequestStatus;
  readonly decisionComment: string | null;
  readonly reviewedBy: {
    readonly id: string;
    readonly fullName: string;
    readonly email: string;
  } | null;
  readonly reviewedAt: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateCreditRequestPayload {
  readonly amount: number;
  readonly termMonths: number;
  readonly applicantId?: string;
}

export interface UpdateCreditRequestPayload {
  readonly amount?: number;
  readonly termMonths?: number;
}

export interface DecisionPayload {
  readonly comment?: string;
}
