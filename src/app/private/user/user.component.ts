import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProviderService } from '../../services/provider.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { WebSocketsService } from '../../services/web-sockets.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; 
import { MatTooltipModule } from '@angular/material/tooltip'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,    
    RouterLink,       
    MatTooltipModule,
    MatProgressSpinnerModule 
  ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
})
export class UserComponent implements OnInit {

  private _formbuilder: FormBuilder = inject(FormBuilder);
  private _provider: ProviderService = inject(ProviderService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _router: Router = inject(Router);
  private _activedRouter: ActivatedRoute = inject(ActivatedRoute);

  id: string | null = null;
  isLoading: boolean = false;
  hidePassword = true;

  roles = [
    { name: 'Administrador', value: '0' }, 
    { name: 'Cajero', value: '1' },        
    { name: 'Cocinero', value: '2' }      
  ];

  formulario: FormGroup = this._formbuilder.group({
    idusers: [null],
    name: [null, [Validators.required]],
    password: [null], 
    phone: [null, [Validators.pattern('^[0-9]{10}$')]],
    rol: [null, Validators.required],
  });

  async ngOnInit() {
    this._activedRouter.params.subscribe(async (params) => {
      this.id = params['id'];

      if (this.id) {
        this.formulario.get('password')?.clearValidators();
        this.formulario.get('password')?.updateValueAndValidity();
        await this.loadUserData(this.id);
      } else {
        this.formulario.get('password')?.setValidators([Validators.required]);
        this.formulario.get('password')?.updateValueAndValidity();
      }
    });
  }

  async loadUserData(id: string) {
    const cleanId = id.trim();
    try {
      this.isLoading = true;
      const response: any = await this._provider.request('GET', 'user/getProfile', { idusers: cleanId });
      
      if (response) {
        const rolString = response.rol !== null && response.rol !== undefined ? String(response.rol) : '';
        this.formulario.patchValue({
          idusers: response.idusers,
          name: response.name,
          phone: response.phone,
          rol: rolString 
        });
      }
    } catch (error) {
      console.error(error);
      this._snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  async save() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.formulario.value;

    try {
      let data: any;
      let actionType = '';

      if (this.id) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        data = await this._provider.request('PUT', 'user/adminUpdateUser', updateData);
        actionType = 'Actualizado';
      } else {
        data = await this._provider.request('POST', 'auth/createUser', formData);
        actionType = 'Creado';
      }

      if (data && !data.error) {
        if (this._wsService.socketStatus) {
          this._wsService.request('usuarios', { action: actionType, ...data });
        }
        this._snackBar.open(`Usuario ${actionType} correctamente`, 'Listo', { 
          duration: 3000, 
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this._router.navigate(['/private/user-view']);
      } else {
        const msg = data?.msg || 'Error al guardar';
        this._snackBar.open(msg, 'Cerrar', { duration: 3000, verticalPosition: 'top' });
      }

    } catch (error) {
      console.error(error);
      this._snackBar.open('Error de conexión', 'Cerrar', { duration: 3000, verticalPosition: 'top' });
    } finally {
      this.isLoading = false;
    }
  }

  async deleteUser() {
    if (!this.id) return;
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      this.isLoading = true;
      const data: any = await this._provider.request('DELETE', 'user/deleteUser', { idusers: this.id });

      if (data && !data.error) {
        if (this._wsService.socketStatus) {
          this._wsService.request('usuarios', { action: 'Eliminado', id: this.id });
        }
        this._snackBar.open('Usuario Eliminado', 'Cerrar', { duration: 3000, verticalPosition: 'top' });
        this._router.navigate(['/private/user-view']);
      } else {
        const msg = data?.msg || 'Error al eliminar';
        this._snackBar.open(msg, 'Cerrar', { duration: 3000, verticalPosition: 'top' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}