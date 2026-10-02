export type ApiRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DashboardRecentRequest {
  readonly id: string;
  readonly requestNumber: string;
  readonly applicant: {
    readonly fullName: string;
    readonly nationalId: string | null;
  };
  readonly amount: number;
  readonly termMonths: number;
  readonly status: ApiRequestStatus;
  readonly createdAt: string;
}

export interface DashboardSummary {
  readonly metrics: {
    readonly received: number;
    readonly pending: number;
    readonly approved: number;
    readonly rejected: number;
    readonly approvalRate: number;
    readonly approvedAmount: number;
  };
  readonly recentRequests: readonly DashboardRecentRequest[];
}
