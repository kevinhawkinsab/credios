import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { CreditRequest } from '../../models/credit-request';

export type RequestDrawerMode = 'create' | 'edit' | 'approve' | 'reject';

export interface RequestDrawerCompletedEvent {
  readonly mode: RequestDrawerMode;
  readonly comment: string;
}

@Component({
  selector: 'app-request-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './request-drawer.html',
  styleUrl: './request-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestDrawer implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  readonly mode = input.required<RequestDrawerMode>();
  readonly request = input<CreditRequest | undefined>();
  readonly closed = output<void>();
  readonly completed = output<RequestDrawerCompletedEvent>();

  protected readonly requestForm = this.formBuilder.nonNullable.group({
    nationalId: ['', [Validators.required, Validators.minLength(5)]],
    amount: [500, [Validators.required, Validators.min(500), Validators.max(50000)]],
    term: [6, [Validators.required, Validators.min(6), Validators.max(60)]],
  });

  protected readonly decisionForm = this.formBuilder.nonNullable.group({
    comment: [''],
  });

  protected readonly hasSubmitted = computed(() =>
    this.requestForm.touched || this.decisionForm.touched,
  );

  protected readonly isFormMode = computed(() =>
    this.mode() === 'create' || this.mode() === 'edit',
  );

  protected readonly isRejectMode = computed(() => this.mode() === 'reject');

  ngOnInit(): void {
    const request = this.request();
    if (!request || this.mode() !== 'edit') {
      return;
    }

    const amount = Number(request.amount.replace(/[$,]/g, ''));
    const term = Number.parseInt(request.term, 10);

    this.requestForm.setValue({
      nationalId: request.nationalId,
      amount,
      term,
    });
  }

  protected title(): string {
    return {
      create: 'Nueva solicitud',
      edit: 'Editar solicitud',
      approve: 'Aprobar solicitud',
      reject: 'Rechazar solicitud',
    }[this.mode()];
  }

  protected eyebrow(): string {
    return {
      create: 'NUEVA OPERACIÓN',
      edit: 'EDITAR OPERACIÓN',
      approve: 'REVISIÓN DE SOLICITUD',
      reject: 'REVISIÓN DE SOLICITUD',
    }[this.mode()];
  }

  protected async submit(): Promise<void> {
    if (this.isFormMode()) {
      this.requestForm.markAllAsTouched();
      if (this.requestForm.invalid) {
        return;
      }
    }

    if (this.isRejectMode() && !this.decisionForm.controls.comment.value.trim()) {
      this.decisionForm.markAllAsTouched();
      return;
    }

    if (this.mode() === 'approve' || this.mode() === 'reject') {
      await this.confirmDecision();
      return;
    }

    this.completed.emit({
      mode: this.mode(),
      comment: this.decisionForm.controls.comment.value.trim(),
    });
  }

  private async confirmDecision(): Promise<void> {
    const request = this.request();
    if (!request) {
      return;
    }

    const isReject = this.isRejectMode();
    const result = await Swal.fire({
      title: isReject ? '¿Rechazar esta solicitud?' : '¿Aprobar esta solicitud?',
      html: `Solicitud <strong>${request.id}</strong>`,
      iconHtml: `<span class="credi-alert-icon ${isReject ? 'credi-alert-icon--reject' : ''}">${isReject ? '!' : '?'}</span>`,
      showCancelButton: true,
      showCloseButton: true,
      allowOutsideClick: false,
      reverseButtons: false,
      focusCancel: true,
      buttonsStyling: false,
      confirmButtonText: isReject ? 'Rechazar solicitud' : 'Aprobar solicitud',
      cancelButtonText: 'Volver',
      customClass: {
        popup: 'credi-alert',
        icon: 'credi-alert__icon',
        title: 'credi-alert__title',
        htmlContainer: 'credi-alert__message',
        actions: 'credi-alert__actions',
        confirmButton: `credi-alert__confirm ${isReject ? 'credi-alert__confirm--reject' : ''}`,
        cancelButton: 'credi-alert__cancel',
        closeButton: 'credi-alert__close',
      },
    });

    if (result.isConfirmed) {
      this.completed.emit({
        mode: this.mode(),
        comment: this.decisionForm.controls.comment.value.trim(),
      });
    }
  }

  protected close(): void {
    this.closed.emit();
  }

  protected amountLabel(): string {
    return this.formatCurrency(this.requestForm.controls.amount.value);
  }

  protected termLabel(): string {
    return `${this.requestForm.controls.term.value} meses`;
  }

  protected formatCurrency(value: number): string {
    return `$${value.toLocaleString('en-US')}`;
  }

  protected showRequestError(controlName: 'nationalId' | 'amount' | 'term'): boolean {
    const control = this.requestForm.controls[controlName];
    return control.invalid && (control.touched || this.hasSubmitted());
  }

  protected showCommentError(): boolean {
    const control = this.decisionForm.controls.comment;
    return this.isRejectMode() && control.touched && !control.value.trim();
  }
}
