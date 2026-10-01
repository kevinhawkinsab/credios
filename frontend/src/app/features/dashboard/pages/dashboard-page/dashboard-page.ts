import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
export class DashboardPage {
  protected readonly sidebarOpen = signal(false);
  protected readonly selectedPeriod = signal('Septiembre');

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

  protected toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected statusClass(status: RequestStatus): string {
    return `status-badge status-badge--${status.toLowerCase()}`;
  }
}
