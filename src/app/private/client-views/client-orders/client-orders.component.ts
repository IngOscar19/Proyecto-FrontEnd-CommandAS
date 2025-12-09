import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { OrderService } from '../../../services/order.service';
import { LocalstorageService } from '../../../services/localstorage.service';
import { RouterLink } from '@angular/router'; 

// Módulos Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-client-orders',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDividerModule
  ],
  templateUrl: './client-orders.component.html',
  styleUrl: './client-orders.component.scss'
})
export class ClientOrdersComponent implements OnInit {

  private orderService = inject(OrderService);
  private localStorage = inject(LocalstorageService);

  // 'allOrders' almacena todo lo que viene del backend
  allOrders: any[] = [];
  
  // 'orders' es lo que mostramos en pantalla (filtrado)
  orders: any[] = [];
  
  currentUser: any = null;
  currentFilter: 'all' | 'active' | 'history' = 'all';

  ngOnInit() {
    this.currentUser = this.localStorage.getItem('user');

    if (this.currentUser && this.currentUser.idusers) {
      // Iniciar escucha en tiempo real
      this.orderService.getOrdersRealTime(this.currentUser.idusers);
      
      // Suscribirse a los datos
      this.orderService.orders$.subscribe((data) => {
        // Ordenar por fecha: Más reciente primero
        this.allOrders = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Re-aplicar el filtro actual para que la vista se actualice
        this.applyFilter(this.currentFilter);
      });
    }
  }

  // --- Lógica de Filtrado ---
  applyFilter(filter: 'all' | 'active' | 'history') {
    this.currentFilter = filter;

    switch (filter) {
        case 'active':
            // Muestra: Pendiente (0), Preparando (1), Lista (2)
            this.orders = this.allOrders.filter(o => [0, 1, 2].includes(Number(o.status)));
            break;
        case 'history':
            // Muestra: Entregada (3), Cancelada (4)
            this.orders = this.allOrders.filter(o => [3, 4].includes(Number(o.status)));
            break;
        case 'all':
        default:
            this.orders = [...this.allOrders];
            break;
    }
  }

  // Cuenta cuántas órdenes están "vivas" para mostrar en el badge
  get countActive(): number {
    return this.allOrders.filter(o => [0, 1, 2].includes(Number(o.status))).length;
  }

  // Texto para el chip de estado
  getStatusText(status: any): string {
    const s = Number(status);
    switch (s) {
      case 0: return 'Pendiente';
      case 1: return 'En Preparación';
      case 2: return 'Lista para Recoger';
      case 3: return 'Entregada';
      case 4: return 'Cancelada';
      default: return 'Desconocido';
    }
  }
}