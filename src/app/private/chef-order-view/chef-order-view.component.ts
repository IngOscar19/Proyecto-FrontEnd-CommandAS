import { Component, TemplateRef, ViewChild, inject, OnInit } from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { DialogComponent } from '../dialog/dialog.component';
import { WebSocketsService } from '../../services/web-sockets.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { OrderDetailComponent } from '../order-detail/order-detail.component';

// ✅ Imports necesarios para el diseño
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chef-order-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule, 
    MatDialogModule,
    MatButtonModule, 
    MatIconModule    
  ],
  templateUrl: './chef-order-view.component.html',
  styleUrl: './chef-order-view.component.scss'
})
export class ChefOrderViewComponent implements OnInit {
  private _provider: ProviderService = inject(ProviderService);
  private dialog: MatDialog = inject(MatDialog);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  
  @ViewChild('chefTable') chefTable!: MatTable<any>;
  displayedColumns: string[] = ['client', 'comments', 'function'];
  
  order: any[] = [];
  orderExist: any[] = [];

  async ngOnInit() {
    this.listenSocket();
    
    // 1. Cargar órdenes existentes
    try {
      const response = await this._provider.request<any[]>('GET', 'order/viewOrders');
      this.order = Array.isArray(response) ? response : [];
    } catch (error) {
      this.order = [];
    }
    
    // 2. Verificar si hay orden en proceso (Persistencia)
    try {
      const userId = this._localStorage.getItem('user')?.idusers;
      
      if (userId) {
        this.orderExist = await this._provider.request('GET', 'order/lastOrder', { "iduser": userId });
        
        if (this.orderExist && this.orderExist.length > 0 && this.orderExist[0]?.idorder) {
          this._localStorage.setItem('lastOrder', this.orderExist[0]);
          console.log("Restaurando orden pendiente del chef:", this.orderExist[0]);
          this.dialog.open(OrderDetailComponent, { data: this.orderExist[0] });
        }
      }
    } catch (error) {
      console.log("El chef no tiene orden activa asignada actualmente.");
    }
  }

  filterByStatus() {
    if (!this.order) return [];
    // 0 = Pendiente (Para que el chef la tome)
    return this.order.filter((eachOrder: any) => eachOrder.status == 0);
  }

  openConfirmDialog(data: string) {
    this.dialog.open(DialogComponent, { data: data });
  }

  listenSocket() {
    // 🔴 CORRECCIÓN AQUÍ: Cambiado 'comanda' por 'comandas' (Plural)
    this._wsService.listen('comandas').subscribe((data) => {
      console.log("🔔 Socket Chef recibió nueva orden:", data);

      // Aseguramos que la orden tenga status 0 si viene nueva
      if (data.status === undefined || data.status === null) {
          data.status = 0; 
      }

      // Evitamos duplicados y agregamos al inicio de la lista
      const ordenesPrevias = this.order.filter((item) => item.idorder != data.idorder);
      this.order = [data, ...ordenesPrevias];
    });
  }

}