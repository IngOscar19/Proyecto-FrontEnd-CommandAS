import { Injectable, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LocalstorageService } from './localstorage.service';
import { WebSocketsService } from './web-sockets.service'; 
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  
  // Inyección de dependencias
  private _form_builder: FormBuilder = inject(FormBuilder);
  private _localstorage: LocalstorageService = inject(LocalstorageService);
  private _http: HttpClient = inject(HttpClient); 
  private _wsService: WebSocketsService = inject(WebSocketsService); 

  // URL de tu API PHP
  private apiUrl = 'http://localhost:8000';
  
  // Observable para manejar el estado de las órdenes en tiempo real
  private ordersSubject = new BehaviorSubject<any[]>([]);
  public orders$ = this.ordersSubject.asObservable();
  
  // Formulario reactivo principal para la orden
  formOrder: FormGroup = this._form_builder.group({
    idorder: new FormControl(null),
    date: new FormControl(null),
    total: new FormControl(null, [Validators.required]),
    status: new FormControl(null),
    origin: new FormControl(null),
    comments: new FormControl(null),
    client: new FormControl(null, [Validators.required]),
    users_idusers: new FormControl(this._localstorage.getItem('user')?.idusers, [Validators.required]),
    order_details: new FormArray([], [Validators.required]),
    start_order: new FormControl(null),
    finish_order: new FormControl(null)
  });

  // Método para crear un grupo de controles para un producto
  orderDetails(products_idproducts: string, price: number, name: string, name_category: string){
    const currentDetails = this.formOrder.controls['order_details'] as FormArray;
    const amount = currentDetails.value.filter((product: any) => product.products_idproducts == products_idproducts).length;
    
    return this._form_builder.group({
      idorderdetail: new FormControl(null),
      name: new FormControl(name, [Validators.required]),
      amount: new FormControl(amount + 1, [Validators.required]),
      unit_price: new FormControl(price, [Validators.required]),
      order_type: new FormControl(null, [Validators.required]),
      comments: new FormControl(null),
      order_idorder: new FormControl(null),
      products_idproducts: new FormControl(products_idproducts, [Validators.required]),
      not_ingredient: new FormArray([]),
      name_category: new FormControl(name_category, [Validators.required])
    });
  }
 
  notIngredients(id_ingredient: string, type: number, name:string, price:number){
      return this._form_builder.group({
      ingredients_idingredients: new FormControl(id_ingredient, [Validators.required]),
      order_details_idorderdetail: new FormControl(null),
      name: new FormControl(name, [Validators.required]),
      price: new FormControl(price, [Validators.required]),
      type: new FormControl(type, [Validators.required])
    });
  }

  // --- LÓGICA PRINCIPAL DE TIEMPO REAL ---
  
  getOrdersRealTime(userId: string) {
    // 1. Carga inicial
    this.fetchOrdersHttp(userId).subscribe();

    // 2. Escuchar nuevas comandas
    this._wsService.listen('comandas').subscribe((data: any) => {
      console.log('Websocket: Nueva comanda recibida', data);
      this.fetchOrdersHttp(userId).subscribe();
    });

    // 3. Escuchar cambios de estatus (Esto actualiza la vista del cliente cuando el admin cambia algo)
    this._wsService.listen('status-orden').subscribe((data: any) => {
        console.log('Websocket: Cambio de estatus recibido', data);
        this.fetchOrdersHttp(userId).subscribe();
    });
  }

  // --- PETICIÓN HTTP INTELIGENTE ---
  private fetchOrdersHttp(userId: string): Observable<any> {
    const user = this._localstorage.getItem('user'); 
    const token = this._localstorage.getItem('token') || user?.token;

    // Normalizamos el rol por si viene como string o number
    const rawRole = user?.rol !== undefined ? user.rol : user?.role;
    const role = Number(rawRole); 

    console.log('🔍 Debug Rol:', role);

    // Definir endpoint dinámico
    let endpoint = '';
    let params: any = {};


    if (role === 3) {
        // CLIENTE: Ruta filtrada por usuario
        endpoint = `${this.apiUrl}/order/viewOrdersByUser`;
        params = JSON.stringify({ idusers: userId });
        console.log('CLIENTE: viewOrdersByUser -> Solicitando solo mis órdenes');
    } else {
        // ADMIN/STAFF (0, 1, 2): Ruta completa
        endpoint = `${this.apiUrl}/order/viewOrders`;
        params = JSON.stringify({}); 
        console.log('ADMIN: viewOrders -> Solicitando TODAS las órdenes');
    }
    
    const headers = new HttpHeaders({
      'Authorization': token || '',
      'Content-Type': 'application/json'
    });

    return this._http.get<any>(endpoint, {
      headers: headers,
      params: { params: params }
    }).pipe(
      tap((res: any) => {
        if (!res.error) {
          
          const orders = res.msg || [];
          this.ordersSubject.next(orders); 
        } else {
          console.error('Error API:', res.msg);
          // Si hay error (ej. "No hay órdenes"), limpiamos la lista
          this.ordersSubject.next([]);
        }
      })
    );
  }

  createOrder(orderData: any): Observable<any> {
    const user = this._localstorage.getItem('user');
    const token = this._localstorage.getItem('token') || user?.token;

    const headers = new HttpHeaders({
        'Authorization': token || '',
        'Content-Type': 'application/json'
    });

    return this._http.post(`${this.apiUrl}/order/createOrder`, orderData, { headers }).pipe(
      tap(async (res: any) => {
        if (!res.error) {
          console.log('Orden guardada. Notificando sockets...');
          await this._wsService.notifyNewComanda({
            ...orderData,
            idorder: res.msg?.idorder 
          });
        }
      })
    );
  }

  // Actualizar estado de orden
  updateStatus(idorder: string, status: number): Observable<any> {
    const user = this._localstorage.getItem('user');
    const token = this._localstorage.getItem('token') || user?.token;
    
    const headers = new HttpHeaders({
        'Authorization': token || '',
        'Content-Type': 'application/json'
    });

    const body = {
        idorder: idorder,
        status: status,
        users_idusers: user?.idusers
    };

    return this._http.put(`${this.apiUrl}/order/updateStatus`, body, { headers }).pipe(
      tap((res: any) => {
        if (!res.error) {
          console.log(`Status actualizado a ${status}. Enviando señal Socket...`);
          
          this._wsService.emit('status-orden', { idorder, status });
        }
      })
    );
  }
}