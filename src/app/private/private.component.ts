import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button'; // Importante
import { MatTooltipModule } from '@angular/material/tooltip'; // Importante
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LocalstorageService } from '../services/localstorage.service';
import { CommonModule } from '@angular/common'; // Para pipes o directivas comunes

@Component({
  selector: 'app-private',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule, 
    MatIconModule, 
    MatFormFieldModule,
    MatButtonModule,
    MatTooltipModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive // Importante para el estilo de menú activo
  ],
  templateUrl: './private.component.html',
  styleUrl: './private.component.scss'
})
export class PrivateComponent implements OnInit {
  private _localstorage: LocalstorageService = inject(LocalstorageService);
  private _router: Router = inject(Router);
  
  user: string = '';
  rol: number = 0;

  ngOnInit(){
    // Verificación de seguridad básica por si el objeto user no existe
    const userData = this._localstorage.getItem('user');
    if (userData) {
        this.user = userData.name || 'Usuario';
        this.rol = userData.rol !== undefined ? Number(userData.rol) : 1; 
    }
    
    console.log('Rol detectado:', this.rol);
  }

  logOut(){
    this._localstorage.clear();
    this._router.navigate(['/auth/sign-in']);
  }
}