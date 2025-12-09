import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketsService {
  public socketStatus = false;
  private socket: Socket;
  private _http: HttpClient = inject(HttpClient);
  
  // URL del servidor Socket.IO
  private socketUrl = 'http://localhost:3000';

  constructor() {
    // Inicializar Socket.IO
    this.socket = io(this.socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    this.checkStatus();
  }

  // Verificar estado de la conexión
  checkStatus() {
    this.socket.on('connect', () => {
      console.log('✅ Socket conectado - ID:', this.socket.id);
      this.socketStatus = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
      this.socketStatus = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error);
      this.socketStatus = false;
    });
  }

  // Escuchar eventos del socket
  listen(evento: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(evento, (message) => {
        console.log(`📨 Evento "${evento}" recibido:`, message);
        observer.next(message);
      });
    });
  }

  // Emitir eventos al socket
  emit(evento: string, data: any) {
    console.log(`📤 Emitiendo "${evento}":`, data);
    this.socket.emit(evento, data);
  }

  // Desconectar socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socketStatus = false;
    }
  }

  // Reconectar socket
  reconnect() {
    if (!this.socketStatus) {
      this.socket.connect();
    }
  }

  // Notificar nueva comanda vía HTTP al servidor Node
  async notifyNewComanda(orderData: any) {
    return this.request('comandas', orderData);
  }

  // Notificar actualización de gráficas
  async notifyGraficas(data: any) {
    return this.request('graficas', data);
  }

  // Notificar cambio de status
  async notifyStatusChange(orderData: any) {
    return this.request('status-orden', orderData);
  }

  // Request HTTP al servidor Node (reutilizable)
  async request<T>(route: string, data?: any) {
    return new Promise<T>((resolve, reject) =>
      this._http
        .request<any>('POST', `http://localhost:3000/${route}`, {
          body: data,
        })
        .subscribe({
          next: (response: any) => {
            console.log(`✅ Respuesta de /${route}:`, response);
            resolve(response);
          },
          error: (error) => {
            console.error(`❌ Error en /${route}:`, error);
            reject(error);
          }
        })
    );
  }
}