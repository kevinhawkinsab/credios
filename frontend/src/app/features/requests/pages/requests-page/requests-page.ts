import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

type RequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada';
type RequestFilter = 'Todos' | RequestStatus;

interface CreditRequest {
  readonly id: string;
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

const INITIAL_REQUESTS: readonly CreditRequest[] = [
  {
    id: 'CR-2024-0248',
    date: '30 sept 2026',
    client: 'María González',
    nationalId: '8-123-456',
    amount: '$12,500',
    term: '24 meses',
    email: 'maria.gonzalez@email.com',
    phone: '+507 6789-1122',
    status: 'Pendiente',
    initials: 'MG',
  },
  {
    id: 'CR-2024-0247',
    date: '30 sept 2026',
    client: 'Carlos Mendoza',
    nationalId: '4-802-119',
    amount: '$8,000',
    term: '18 meses',
    email: 'carlos.mendoza@email.com',
    phone: '+507 6123-4401',
    status: 'Aprobada',
    initials: 'CM',
  },
  {
    id: 'CR-2024-0246',
    date: '29 sept 2026',
    client: 'Ana Rodríguez',
    nationalId: '8-901-773',
    amount: '$25,000',
    term: '48 meses',
    email: 'ana.rodriguez@email.com',
    phone: '+507 6991-0312',
    status: 'Rechazada',
    initials: 'AR',
  },
  {
    id: 'CR-2024-0245',
    date: '29 sept 2026',
    client: 'Luis Herrera',
    nationalId: '3-721-044',
    amount: '$5,500',
    term: '12 meses',
    email: 'luis.herrera@email.com',
    phone: '+507 6330-2840',
    status: 'Aprobada',
    initials: 'LH',
  },
  {
    id: 'CR-2024-0244',
    date: '29 sept 2026',
    client: 'Sofía Castillo',
    nationalId: '8-445-891',
    amount: '$18,500',
    term: '36 meses',
    email: 'sofia.castillo@email.com',
    phone: '+507 6777-2109',
    status: 'Pendiente',
    initials: 'SC',
  },
  {
    id: 'CR-2024-0243',
    date: '28 sept 2026',
    client: 'Jorge Batista',
    nationalId: '2-119-634',
    amount: '$4,200',
    term: '9 meses',
    email: 'jorge.batista@email.com',
    phone: '+507 6443-0891',
    status: 'Aprobada',
    initials: 'JB',
  },
  {
    id: 'CR-2024-0242',
    date: '28 sept 2026',
    client: 'Valentina Ríos',
    nationalId: '8-774-220',
    amount: '$32,000',
    term: '60 meses',
    email: 'valentina.rios@email.com',
    phone: '+507 6558-9921',
    status: 'Pendiente',
    initials: 'VR',
  },
  {
    id: 'CR-2024-0241',
    date: '27 sept 2026',
    client: 'Diego Navarro',
    nationalId: '6-320-557',
    amount: '$9,800',
    term: '24 meses',
    email: 'diego.navarro@email.com',
    phone: '+507 6221-1190',
    status: 'Rechazada',
    initials: 'DN',
  },
];

@Component({
  selector: 'app-requests-page',
  imports: [RouterLink],
  templateUrl: './requests-page.html',
  styleUrl: './requests-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsPage {
  protected readonly sidebarOpen = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly selectedFilter = signal<RequestFilter>('Todos');
  protected readonly selectedRequestId = signal(INITIAL_REQUESTS[0].id);
  protected readonly requests = signal<readonly CreditRequest[]>(INITIAL_REQUESTS);

  protected readonly filteredRequests = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const filter = this.selectedFilter();

    return this.requests().filter((request) => {
      const matchesSearch =
        !search ||
        request.id.toLowerCase().includes(search) ||
        request.nationalId.toLowerCase().includes(search) ||
        request.client.toLowerCase().includes(search);
      const matchesFilter = filter === 'Todos' || request.status === filter;

      return matchesSearch && matchesFilter;
    });
  });

  protected readonly selectedRequest = computed(() => {
    return (
      this.requests().find((request) => request.id === this.selectedRequestId()) ??
      this.requests()[0]
    );
  });

  protected toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected updateFilter(event: Event): void {
    this.selectedFilter.set((event.target as HTMLSelectElement).value as RequestFilter);
  }

  protected selectRequest(request: CreditRequest): void {
    this.selectedRequestId.set(request.id);
  }

  protected decide(status: Exclude<RequestStatus, 'Pendiente'>): void {
    const selectedId = this.selectedRequestId();
    this.requests.update((requests) =>
      requests.map((request) =>
        request.id === selectedId ? { ...request, status } : request,
      ),
    );
  }

  protected statusClass(status: RequestStatus): string {
    return `status-pill status-pill--${status.toLowerCase()}`;
  }
}
