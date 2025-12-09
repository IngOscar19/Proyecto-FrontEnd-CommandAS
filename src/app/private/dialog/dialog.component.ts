import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { ProviderService } from '../../services/provider.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule
  ],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  private dialog: MatDialog = inject(MatDialog);
  private dialogRef: MatDialogRef<DialogComponent> = inject(MatDialogRef<DialogComponent>);
  
  // Cambié a public para poder usarlo en el HTML ({{_data.client}})
  public _data = inject(MAT_DIALOG_DATA); 
  
  private _provider: ProviderService = inject(ProviderService);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  isLoading = false; // Estado de carga

  async openOrderDetails() {
    this.isLoading = true; // Bloquear botón

    try {
      const payload = {
        status: 1, 
        idorder: this._data.idorder,
        users_idusers: this._localStorage.getItem('user').idusers
      };
      
      // 1. Actualizar estado
      await this._provider.request('PUT', 'order/updateStatus', payload);

      this._snackBar.open("¡Manos a la obra! Pedido en proceso", "", { 
        duration: 3000, 
        verticalPosition: 'top',
        panelClass: ['snackbar-success'] // (Opcional si tienes estilos globales)
      });

      // 2. WebSocket
      let nStatus: object = {
        idorder: this._data.idorder,
        client: this._data.client,
        total: parseFloat(this._data.total || 0),
        mes: this._data.mes || new Date().getMonth() + 1,
        comments: this._data.comments,
        status: 1,
        users_idusers: this._localStorage.getItem('user').idusers
      };
      
      await this._wsService.request('comandas', nStatus);

      // 3. Cerrar este diálogo
      this.dialogRef.close(true);

      // 4. Abrir detalles (Comanda digital)
      setTimeout(() => {
        this.dialog.open(OrderDetailComponent, { 
          data: this._data,
          width: '90%',      // Opcional: Hacerlo más ancho para ver mejor
          maxWidth: '600px'
        });
      }, 100);

    } catch (error) {
      console.error('Error al tomar la orden:', error);
      this._snackBar.open("Error al actualizar la orden", "Cerrar", { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}