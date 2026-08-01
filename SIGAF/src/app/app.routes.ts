import { Routes } from '@angular/router';
import { Principal} from './pages/principal/principal';
import { VentasComponent} from './pages/ventas/ventas';
import { Cotizacion } from './pages/cotizacion/cotizacion';
import { Inventario } from './pages/inventario/inventario';
import { Reportes } from './pages/reportes/reportes';
import { Empleados } from './pages/empleados/empleados';
import { Clientes } from './pages/clientes/clientes';
import { Configuraciones } from './pages/configuraciones/configuraciones';



export const routes: Routes = [
  {
     path: '', redirectTo: '/principal', pathMatch: 'full' 
  },
  { 
    path: 'principal', component: Principal 
  },
  { 
    path: 'ventas', component: VentasComponent  
  },
  { 
    path: 'cotizacion', component: Cotizacion 
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
  }

];
