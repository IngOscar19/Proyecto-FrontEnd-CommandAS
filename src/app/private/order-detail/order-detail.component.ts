import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { Router } from '@angular/router';
import { WebSocketsService } from '../../services/web-sockets.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe, CommonModule, SlicePipe } from '@angular/common'; 
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 

interface OrderDetail {
  idorderdetail: string;
  product: string;
  category: string;
  unit_price: number;
  comments?: string;
  order_type?: number;
  client?: string;
  total?: number;
  order_comments?: string;
  mes?: number;
  ingredients?: Array<{
    idnot_ingredient: number;
    name: string;
    type: number; // 0=Sin, 1=Extra
    extra?: number;
  }>;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, 
    CurrencyPipe, 
    SlicePipe, // ✅ Para recortar el ID
    MatButtonModule, 
    MatIconModule 
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {
  
  public _data = inject(MAT_DIALOG_DATA);
  private _provider: ProviderService = inject(ProviderService);
  public _router: Router = inject(Router);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);
  private dialogRef: MatDialogRef<OrderDetailComponent> = inject(MatDialogRef<OrderDetailComponent>);
  
  orderDetails: OrderDetail[] = [];

  async ngOnInit() {
    console.log("📦 Modal Detalles - Data recibida:", this._data); 

    // Manejo robusto: Si _data es solo un string (ID), lo convertimos a objeto
    const orderId = typeof this._data === 'string' ? this._data : this._data.idorder;

    try {
      const response: any = await this._provider.request('GET', 'order/viewOrder', { 
        idorder: orderId 
      });
      
      if (Array.isArray(response)) {
        this.orderDetails = response;
      } else if (response?.msg && Array.isArray(response.msg)) {
        this.orderDetails = response.msg;
      } else if (response?.data && Array.isArray(response.data)) {
        this.orderDetails = response.data;
      } else {
        this.orderDetails = [];
      }
      
    } catch (error) {
      console.error("❌ Error obteniendo detalles:", error);
      this._snackBar.open("Error al cargar los detalles", "Cerrar", { duration: 3000 });
    }
  }

  async updateStatus() {
    const orderId = typeof this._data === 'string' ? this._data : this._data.idorder;

    try {
      await this._provider.request('PUT', 'order/updateStatus', { 
        status: 2,  // 2 = Lista para entregar
        idorder: orderId, 
        users_idusers: this._localStorage.getItem('user')?.idusers 
      });

      this._snackBar.open("✅ ¡Orden marcada como LISTA!", "", { 
        duration: 3000, 
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });

      // Notificar al socket
      if (this._wsService.socketStatus) {
        await this._wsService.request('comandas', {
            idorder: orderId,
            status: 2,
            action: 'order_ready'
        });
      }
      
      this.dialogRef.close(true);

    } catch (error) {
      console.error("❌ Error al completar:", error);
      this._snackBar.open("Error al actualizar la orden", "Cerrar", { duration: 3000 });
    }
  }

  hasIngredients(order: OrderDetail): boolean {
    return !!(order?.ingredients && order.ingredients.length > 0);
  }
}