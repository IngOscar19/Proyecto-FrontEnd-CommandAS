import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip'; // ✅ Agregado
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // ✅ Agregado
import { ProviderService } from '../../../services/provider.service';
import { LocalstorageService } from '../../../services/localstorage.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-favorites',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './client-favorites.component.html',
  styleUrls: ['./client-favorites.component.scss']
})
export class ClientFavoritesComponent implements OnInit {

  private provider = inject(ProviderService);
  private localStorage = inject(LocalstorageService);

  favorites: any[] = [];
  isLoading = true;
  userId: string = '';

  ngOnInit() {
    const user = this.localStorage.getItem('user');
    if (user) {
      this.userId = user.idusers;
      this.loadFavorites();
    } else {
        this.isLoading = false;
    }
  }

  async loadFavorites() {
    this.isLoading = true;
    try {
      const res: any = await this.provider.request('GET', 'favorites/get', { idusers: this.userId });
      this.favorites = Array.isArray(res) ? res : [];
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  async removeFavorite(product: any) {
    // Optimistic Update: Lo quita de la vista inmediatamente para que se sienta rápido
    this.favorites = this.favorites.filter(p => p.idproducts !== product.idproducts);

    try {
      await this.provider.request('POST', 'favorites/toggle', { 
        idusers: this.userId, 
        idproducts: product.idproducts 
      });
    } catch (error) {
      console.error("Error al eliminar favorito");
      // Si falla, podrías recargar la lista o mostrar un error
      this.loadFavorites(); 
    }
  }

  getProductImage(productName: string): string {
    if (!productName) return 'assets/Snack.png';
    
    const name = productName.toLowerCase();
    let fileName = 'Snack.png'; 

    if (name.includes('hamburguesa')) fileName = 'Hamburguesa.png';
    else if (name.includes('refresco') || name.includes('coca') || name.includes('bebida') || name.includes('sprite')) fileName = 'Refresco.png';
    else if (name.includes('agua')) fileName = 'Agua.png';
    else if (name.includes('papas')) fileName = 'Orden de papas.png';
    else if (name.includes('nuggets')) fileName = 'Nuggets de pollo.png';
    else if (name.includes('salchipapa')) fileName = 'Orden de salchipapas.png';
    else if (name.includes('banderilla')) fileName = 'Banderilla.png';
    else if (name.includes('alitas')) fileName = 'Alitas.png';
    else if (name.includes('snack')) fileName = 'Snack.png';
    
    return `assets/${fileName}`;
  }
}