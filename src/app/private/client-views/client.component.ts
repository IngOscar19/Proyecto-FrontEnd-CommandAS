import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LocalstorageService } from '../../services/localstorage.service';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent {
  
  private router = inject(Router);
  private localStorage = inject(LocalstorageService);
  
  currentUser: any = this.localStorage.getItem('user');
  
  // Controla si el sidebar está visible
  isSidebarOpen: boolean = true; 
  
  // Detectar si es móvil para ajustar el comportamiento inicial
  isMobile: boolean = false;

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768; // 768px es el punto de quiebre estándar para tablets/móviles
    
    // Si es móvil, por defecto cerramos. Si es escritorio, abrimos.
    if (this.isMobile) {
      this.isSidebarOpen = false;
    } else {
      this.isSidebarOpen = true;
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.localStorage.removeItem('user');
    this.localStorage.removeItem('token');
    this.router.navigate(['/auth/sign-in']);
  }
}