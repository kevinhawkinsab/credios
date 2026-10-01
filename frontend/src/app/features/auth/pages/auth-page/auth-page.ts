import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

type AuthMode = 'login' | 'register';

function matchingPasswordsValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>(
    (this.activatedRoute.parent?.snapshot.data['mode'] ??
      this.activatedRoute.snapshot.data['mode']) as AuthMode,
  );
  protected readonly isLogin = computed(() => this.mode() === 'login');
  protected readonly hasSubmitted = signal(false);
  protected readonly statusMessage = signal('');

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberDevice: [true],
  });

  protected readonly registerForm = this.formBuilder.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      nationalId: ['', [Validators.required, Validators.minLength(5)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
    },
    { validators: matchingPasswordsValidator },
  );

  protected submit(): void {
    this.hasSubmitted.set(true);
    this.statusMessage.set('');

    const form = this.isLogin() ? this.loginForm : this.registerForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.statusMessage.set(
      this.isLogin()
        ? 'Tu formulario está listo para iniciar sesión.'
        : 'Tu cuenta está lista para ser creada.',
    );
  }

  protected showError(control: AbstractControl): boolean {
    return control.invalid && (control.touched || this.hasSubmitted());
  }

  protected navigateTo(mode: AuthMode): void {
    void this.router.navigate([mode]);
  }
}
