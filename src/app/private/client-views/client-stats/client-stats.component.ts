import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // ✅ Agregado
import { ProviderService } from '../../../services/provider.service';
import { LocalstorageService } from '../../../services/localstorage.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-stats',
  standalone: true,
  imports: [
    CommonModule, 
    BaseChartDirective, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule, // ✅ Agregado
    RouterLink
  ],
  templateUrl: './client-stats.component.html',
  styleUrl: './client-stats.component.scss'
})
export class ClientStatsComponent implements OnInit {

  private provider = inject(ProviderService);
  private localStorage = inject(LocalstorageService);

  userId: string = '';
  dataFavorites!: ChartData<'pie'>;
  hasFavorites: boolean = false;
  isLoading: boolean = true;
  topProduct: string = '';

  // Opciones para que se vea bonito y responsive
  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false, // Permite ajustar altura por CSS
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20 } }
    }
  };

  ngOnInit() {
    const user = this.localStorage.getItem('user');
    if (user && user.idusers) {
      this.userId = user.idusers;
      this.loadMyFavorites();
    } else {
        this.isLoading = false;
    }
  }

  async loadMyFavorites() {
    const currentMonth = new Date().getMonth() + 1;
    this.isLoading = true;
    try {
        const res: any = await this.provider.request('GET', 'graphics/clientMonthlyFavorites', { 
            idusers: this.userId, 
            mes: currentMonth 
        });

        if (res && res.labels && res.labels.length > 0) {
            this.hasFavorites = true;
            this.topProduct = res.labels[0]; // El primero suele ser el más vendido
            
            this.dataFavorites = {
                labels: res.labels,
                datasets: [{
                    data: res.data,
                    // Paleta Corporativa: Azul, Naranja, Azul Claro, Amarillo, Verde
                    backgroundColor: ['#0D47A1', '#FF6B35', '#42A5F5', '#FFCA28', '#66BB6A'],
                    hoverBackgroundColor: ['#0D47A1', '#FF6B35', '#42A5F5', '#FFCA28', '#66BB6A'],
                    hoverOffset: 4,
                    borderWidth: 0 // Quitar borde blanco para look moderno
                }]
            };
        }
    } catch (error) {
        console.error("Error cargando estadísticas", error);
    } finally {
        this.isLoading = false;
    }
  }
}