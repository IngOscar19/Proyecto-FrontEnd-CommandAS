import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../services/user.service';
import { LocalstorageService } from '../../../services/localstorage.service';
import Swal from 'sweetalert2';
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirm_password');
  if (!password || !confirmPassword || !password.value) return null;
  return password.value === confirmPassword.value ? null : { mismatch: true };
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private localStorage = inject(LocalstorageService);

  profileForm: FormGroup;
  isLoading = false;
  userId: string = '';
  hidePassword = true;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]],
      password: ['', [Validators.minLength(6)]],
      confirm_password: ['']
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    const user = this.localStorage.getItem('user');
    if (user && user.idusers) {
      this.userId = user.idusers;
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.isLoading = true;
    this.userService.getProfile(this.userId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (!res.error && res.msg) {
          const data = res.msg || res; 
          
          this.profileForm.patchValue({
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: '', confirm_password: ''
          });
        }
      },
      error: (err) => { this.isLoading = false; }
    });
  }

  onSubmit() {
    if (this.profileForm.invalid) return;
    
    this.isLoading = true;

    // 1. Mostrar Loader mientras se procesa
    Swal.fire({
      title: 'Guardando cambios...',
      text: 'Por favor espere un momento',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const formValues = { ...this.profileForm.value };
    
    // Limpieza de datos: Solo enviar password si se escribió algo
    if (!formValues.password) delete formValues.password;
    delete formValues.confirm_password;

    const formData = { idusers: this.userId, ...formValues };

    this.userService.updateProfile(formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        Swal.close(); // Cerramos el loader

        if (!res.error) {
          
          // 2. ALERTA DE ÉXITO
          Swal.fire({
            title: '¡Perfil Actualizado!',
            text: 'Tu información se ha guardado correctamente.',
            icon: 'success',
            confirmButtonColor: '#0D47A1', // Azul Corporativo
            confirmButtonText: 'Aceptar',
            timer: 3000,
            timerProgressBar: true
          });
          
          // Actualizar localStorage para reflejar cambios en el Header al instante
          const currentUser = this.localStorage.getItem('user');
          if (currentUser) {
            currentUser.name = formData.name;
            currentUser.email = formData.email;
            this.localStorage.setItem('user', currentUser);
          }
          
          // Limpiar campos de contraseña
          this.profileForm.patchValue({ password: '', confirm_password: '' });

        } else {
          // 3. ALERTA DE ERROR DEL BACKEND
          Swal.fire({
            title: 'No se pudo actualizar',
            text: res.msg || 'Ocurrió un error desconocido',
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        Swal.close();
        
        // 4. ALERTA DE ERROR DE CONEXIÓN
        Swal.fire({
          title: 'Error de conexión',
          text: 'No pudimos conectar con el servidor. Intenta más tarde.',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}