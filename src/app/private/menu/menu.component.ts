import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ProviderService } from '../../services/provider.service';
import { Product } from '../../interfaces/product.model';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule, CurrencyPipe, KeyValuePipe, NgClass, NgStyle } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { Ingredient } from '../../interfaces/ingredient.model';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../services/order.service';
import { Router, RouterLink } from '@angular/router';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatRadioModule } from '@angular/material/radio'; 
import { MatButtonModule } from '@angular/material/button'; 
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatSidenavModule,
    KeyValuePipe,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    NgStyle,
    CurrencyPipe,
    NgClass,
    RouterLink,
    MatRadioModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit {

  // Inyecciones
  private provider: ProviderService = inject(ProviderService);
  public order: OrderService = inject(OrderService);
  private router: Router = inject(Router);
  private localStorage: LocalstorageService = inject(LocalstorageService);

  @ViewChild('barraComentarios') barraComentarios!: MatDrawer;

  // Variables de menú
  menu: Product[] = [];
  classicBurgers: Product[] = [];
  premiumBurgers: Product[] = [];
  snacks: Product[] = [];
  drinks: Product[] = [];

  // Variables de usuario
  favoritesSet: Set<string> = new Set();
  userId: string = '';
  userRole: number = 0; 

  async ngOnInit() {
    console.log('📄 Iniciando menú...');
    
    // 1. Obtener usuario y detectar rol
    const user = this.localStorage.getItem('user');
    if (user) {
        this.userId = user.idusers;
        
        // Manejo flexible por si viene como "rol" o "role"
        const rawRole = user.rol !== undefined ? user.rol : user.role;
        this.userRole = Number(rawRole);
        
        // Solo cargar favoritos si es cliente (Rol 3)
        if (this.isClient()) {
            this.loadFavorites(); 
        }
    }

    // 2. Cargar productos desde el backend
    try {
      const response: any = await this.provider.request('GET', 'menu/viewIngredients');
      let allProducts = [];
      
      if (Array.isArray(response)) allProducts = response;
      else if (response?.msg) allProducts = response.msg;
      else if (response?.data) allProducts = response.data;

      this.menu = allProducts as Product[];

      if (this.menu.length > 0) {
        this.classicBurgers = this.filterByCategory('cat-001');
        this.premiumBurgers = this.filterByCategory('cat-002');
        this.snacks = this.filterByCategory('cat-004');
        this.drinks = this.filterByCategory('cat-003');
      }
    } catch (error) {
      console.error('❌ Error menú:', error);
    }

    // 3. Listener para abrir/cerrar carrito automáticamente
    this.order.formOrder.controls['order_details'].valueChanges.subscribe((value: any) => {
      if (!value.length) this.barraComentarios.close();
      if (this.orderDetailsArray.value.length && !this.orderEmpty) this.barraComentarios.open();
    });
  }

  // ==========================================
  //          HELPERS DE ROL
  // ==========================================
  isClient(): boolean {
      // 0 = Admin, 1 = Cajero, 2 = Cocinero, 3 = Cliente
      // Retorna true solo si el rol es 3 (o 4 por compatibilidad antigua)
      return this.userRole === 3 || this.userRole === 4;
  }

  // ==========================================
  //          FAVORITOS
  // ==========================================
  async loadFavorites() {
    if (!this.userId) return;
    try {
        const favs: any = await this.provider.request('GET', 'favorites/get', { idusers: this.userId });
        if (Array.isArray(favs)) {
            this.favoritesSet = new Set(favs.map((f: any) => f.idproducts));
        }
    } catch (e) { console.error('Error loading favs', e); }
  }

  isFavorite(idProduct: string): boolean {
    return this.favoritesSet.has(idProduct);
  }

  async toggleFavorite(product: Product) {
    if (!this.userId) return; 
    const id = product.idproducts;
    
    // Optimistic Update (Actualiza la UI antes de la respuesta del servidor)
    if (this.favoritesSet.has(id)) this.favoritesSet.delete(id);
    else this.favoritesSet.add(id);

    try {
        await this.provider.request('POST', 'favorites/toggle', {
            idusers: this.userId,
            idproducts: id
        });
    } catch (error) {
        // Rollback en caso de error
        if (this.favoritesSet.has(id)) this.favoritesSet.delete(id);
        else this.favoritesSet.add(id);
    }
  }

  // ==========================================
  //          LÓGICA DE ORDEN
  // ==========================================

  calculateTotal(): number {
    const details = this.order.formOrder.get('order_details')?.value || [];
    let total = 0;
    details.forEach((item: any) => {
      total += parseFloat(item.unit_price || 0);
      if (item.not_ingredient) {
        item.not_ingredient.forEach((ing: any) => {
          if (ing.price && ing.type === 1) total += parseFloat(ing.price);
        });
      }
    });
    return total;
  }

  async sendOrder() {
    const user = this.localStorage.getItem('user');
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' '); 
    const calculatedTotal = this.calculateTotal();

    const detailsArray = this.order.formOrder.get('order_details') as FormArray;
    detailsArray.controls.forEach((control: any) => {
        if (control.get('order_type')?.value === null) {
            control.get('order_type')?.setValue(1); 
        }
    });

    this.order.formOrder.patchValue({
      total: calculatedTotal,
      users_idusers: user?.idusers,
      date: formattedDate,
      status: 0, 
      client: this.order.formOrder.get('client')?.value
    });

    if (this.order.formOrder.invalid) {
      Swal.fire({
        title: 'Faltan datos',
        text: 'Por favor, ingresa el nombre del cliente para continuar.',
        icon: 'warning',
        confirmButtonColor: '#FF6B35',
        confirmButtonText: 'Entendido'
      });
      this.order.formOrder.markAllAsTouched(); 
      return; 
    }

    Swal.fire({
      title: 'Enviando orden...',
      text: 'Por favor espere',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.order.createOrder(this.order.formOrder.value).subscribe({
      next: (res: any) => {
        Swal.close();

        if (!res.error) {
          Swal.fire({
            title: '¡Orden Enviada!',
            text: 'La comanda ha llegado a la cocina exitosamente.',
            icon: 'success',
            confirmButtonColor: '#0D47A1',
            confirmButtonText: 'Genial',
            timer: 3000,
            timerProgressBar: true
          }).then(() => {
             // Redirección según rol
             const role = Number(this.userRole);
             if (role === 3 || role === 4) {
               this.router.navigate(['/client/orders']);
             } else {
               this.router.navigate(['/private/orders-view']);
             }
          });
          
          this.resetOrderForm();

        } else {
          Swal.fire({
            title: 'Error',
            text: res.msg || 'No se pudo crear la orden',
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }
      },
      error: (err) => {
        Swal.close();
        console.error('❌ Error en la petición', err);
        Swal.fire({
          title: 'Error de conexión',
          text: 'Ocurrió un problema al comunicar con el servidor.',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      },
    });
  }

  resetOrderForm() {
    (this.order.formOrder.controls['order_details'] as FormArray).clear();
    this.order.formOrder.reset({
      users_idusers: this.localStorage.getItem('user')?.idusers,
      origin: 'LOCAL',
      status: 0, 
    });
    this.barraComentarios.close();
  }

  // ==========================================
  //          FILTROS Y UTILS
  // ==========================================

  filterByCategory(id: string): Product[] {
    return this.menu.filter(p => p.category_idcategory === id);
  }

  filterByProduct(id: string): Product | undefined {
    return this.menu.find(p => p.idproducts === id);
  }

  filterByIngredient(key: 'base' | 'extra', ings?: Ingredient[]): Ingredient[] | undefined {
    if (!ings) return [];
    return key === 'base' ? ings.filter(i => i.required === 1) : ings.filter(i => i.required === 0);
  }

  addIngredient(prodId: string, ingId: string, type: number, event: any, amt: number, name: string, price: number) {
    const idx = this.orderDetailsArray.value.findIndex((p: any) => p.products_idproducts === prodId);
    if (idx === -1) return;

    const group = this.orderDetailsArray.at(idx) as FormGroup;
    const notIngs = group.controls['not_ingredient'] as FormArray;

    if (event) {
      notIngs.push(this.order.notIngredients(ingId, type, name, price));
    } else {
      const i = notIngs.value.findIndex((ing: any) => ing.ingredients_idingredients === ingId && ing.type === type);
      if (i !== -1) notIngs.removeAt(i);
    }
  }

  ingredientsSelected(idx: number, type: number, _name: string): string[] {
    const group = this.orderDetailsArray.at(idx) as FormGroup;
    const notIngs = group.controls['not_ingredient'] as FormArray;
    return notIngs.value.filter((i: any) => i.type === type).map((i: any) => i.name);
  }

  amount(id: string): number {
    return this.orderDetailsArray.value.filter((p: any) => p.products_idproducts === id).length;
  }

  get orderDetailsArray(): FormArray {
    return this.order.formOrder.controls['order_details'] as FormArray;
  }

  get orderEmpty(): boolean {
    return this.orderDetailsArray.value.map((o: any) => Object.values(o).flat()).flat().every((i: any) => !i || i.length === 0);
  }

  addProduct(id: string, price: any, name: string, cat: string) {
    this.barraComentarios.open();
    const p = typeof price === 'string' ? parseFloat(price) : price;
    this.orderDetailsArray.push(this.order.orderDetails(id, p, name, cat));
  }

  removeProduct(id: string) {
    const i = this.orderDetailsArray.value.findIndex((p: any) => p.products_idproducts === id);
    if (i !== -1) this.orderDetailsArray.removeAt(i);
  }

  trackByFn(i: number, item: Product) { return item.idproducts; }

  // ==========================================
  //          MANEJO DE IMÁGENES
  // ==========================================

  getProductImage(name: string): string {
    const n = name.toLowerCase();
    let f = 'Snack.png'; 
    if (n.includes('hamburguesa')) f = 'Hamburguesa.png';
    else if (n.includes('refresco') || n.includes('coca') || n.includes('sprite') || n.includes('fanta') || n.includes('bebida')) f = 'Refresco.png';
    else if (n.includes('agua')) f = 'Agua.png';
    else if (n.includes('salchipapa')) f = 'Orden de salchipapas.png';
    else if (n.includes('papas')) f = 'Orden de papas.png';
    else if (n.includes('nuggets')) f = 'Nuggets de pollo.png';
    else if (n.includes('banderilla')) f = 'Banderilla.png';
    else if (n.includes('alitas')) f = 'Alitas.png';
    return `assets/${f}`; 
  }

  getIngredientImage(name: string): string {
    const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    let f = 'Snack.png';
    if (n.includes('carne')) f = 'Carne.png';
    else if (n.includes('cebolla')) f = 'Cebolla.png';
    else if (n.includes('lechuga')) f = 'Lechuga.png';
    else if (n.includes('tomate') || n.includes('jitomate')) f = 'Jitomate.png';
    else if (n.includes('queso')) f = 'Queso.png';
    else if (n.includes('jamon')) f = 'Jamon.png';
    else if (n.includes('pina')) f = 'Piña.png';
    else if (n.includes('catsup') || n.includes('ketchup')) f = 'Catsup.png';
    else if (n.includes('mayonesa')) f = 'Mayonesa.png';
    else if (n.includes('mostaza')) f = 'Mostaza.png';
    else if (n.includes('aguacate')) f = 'Aguacate.png';
    else if (n.includes('tocino')) f = 'Carne.png'; 
    else if (n.includes('pepinillo')) f = 'Cebolla.png';
    else if (n.includes('pan')) f = 'Hamburguesa.png';
    return `assets/${f}`;
  }
}