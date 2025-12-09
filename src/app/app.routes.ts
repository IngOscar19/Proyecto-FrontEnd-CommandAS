import { Routes } from '@angular/router';

// Componentes Públicos
import { SignInComponent } from './public/auth/sign-in/sign-in.component';
import { SignUpComponent } from './public/auth/sign-up/sign-up.component';

// Componentes Privados (Admin/Staff)
import { PrivateComponent } from './private/private.component';
import { ChefOrderViewComponent } from './private/chef-order-view/chef-order-view.component';
import { MenuComponent } from './private/menu/menu.component';
import { OrderViewComponent } from './private/order-view/order-view.component';
import { OrdersViewComponent } from './private/orders-view/orders-view.component';
import { DashAdminComponent } from './private/dash-admin/dash-admin.component';
import { UserViewComponent } from './private/user-view/user-view.component';
import { UserComponent } from './private/user/user.component';
import { ClientOrdersComponent } from './private/client-views/client-orders/client-orders.component';
import { ProfileComponent } from './private/client-views/profile/profile.component'; 
import { ClientComponent } from './private/client-views/client.component';
import {ClientStatsComponent} from './private/client-views/client-stats/client-stats.component';
import {ClientFavoritesComponent} from './private/client-views/client-favorites/client-favorites.component'

export const routes: Routes = [
  
  // --- AUTENTICACIÓN ---
  {
    path: 'auth/sign-in',
    component: SignInComponent,
  },
  {
    path: 'auth/sign-up',        
    component: SignUpComponent,
  },
  {
    path: '',
    redirectTo: 'auth/sign-in',
    pathMatch: 'prefix',
  },

  // --- RUTAS DEL CLIENTE (CON SIDEBAR) ---
  {
    path: 'client',
    component: ClientComponent, // ✅ AQUÍ CARGAMOS EL NAVBAR/SIDEBAR
    children: [
      {
        path: '',
        redirectTo: 'menu',
        pathMatch: 'full'
      },
      {
        path: 'orders', 
        component: ClientOrdersComponent 
      },
      {
        path: 'menu', 
        component: MenuComponent 
      },
      {
        path: 'profile', 
        component: ProfileComponent
      },
      { path: 'stats',
         component: ClientStatsComponent 
      },
      { path: 'favorites', component: ClientFavoritesComponent },
    ]
  },

  // --- RUTAS DE ADMINISTRADOR ---
  {
    path: 'private',
    component: PrivateComponent, 
    children: [
      {
        path: 'chef-order-view',
        component: ChefOrderViewComponent,
      },
      {
        path: 'menu',
        component: MenuComponent,
      },
      {
        path: 'order-view',
        component: OrderViewComponent,
      },
      {
        path: 'orders-view',
        component: OrdersViewComponent,
      },
      {
        path: 'dash-admin',
        component: DashAdminComponent,
      },
      {
        path: 'user-view',
        component: UserViewComponent,
      },
      {
        path: 'user-create',
        component: UserComponent,
      },
      {
        path: 'user-edit/:id',
        component: UserComponent,
      },
    ],
  },
];