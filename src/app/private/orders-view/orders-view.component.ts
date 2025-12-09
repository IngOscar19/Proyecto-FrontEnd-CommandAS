import { Component, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common'; 
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { DialogComponent } from '../dialog/dialog.component';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { DialogCompleteComponent } from '../dialog-complete/dialog-complete.component';
import { DialogCancelComponent } from '../dialog-cancel/dialog-cancel.component';

// Servicios
import { OrderService } from '../../services/order.service';
import { LocalstorageService } from '../../services/localstorage.service';

@Component({
  selector: 'app-orders-view',
  standalone: true,
  imports: [
    MatTabsModule, 
    MatDialogModule, 
    MatTableModule, 
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './orders-view.component.html',
  styleUrl: './orders-view.component.scss'
})
export class OrdersViewComponent implements OnInit {

  public orderService: OrderService = inject(OrderService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private dialog: MatDialog = inject(MatDialog);

  order: any[] = [];

  status = [
    { name: "Activas", value: 0 },
    { name: "En proceso", value: 1 },
    { name: "Listas", value: 2 },
    { name: "Completadas", value: 3 },
    { name: "Canceladas", value: 4 }
  ];

  displayedColumns = ['client', 'total', 'comments', 'function'];

  ngOnInit() {
    const user = this._localStorage.getItem('user');
    const userId = user?.idusers;

    if (userId) {
      // Iniciar conexión Realtime
      this.orderService.getOrdersRealTime(userId);

      // Suscripción
      this.orderService.orders$.subscribe((orders) => {
        this.order = Array.isArray(orders) ? orders : [];
      });
    }
  }

  filterByStatus(status: number) {
    if (!this.order) return [];
    return this.order.filter((eachOrder: any) => eachOrder.status == status);
  }

  // ✅ NUEVO: Detecta si algún producto dentro de la orden tiene comentarios
  hasProductNotes(order: any): boolean {
    if (order.order_details && Array.isArray(order.order_details)) {
        return order.order_details.some((detail: any) => detail.comments && detail.comments.trim() !== '');
    }
    return false;
  }

  openOrderDetailDialog(order: any) {
    // Importante pasar el objeto entero o el ID según espere tu componente
    this.dialog.open(OrderDetailComponent, { data: order });
  }

  openConfirmDialog(data: any) {
    this.dialog.open(DialogCompleteComponent, { data: data });
  }

  openCancelDialog(data: any) {
    this.dialog.open(DialogCancelComponent, { data: data });
  }
}