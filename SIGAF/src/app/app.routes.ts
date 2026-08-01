import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login'; // <--- 1. Importamos Login
import { Principal } from './pages/principal/principal';
import { VentasComponent } from './pages/ventas/ventas';
import { CotizacionComponent } from './pages/cotizacion/cotizacion';
import { Inventario } from './pages/inventario/inventario';
import { Reportes } from './pages/reportes/reportes';
import { Empleados } from './pages/empleados/empleados';
import { Clientes } from './pages/clientes/clientes';
import { Configuraciones } from './pages/configuraciones/configuraciones';

export const routes: Routes = [
  { 
    path: '', redirectTo: '/login', pathMatch: 'full' // <--- 2. Cambiamos principal por login
  },
  { 
    path: 'login', component: LoginComponent // <--- 3. Agregamos la ruta del Login
  },
  { 
    path: 'principal', component: Principal 
  },
  { 
    path: 'ventas', component: VentasComponent  
  },
  { 
    path: 'cotizacion', component: CotizacionComponent
  },
  { 
    path: 'inventario', component: Inventario 
  },
  { 
    path: 'reportes', component: Reportes 
  },
  { 
    path: 'empleados', component: Empleados 
  },
  { 
    path: 'configuraciones', component: Configuraciones 
  },
  {
    path: 'clientes', component: Clientes
  },
  {
    path: '**', redirectTo: '/login' // Opcional: Si escriben una ruta que no existe, los manda al login
  }
];