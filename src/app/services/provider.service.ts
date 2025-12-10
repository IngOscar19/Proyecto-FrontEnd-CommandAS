import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { LocalstorageService } from './localstorage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private _http: HttpClient = inject(HttpClient);
  private _localstorage: LocalstorageService = inject(LocalstorageService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  excep: any = {
    '001': 'Método de petición incorrecto',
    '002': 'Clase incorrecta',
    '003': 'Método inexistente',
    '006': 'Token no enviado',
    '007': 'Parámetros vacíos',
    '004': 'El usuario no existe',
    '005': 'Credenciales inválidas',
    '008': 'El nombre de usuario ya está en uso',
    '009': 'El teléfono ya está registrado',
    '010': 'Rol inválido',
  };

  async request<T>(method: string, action: string, data?: any) {
    const PROTOCOL = window.location.protocol;
    const DOMINIO = window.location.hostname;
    const ACCESS = '8000';
    const url = `${PROTOCOL}//${DOMINIO}:${ACCESS}/${action}`;

    const headers = this.headers();

    return new Promise<T>((resolve, reject) => {
      let observable;

      // Usar el método HTTP apropiado según el tipo
      switch (method.toUpperCase()) {
        case 'GET':
          const params = data ? new HttpParams({ fromObject: data }) : undefined;
          observable = this._http.get<any>(url, { headers, params });
          break;
        
        case 'POST':
          observable = this._http.post<any>(url, data || null, { headers });
          break;
        
        case 'PUT':
          observable = this._http.put<any>(url, data || null, { headers });
          break;
        
        case 'DELETE':
          const deleteParams = data ? new HttpParams({ fromObject: data }) : undefined;
          observable = this._http.delete<any>(url, { headers, params: deleteParams });
          break;
        
        default:
          reject(new Error(`Método HTTP no soportado: ${method}`));
          return;
      }

      observable.subscribe({
        next: (response: any) => {
          console.log('Respuesta completa del servidor:', response);
          console.log('Tipo de response.msg:', typeof response.msg);
          console.log('Contenido de response.msg:', response.msg);
          
          if (!response.error) {
            resolve(response.msg);
          } else {
            console.error('Error en respuesta:', response.error_code, response.msg);
            this._snackBar.open(
              this.excep[response.error_code] || response.msg || 'Error desconocido',
              '',
              { duration: 3000 }
            );
            reject(response.msg);
          }
        },
        error: (error) => {
          console.error('Error HTTP completo:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          this._snackBar.open('Error de conexión', '', { duration: 3000 });
          reject(error);
        },
      });
    });
  }

  headers() {
    const user = this._localstorage.getItem('user');
    const token = user?.token || ''; // aquí no se lee 'token' separado

    return new HttpHeaders()
      .set('simple', 'bb1557a2774351913c8557251ec2cbb4')
      .set('authorization', token)
      .set('Content-Type', 'application/json');
  }

}