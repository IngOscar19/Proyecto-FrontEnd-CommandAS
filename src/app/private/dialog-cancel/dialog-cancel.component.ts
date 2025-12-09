import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common'; // Para el @if

@Component({
  selector: 'app-dialog-cancel',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule
  ],
  templateUrl: './dialog-cancel.component.html',
  styleUrl: './dialog-cancel.component.scss'
})
export class DialogCancelComponent implements OnInit {
  
  // Inyecciones
  public dialogRef = inject(MatDialogRef<DialogCancelComponent>); // ✅ Necesario para cerrar manual
  private _data = inject(MAT_DIALOG_DATA);
  private _provider: ProviderService = inject(ProviderService);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);
  private _localStorage: LocalstorageService = inject(LocalstorageService);

  isLoading = false; // Para deshabilitar botón mientras carga

  ngOnInit() {
    console.log('Datos del diálogo:', this._data);
  }

  async updateStatus() {
    this.isLoading = true; // Bloquear botón

    try {
      if (this._wsService.socketStatus) {
        
        // 1. Petición al servidor
        // Nota: Corregí la sintaxis del subscribe/await que tenías antes
        const response: any = await this._provider.request('PUT', 'order/updateStatus', {
          status: 4,
          idorder: this._data.idorder,
          users_idusers: this._localStorage.getItem('user').idusers
        });

        // 2. Notificar por WebSocket
        const nStatus = {
          "idorder": this._data.idorder,
          "client": this._data.client,
          "total": this._data.total,
          "mes": this._data.mes,
          "comments": this._data.comments,
          "status": 4,
          "users_idusers": this._localStorage.getItem('user').iduser // Ojo: iduser vs idusers (revisa tu DB)
        };
        
        console.log('Enviando socket:', nStatus);
        this._wsService.request('comandas', nStatus);

        // 3. Feedback visual
        this._snackBar.open("Orden cancelada correctamente", "Cerrar", {
          duration: 3000, 
          verticalPosition: 'top',
          panelClass: ['snackbar-success'] // Puedes estilizar esto globalmente
        });

        // 4. Cerrar el diálogo retornando TRUE
        this.dialogRef.close(true);

      } else {
        this._snackBar.open("Error de conexión con Socket", "Cerrar", { duration: 3000 });
      }

    } catch (error) {
      console.error('Error al cancelar:', error);
      this._snackBar.open("Error al cancelar la orden", "Cerrar", { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }
}