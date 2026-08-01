import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MetricCard {
  label: string;
  value: string;
  type: 'default' | 'positive' | 'info';
}

interface ReportRow {
  folio: string;
  fecha: string;
  tipo: string;
  cliente: string;
  estado: string;
  monto: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class Reportes implements OnInit {
  
  // Filtros dinámicos vinculados al HTML mediante ngModel
  fechaInicio: string = '';
  fechaFin: string = '';
  tipoReporte: string = 'general';
  
  // Campos de metadatos históricos inalterables (Bloqueados en la vista)
  idHistorialFijo: string = 'REP-2026-X92';
  ejercicioFiscal: string = '2026';

  // Control de estados de carga (Bloqueo unificado de botones)
  cargandoReporte: boolean = false;
  exportandoData: boolean = false;

  // Estructura de tarjetas analíticas (KPIs)
  metrics: MetricCard[] = [
    { label: 'Total Facturado', value: '$345,200.00', type: 'positive' },
    { label: 'Cotizaciones Activas', value: '42', type: 'info' },
    { label: 'Reportes Descargados', value: '18', type: 'default' },
    { label: 'Eficiencia de Cierre', value: '88.5%', type: 'positive' }
  ];

  // Datos estructurados de la tabla de analítica
  reportRows: ReportRow[] = [
    { folio: 'COT-0042', fecha: '2026-07-20', tipo: 'Servicios Hidráulicos', cliente: 'Multiservicios Dimas Férreos', estado: 'Completado', monto: 12500.00 },
    { folio: 'COT-0043', fecha: '2026-07-22', tipo: 'Mantenimiento Industrial', cliente: 'Logística Veracruz S.A.', estado: 'Pendiente', monto: 8400.00 },
    { folio: 'COT-0044', fecha: '2026-07-25', tipo: 'Suministro de Materiales', cliente: 'Aceros del Puerto', estado: 'Completado', monto: 45000.00 },
    { folio: 'COT-0045', fecha: '2026-07-28', tipo: 'Consultoría Técnica', cliente: 'Construcciones Olmeca', estado: 'Completado', monto: 18200.00 }
  ];

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaFin = hoy.toISOString().split('T')[0];
  }

  /**
   * Ejecuta el filtrado analítico. Nomenclatura limpia sin tildes para prevenir fallos en el Lexer.
   */
  consultarMetricas(): void {
    this.cargandoReporte = true;
    
    setTimeout(() => {
      this.cargandoReporte = false;
    }, 1200);
  }

  /**
   * Simula la exportación de los balances contables en formatos específicos.
   */
  descargarBalance(formato: 'pdf' | 'excel'): void {
    this.exportandoData = true;
    
    setTimeout(() => {
      this.exportandoData = false;
      console.log(`Reporte generado y descargado en formato: ${formato.toUpperCase()}`);
    }, 2000);
  }
}