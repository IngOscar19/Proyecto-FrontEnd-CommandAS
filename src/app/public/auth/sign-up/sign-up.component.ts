import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common'; // Agregado para @if y clases condicionales
import { ProviderService } from '../../../services/provider.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  private fb = inject(FormBuilder);
  private provider = inject(ProviderService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  signUpForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword) return null;
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async onSignUp() {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formData = {
        name: this.signUpForm.value.name,
        phone: this.signUpForm.value.phone,
        password: this.signUpForm.value.password
      };

      console.log('📤 Enviando datos de registro:', formData);
      const response = await this.provider.request<any>('POST', 'auth/signup', formData);
      console.log('✅ Respuesta:', response);

      this.snackBar.open('¡Bienvenido! Cuenta creada exitosamente.', 'Ir al Login', {
        duration: 4000,
        verticalPosition: 'top',
        panelClass: ['snackbar-success'] // Asegúrate de tener este estilo global o usa el default
      });

      setTimeout(() => {
        this.router.navigate(['/auth/sign-in']);
      }, 2000);

    } catch (error) {
      console.error('❌ Error en registro:', error);
      this.snackBar.open('Error al crear la cuenta. Intenta nuevamente.', 'Cerrar', {
        duration: 4000,
        verticalPosition: 'top'
      });
    } finally {
      this.isLoading = false;
    }
  }
}