import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-complete',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dialog-complete.component.html',
  styleUrl: './dialog-complete.component.scss'
})
export class DialogCompleteComponent implements OnInit {
  
  // Inyecciones
  private dialogRef: MatDialogRef<DialogCompleteComponent> = inject(MatDialogRef<DialogCompleteComponent>);
  private _data = inject(MAT_DIALOG_DATA);
  private _provider: ProviderService = inject(ProviderService);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);
  private _localStorage: LocalstorageService = inject(LocalstorageService);

  isLoading = false; // Estado de carga

  ngOnInit() {
    console.log('Datos Orden:', this._data);
  }

  async updateStatus() {
    this.isLoading = true; // Bloqueamos botón

    if (!this._wsService.socketStatus) {
      this._snackBar.open("No hay conexión con el servidor", "Cerrar", { duration: 3000 });
      this.isLoading = false;
      return;
    }

    try {
      // 1. Actualizar estado en BD
      await this._provider.request('PUT', 'order/updateStatus', {
        status: 3,
        idorder: this._data.idorder,
        users_idusers: this._localStorage.getItem('user').idusers
      });

      // 2. Feedback visual
      this._snackBar.open("¡Orden completada con éxito!", "", { 
        duration: 3000, 
        verticalPosition: 'top',
        panelClass: ['snackbar-success'] 
      });

      // 3. Notificar a Comandas (Socket)
      const nStatus = {
        idorder: this._data.idorder,
        client: this._data.client,
        total: parseFloat(this._data.total || 0),
        mes: this._data.mes || new Date().getMonth() + 1,
        comments: this._data.comments,
        status: 3,
        users_idusers: this._localStorage.getItem('user').idusers
      };
      console.log('Enviando socket comandas:', nStatus);
      await this._wsService.request('comandas', nStatus);

      // 4. Notificar a Gráficas (Socket)
      const sale = {
        mes: this._data.mes || new Date().getMonth() + 1,
        total: parseFloat(this._data.total || 0)
      };
      console.log('Enviando socket graficas:', sale);
      await this._wsService.request('graficas', sale);

      // 5. Cerrar diálogo
      this.dialogRef.close(true);

    } catch (error) {
      console.error('Error al completar la orden:', error);
      this._snackBar.open("Ocurrió un error al completar", "Cerrar", { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }
}