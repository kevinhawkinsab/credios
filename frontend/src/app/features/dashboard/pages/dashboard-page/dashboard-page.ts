import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { DashboardService } from '../../data/dashboard.service';
import { DashboardSummary } from '../../data/dashboard.models';

type RequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada';

interface RecentRequest {
  readonly initials: string;
  readonly name: string;
  readonly reference: string;
  readonly amount: string;
  readonly status: RequestStatus;
}

interface Metric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: 'arrow' | 'clock' | 'check' | 'money';
  readonly tone: 'orange' | 'gold' | 'green' | 'navy';
}

interface ChartBar {
  readonly month: string;
  readonly height: number;
  readonly active?: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);
  protected readonly sidebarOpen = signal(false);
  protected readonly selectedPeriod = signal('Septiembre');
  protected readonly liveMetrics = signal<readonly Metric[]>([]);
  protected readonly liveRecentRequests = signal<readonly RecentRequest[]>([]);
  protected readonly approvalRate = signal(0);
  protected readonly receivedTotal = signal(0);
  protected readonly approvedTotal = signal(0);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');

  protected readonly metrics: readonly Metric[] = [
    {
      label: 'Solicitudes recibidas',
      value: '248',
      detail: '12 nuevas esta semana',
      icon: 'arrow',
      tone: 'orange',
    },
    {
      label: 'Pendientes de revisión',
      value: '36',
      detail: '8 vencen hoy',
      icon: 'clock',
      tone: 'gold',
    },
    {
      label: 'Tasa de aprobación',
      value: '74.2%',
      detail: '+5.8% vs. mes anterior',
      icon: 'check',
      tone: 'green',
    },
    {
      label: 'Monto aprobado',
      value: '$842,500',
      detail: 'En el periodo actual',
      icon: 'money',
      tone: 'navy',
    },
  ];

  protected readonly recentRequests: readonly RecentRequest[] = [
    {
      initials: 'MG',
      name: 'María González',
      reference: 'CR-2024-0248 · 8-123-456',
      amount: '$12,500',
      status: 'Pendiente',
    },
    {
      initials: 'CM',
      name: 'Carlos Mendoza',
      reference: 'CR-2024-0247 · 4-802-119',
      amount: '$8,000',
      status: 'Aprobada',
    },
    {
      initials: 'AR',
      name: 'Ana Rodríguez',
      reference: 'CR-2024-0246 · 8-901-773',
      amount: '$25,000',
      status: 'Rechazada',
    },
    {
      initials: 'LH',
      name: 'Luis Herrera',
      reference: 'CR-2024-0245 · 3-721-044',
      amount: '$5,500',
      status: 'Aprobada',
    },
  ];

  protected readonly chartBars: readonly ChartBar[] = [
    { month: '1', height: 40 },
    { month: '2', height: 56 },
    { month: '3', height: 49 },
    { month: '4', height: 74 },
    { month: '5', height: 63 },
    { month: '6', height: 91 },
    { month: '7', height: 79 },
    { month: '8', height: 94, active: true },
  ];

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (summary) => this.applySummary(summary),
      error: (error: HttpErrorResponse) => {
        this.loadError.set(this.dashboardErrorMessage(error));
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false),
    });
  }

  private dashboardErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }
    if (error.status === 401) {
      return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para consultar el resumen.';
    }
    return 'No pudimos cargar el resumen. Inténtalo nuevamente.';
  }

  private applySummary(summary: DashboardSummary): void {
    const metrics = summary.metrics;
    this.approvalRate.set(metrics.approvalRate);
    this.receivedTotal.set(metrics.received);
    this.approvedTotal.set(metrics.approved);
    this.liveMetrics.set([
      { label: 'Solicitudes recibidas', value: String(metrics.received), detail: 'Total registrado', icon: 'arrow', tone: 'orange' },
      { label: 'Pendientes de revisión', value: String(metrics.pending), detail: 'Requieren atención', icon: 'clock', tone: 'gold' },
      { label: 'Tasa de aprobación', value: `${metrics.approvalRate}%`, detail: `${metrics.approved} aprobadas`, icon: 'check', tone: 'green' },
      { label: 'Monto aprobado', value: this.formatCurrency(metrics.approvedAmount), detail: 'Total aprobado', icon: 'money', tone: 'navy' },
    ]);
    this.liveRecentRequests.set(summary.recentRequests.map((request) => ({
      initials: this.initials(request.applicant.fullName),
      name: request.applicant.fullName,
      reference: `${request.requestNumber} · ${request.applicant.nationalId ?? 'Sin cédula'}`,
      amount: this.formatCurrency(request.amount),
      status: this.statusLabel(request.status),
    })));
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  private statusLabel(status: 'PENDING' | 'APPROVED' | 'REJECTED'): RequestStatus {
    const labels: Record<'PENDING' | 'APPROVED' | 'REJECTED', RequestStatus> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
    };
    return labels[status];
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  protected logout(): void {
    this.authService.logout().subscribe();
    void this.router.navigate(['/login']);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected statusClass(status: RequestStatus): string {
    return `status-badge status-badge--${status.toLowerCase()}`;
  }
}
