import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js'; // Importa ChartOptions
import { BaseChartDirective } from 'ng2-charts';
import { ProviderService } from '../../services/provider.service';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon'; // ✅ Agregado
import { WebSocketsService } from '../../services/web-sockets.service';

@Component({
  selector: 'app-dash-admin',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective, 
    MatCardModule, 
    MatDividerModule,
    MatIconModule // ✅ Agregado
  ],
  templateUrl: './dash-admin.component.html',
  styleUrl: './dash-admin.component.scss'
})
export class DashAdminComponent implements OnInit {
  private _provider: ProviderService = inject(ProviderService);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  
  products: any = [];
  clients: any = [];
  
  // Inicializamos objetos para evitar errores en el template
  avg: any = { minutos: 0 };
  total: any = { total: 0 };
  sales: any = [];
  
  dataSales!: ChartData<'bar'>;
  dataClient!: ChartData<'bar'>;
  dataProduct!: ChartData<'pie'>; 
  
  @ViewChild(BaseChartDirective) chartSales!: BaseChartDirective;

  // ✅ Opciones para hacer las gráficas bonitas y responsivas
  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false, // Permite que el CSS controle la altura
    plugins: {
      legend: { display: true, position: 'bottom' }
    }
  };

  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };

  async ngOnInit() {
    // Cargar datos
    this.total = await this._provider.request('GET', 'graphics/totalSales') || { total: 0 };
    this.avg = await this._provider.request('GET', 'graphics/avgTime') || { minutos: 0 };
    
    this.Sales();
    this.bestSeller();
    this.bestClient();
    this.listenGraphics();
  }

  async listenGraphics() {
    this._wsService.listen('grafica').subscribe((data) => {
      // Lógica de actualización en tiempo real
      let btotal: number = parseInt(data.total ?? 0);
      let atotal: number = this.dataSales.datasets[0].data[data.mes - 1] as number ?? 0;
      
      this.dataSales.datasets[0].data[data.mes - 1] = btotal + atotal;
      
      // Actualizar total general
      this.total.total = parseInt(this.total.total) + data.total;
      
      this.chartSales.update();
    });
  }

  async Sales() {
    this.sales = await this._provider.request('GET', 'graphics/sales');
    this.dataSales = {
      labels: this.sales.labels,
      datasets: [
        {
          data: this.sales.data, 
          label: 'Ventas ($)', 
          // Color AZUL CORPORATIVO (#0D47A1) con opacidad
          backgroundColor: 'rgba(13, 71, 161, 0.8)', 
          borderColor: '#0D47A1',
          borderWidth: 1,
          borderRadius: 5 // Bordes redondeados en las barras
        }
      ]
    };
  }

  async bestSeller() {
    const currentMonth = new Date().getMonth() + 1;
    this.products = await this._provider.request('GET', 'graphics/bestSeller', { mes: currentMonth });
    
    this.dataProduct = {
      labels: this.products.labels,
      datasets: [
        {
          data: this.products.data, 
          // Paleta combinada: Azul, Naranja, y complementarios
          backgroundColor: [
            '#0D47A1', // Azul Principal
            '#FF6B35', // Naranja Principal
            '#42A5F5', // Azul Claro
            '#FFCA28', // Amarillo
            '#66BB6A', // Verde
            '#AB47BC'  // Morado
          ],
          hoverOffset: 4
        }
      ]
    };
  }

  async bestClient() {
    this.clients = await this._provider.request('GET', 'graphics/bestClient');
    this.dataClient = {
      labels: this.clients.labels,
      datasets: [
        {
          data: this.clients.data, 
          label: 'Órdenes Realizadas', 
          // Color NARANJA CORPORATIVO (#FF6B35) con opacidad
          backgroundColor: 'rgba(255, 107, 53, 0.8)',
          borderColor: '#FF6B35',
          borderWidth: 1,
          borderRadius: 5
        }
      ]
    };
  }
}