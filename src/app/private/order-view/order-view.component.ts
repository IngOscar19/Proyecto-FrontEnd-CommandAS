import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { CurrencyPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ProviderService } from '../../services/provider.service';
import { Router, RouterLink } from '@angular/router';
import { WebSocketsService } from '../../services/web-sockets.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-order-view',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatFormFieldModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    RouterLink,
    MatIconModule
  ],
  templateUrl: './order-view.component.html',
  styleUrl: './order-view.component.scss',
})
export class OrderViewComponent implements OnInit {

  // Inyección de dependencias
  private _provider: ProviderService = inject(ProviderService);
  private _router: Router = inject(Router);
  public _order: OrderService = inject(OrderService);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);
  private _localStorage: LocalstorageService = inject(LocalstorageService);

  async ngOnInit() {
    // Inicialización si fuera necesaria
  }

  // Filtra ingredientes extras o excepciones
  filterExtras(item: any, type: 0 | 1) {
    if (!item.not_ingredient) return [];
    return item.not_ingredient.filter(
      (ingredient: any) => ingredient.type == type
    );
  }

  // --- CÁLCULOS DE TOTALES ---

  totalProducts() {
    return this.eachProduct().value
      .map((product: any) => product.unit_price)
      .reduce((previous: number, current: any) => previous + parseFloat(current || 0), 0);
  }

  totalExtras() {
    return this.eachProduct().value
      .map((product: any) => {
        if (!product.not_ingredient) return 0;
        return product.not_ingredient
          .map((ingredient: any) => ingredient.price)
          .reduce((previous: number, current: any) => previous + parseFloat(current || 0), 0);
      })
      .reduce((previous: number, current: number) => previous + current, 0);
  }

  totalOrder() {
    const total = this.totalProducts() + this.totalExtras();
    // Importante: Actualizamos el valor en el formulario
    this._order.formOrder.controls['total'].patchValue(total);
    return total;
  }

  // --- ACCESOS AL FORMULARIO ---

  radioForm() {
    return this._order.formOrder.controls['order_details'] as FormGroup;
  }

  eachProduct() {
    return this._order.formOrder.controls['order_details'] as FormArray;
  }

  orderDetailsArray() {
    return this._order.formOrder.controls['order_details'] as FormArray;
  }

  // --- MANEJO DE EVENTOS ---

  // Cambia el tipo de pedido (Comer aquí/Llevar) para TODOS los productos
  selected(event: MatRadioChange) {
    this.eachProduct().controls.forEach((product: AbstractControl) => {
      const productGroup = product as FormGroup;
      productGroup.controls['order_type'].patchValue(event.value);
    });
  }

  deleteProduct(index: number) {
    this.eachProduct().removeAt(index);
  }

  // --- ENVIAR ORDEN (Lógica corregida) ---

  async placeOrder() {
    console.log("Intentando enviar orden...");

    // 1. Calcular y asignar el total antes de validar
    const finalTotal = this.totalOrder();

    // 2. Obtener usuario y fecha actual
    const user = this._localStorage.getItem('user');
    const now = new Date();
    // Formato fecha MySQL: YYYY-MM-DD HH:mm:ss
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

    // 3. Parchear valores faltantes en el formulario principal
    this._order.formOrder.patchValue({
      total: finalTotal,
      users_idusers: user?.idusers,
      date: formattedDate,
      status: 1 // Estado inicial de la orden (pendiente/creada)
    });

    // 4. Verificar validez del formulario
    if (this._order.formOrder.invalid) {
      console.error("❌ El formulario es inválido. Revise los campos:");
      
      // Mostrar en consola qué campos fallan
      Object.keys(this._order.formOrder.controls).forEach(key => {
        const errors = this._order.formOrder.get(key)?.errors;
        if (errors) {
          console.error(`Campo con error: ${key}`, errors);
        }
      });

      // Verificar errores dentro del array de productos
      this.eachProduct().controls.forEach((group, index) => {
        if (group.invalid) {
          console.error(`Producto en posición ${index} inválido`, (group as FormGroup).controls);
        }
      });

      this._snackBar.open("Faltan datos (Cliente, Tipo de orden o Productos)", "Cerrar", { 
        duration: 3000, 
        verticalPosition: 'top',
        panelClass: ['warning-snackbar'] // Opcional: estilo CSS
      });
      
      this._order.formOrder.markAllAsTouched(); // Marca los campos en rojo
      return;
    }

    // 5. Verificar conexión Socket
    if (!this._wsService.socketStatus) {
      this._snackBar.open("⚠️ Sin conexión al servidor de pedidos", "", { duration: 3000 });
      // Nota: Podrías decidir continuar igual si tu backend maneja la lógica sin socket
    }

    // 6. Enviar petición al Backend
    try {
      console.log("📦 Enviando payload:", this._order.formOrder.value);
      
      const response: any = await this._provider.request(
        'POST', 
        'order/createOrder', 
        this._order.formOrder.value
      );

      if (response) {
        // Enviar notificación por WebSocket
        // Usamos el ID que retorna la base de datos si existe, o generamos uno temporal
        const socketData = {
          ...this._order.formOrder.value,
          idorder: response.idorder || response.insertId // Ajustar según respuesta de tu API PHP
        };

        await this._wsService.request('comandas', socketData);

        this._snackBar.open("✅ Orden realizada con éxito", "", { 
          duration: 3000, 
          verticalPosition: 'top' 
        });

        // Redireccionar y Limpiar
        this._router.navigate(['private/orders-view']);
        this.resetForm();
      } else {
        this._snackBar.open("❌ El servidor no confirmó la orden", "", { duration: 3000 });
      }

    } catch (error) {
      console.error("❌ Error CRÍTICO al crear orden:", error);
      this._snackBar.open("Error al procesar la solicitud", "Cerrar", { duration: 3000 });
    }
  }

  // Método auxiliar para limpiar todo el formulario y el array
  private resetForm() {
    this._order.formOrder.reset();
    const arr = this.orderDetailsArray();
    while (arr.length !== 0) {
      arr.removeAt(0);
    }
  }
}