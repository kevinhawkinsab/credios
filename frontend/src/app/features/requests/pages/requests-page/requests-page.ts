import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { UsersService } from '../../../users/data/users.service';
import { RequestDrawer, RequestDrawerCompletedEvent } from '../../components/request-drawer/request-drawer';
import { CreditRequest, RequestStatus } from '../../models/credit-request';
import { CreditRequestsService } from '../../data/credit-requests.service';
import { ApiCreditRequest } from '../../data/credit-requests.models';
import { switchMap, throwError } from 'rxjs';
import Swal from 'sweetalert2';

type RequestFilter = 'Todos' | RequestStatus;

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
  imports: [RequestDrawer, RouterLink],
  templateUrl: './requests-page.html',
  styleUrl: './requests-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly creditRequestsService = inject(CreditRequestsService);
  private readonly usersService = inject(UsersService);
  protected readonly sidebarOpen = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly selectedFilter = signal<RequestFilter>('Todos');
  protected readonly selectedRequestId = signal('');
  protected readonly requests = signal<readonly CreditRequest[]>([]);
  protected readonly drawerMode = signal<RequestDrawerMode | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly loadError = signal('');

  ngOnInit(): void {
    this.loadRequests();
  }

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

  protected openDrawer(mode: RequestDrawerMode): void {
    this.drawerMode.set(mode);
  }

  protected closeDrawer(): void {
    this.drawerMode.set(null);
  }

  protected completeDrawer(event: RequestDrawerCompletedEvent): void {
    const request = this.selectedRequest();
    const requestId = request?.backendId;
    let operation$;

    if (event.mode === 'create') {
      const create$ = this.authService.user()?.role === 'ADMIN'
        ? this.usersService.list().pipe(
            switchMap((users) => {
              const applicant = users.find((user) => user.nationalId === event.nationalId);
              if (!applicant) {
                return throwError(() => new Error('No encontramos un usuario con esa cédula.'));
              }
              return this.creditRequestsService.create({
                applicantId: applicant.id,
                amount: event.amount ?? 0,
                termMonths: event.termMonths ?? 0,
              });
            }),
          )
        : this.creditRequestsService.create({
            amount: event.amount ?? 0,
            termMonths: event.termMonths ?? 0,
          });
      operation$ = create$;
    } else if (!requestId) {
      this.loadError.set('No se pudo identificar la solicitud seleccionada.');
      return;
    } else if (event.mode === 'edit') {
      operation$ = this.creditRequestsService.update(requestId, {
        amount: event.amount,
        termMonths: event.termMonths,
      });
    } else if (event.mode === 'approve') {
      operation$ = this.creditRequestsService.approve(requestId, { comment: event.comment });
    } else {
      operation$ = this.creditRequestsService.reject(requestId, { comment: event.comment });
    }

    this.isSubmitting.set(true);
    operation$.subscribe({
      next: () => {
        this.closeDrawer();
        this.loadRequests();
        void Swal.fire({
          title: this.successTitle(event.mode),
          text: event.mode === 'reject'
            ? 'La solicitud fue rechazada correctamente.'
            : 'La operación se completó correctamente.',
          icon: 'success',
          confirmButtonText: 'Continuar',
          buttonsStyling: false,
          customClass: this.alertClasses(),
        });
      },
      error: (error: HttpErrorResponse | Error) => {
        const message = this.apiErrorMessage(error);
        this.loadError.set(message);
        this.isSubmitting.set(false);
        void Swal.fire({
          title: 'No se pudo completar la operación',
          text: message,
          icon: 'error',
          confirmButtonText: 'Entendido',
          buttonsStyling: false,
          customClass: this.alertClasses(),
        });
      },
      complete: () => this.isSubmitting.set(false),
    });
  }

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

  private loadRequests(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.creditRequestsService.list().subscribe({
      next: (requests) => {
        const mapped = requests.map((request) => this.toViewModel(request));
        this.requests.set(mapped);
        if (!mapped.some((request) => request.id === this.selectedRequestId())) {
          this.selectedRequestId.set(mapped[0]?.id ?? '');
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loadError.set(this.apiErrorMessage(error));
        this.isLoading.set(false);
      },
      complete: () => {
        this.isLoading.set(false);
        this.isSubmitting.set(false);
      },
    });
  }

  private toViewModel(request: ApiCreditRequest): CreditRequest {
    return {
      id: request.requestNumber,
      backendId: request.id,
      date: new Date(request.createdAt).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: request.applicant.fullName,
      nationalId: request.applicant.nationalId ?? '',
      amount: this.formatCurrency(request.amount),
      term: `${request.termMonths} meses`,
      email: request.applicant.email,
      phone: '—',
      status: this.statusLabel(request.status),
      initials: this.initials(request.applicant.fullName),
    };
  }

  private statusLabel(status: 'PENDING' | 'APPROVED' | 'REJECTED'): RequestStatus {
    return { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' }[status] as RequestStatus;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }

  private initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  private apiErrorMessage(error: HttpErrorResponse | Error): string {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) {
      return error.message.startsWith('No encontramos')
        ? error.message
        : 'No pudimos completar la operación. Inténtalo nuevamente.';
    }

    const httpError = error as HttpErrorResponse;
    if (httpError.status === 0) {
      return 'No pudimos conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }
    if (httpError.status === 401) {
      return 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
    }
    if (httpError.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (httpError.status === 404) {
      return 'No encontramos la solicitud. Actualiza la página e inténtalo nuevamente.';
    }
    if (httpError.status === 409) {
      return 'Esta operación entra en conflicto con información existente.';
    }
    if (httpError.status === 400) {
      return 'Revisa la información ingresada y corrige los campos indicados.';
    }

    return 'No pudimos completar la operación. Inténtalo nuevamente.';
  }

  private successTitle(mode: RequestDrawerMode): string {
    return {
      create: 'Solicitud creada',
      edit: 'Solicitud actualizada',
      approve: 'Solicitud aprobada',
      reject: 'Solicitud rechazada',
    }[mode];
  }

  private alertClasses() {
    return {
      popup: 'credi-alert',
      icon: 'credi-alert__icon',
      title: 'credi-alert__title',
      htmlContainer: 'credi-alert__message',
      actions: 'credi-alert__actions',
      confirmButton: 'credi-alert__confirm',
    };
  }

  protected logout(): void {
    this.authService.logout().subscribe();
    void this.router.navigate(['/login']);
  }
}

type RequestDrawerMode = 'create' | 'edit' | 'approve' | 'reject';
