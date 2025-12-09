import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ProviderService } from '../../../services/provider.service';
import { LocalstorageService } from '../../../services/localstorage.service';
import { MatDialog } from '@angular/material/dialog';
import { OrderDetailComponent } from '../../../private/order-detail/order-detail.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatDividerModule,      
    MatButtonModule,       
    HttpClientModule, 
    FormsModule, 
    ReactiveFormsModule,
    RouterLink             
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  private _form_builder: FormBuilder = inject(FormBuilder);
  private _http: HttpClient = inject(HttpClient);
  private _router: Router = inject(Router);
  private _provider: ProviderService = inject(ProviderService);
  private _localstorage: LocalstorageService = inject(LocalstorageService);
  private dialog: MatDialog = inject(MatDialog);
  private _snackBar: MatSnackBar = inject(MatSnackBar);
  
  req: any;

  form_signin: FormGroup = this._form_builder.group({
    name: [null, Validators.required],
    password: [null, Validators.required]
  })

  async signin() {
    if (this.form_signin.valid) {
      try {
        // Realizamos la petición
        this.req = await this._provider.request('POST', 'auth/signin', this.form_signin.value);
        console.log('Respuesta Login:', this.req);
        
        // Guardamos el usuario en LocalStorage
        this._localstorage.setItem('user', this.req);
        
        // Convertimos el rol a número para asegurar que el switch funcione bien
        const rol = Number(this.req.rol);
        
        switch (rol) {
          case 0: // ADMINISTRADOR
            // Lo mandamos a la vista de usuarios (CRUD) o al menú privado
            this._router.navigate(['private/user-view']); 
            break;

          case 1: // CAJERO
            this._router.navigate(['private/orders-view']);
            break;

          case 2: // COCINERO
            this._router.navigate(['private/chef-order-view']);
            this.actualOrder(); // Verificar si tiene orden activa
            break;

          case 3: // CLIENTE (Nuevo rol)
            // Lo mandamos a la ruta pública del cliente (con Sidebar)
            this._router.navigate(['client/menu']); 
            break;
            
          default:
            this._snackBar.open('Rol no reconocido (' + rol + ')', 'Cerrar', { duration: 3000 });
            break;  
        }

      } catch (error) {
        console.error(error);
        // El ProviderService ya suele mostrar un snackbar con el error, 
        // pero aquí atrapamos cualquier excepción extra.
      }
    } else {
      this.form_signin.markAllAsTouched();
    }
  }
  
  async actualOrder() {
    // Verificamos si el usuario (normalmente el cocinero o cliente) tiene una orden en proceso
    const orderExist = this._localstorage.getItem('user')?.actual_order;
    console.log('Orden activa:', orderExist);
    
    if (orderExist) {
      this.dialog.open(OrderDetailComponent, { data: { idorder: orderExist } });
    }
  }
}