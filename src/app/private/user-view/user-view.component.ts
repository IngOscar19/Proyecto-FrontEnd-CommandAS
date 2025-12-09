import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip'; 
import { RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatSortModule, 
    MatPaginatorModule, 
    RouterLink, 
    MatIconModule,
    MatButtonModule,
    MatTooltipModule // ✅ Agregado
  ],
  templateUrl: './user-view.component.html',
  styleUrl: './user-view.component.scss'
})
export class UserViewComponent implements AfterViewInit {
  
  displayedColumns: string[] = ['name', 'phone', 'rol', 'actions'];
  dataSource!: MatTableDataSource<any>;
  
  private _provider: ProviderService = inject(ProviderService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  roles = [
    { name: 'Administrador', value: 0 },
    { name: 'Cajero', value: 1 },
    { name: 'Cocinero', value: 2 },
    { name: 'Cliente', value: 3 }
  ];

  ngAfterViewInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const users: any[] = await this._provider.request('GET', 'user/viewUsers');
      console.log('Usuarios cargados:', users);

      this.dataSource = new MatTableDataSource(users);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    } catch (error) {
      console.error('Error cargando usuarios', error);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    if (this.dataSource) {
      this.dataSource.filter = filterValue.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  mapRol(id: number) {
    const foundRole = this.roles.find((rol: any) => rol.value == id);
    return foundRole ? foundRole.name : `Desconocido`;
  }

  async deleteUser(idusers: string) {
    
    // 1. CONFIRMACIÓN VISUAL
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción. El usuario será eliminado permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Rojo para acción destructiva
      cancelButtonColor: '#0D47A1', // Azul para cancelar
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    // Si el usuario confirma, procedemos
    if (result.isConfirmed) {
      
      // Mostrar spinner de carga
      Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      try {
        const response: any = await this._provider.request('DELETE', 'user/deleteUser', { idusers: idusers });
        
        Swal.close(); // Cerrar loader

        if ((response && !response.error) || response === null) {
          
          // 2. ÉXITO
          await Swal.fire({
            title: '¡Eliminado!',
            text: 'El usuario ha sido eliminado correctamente.',
            icon: 'success',
            confirmButtonColor: '#0D47A1'
          });
          
          this.loadUsers(); // Recargar tabla

        } else {
          // 3. ERROR DEL SERVIDOR
          Swal.fire({
            title: 'Error',
            text: response?.msg || 'No se pudo eliminar el usuario.',
            icon: 'error',
            confirmButtonColor: '#d33'
          });
        }

      } catch (error) {
        // 4. ERROR DE CONEXIÓN
        console.error(error);
        Swal.fire({
          title: 'Error de conexión',
          text: 'Ocurrió un error al intentar eliminar.',
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      }
    }
  }
}