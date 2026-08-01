import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Material {
  id: number;
  descripcion: string;
  precioUnitario: number;
  unidad: string;
  stockActual: number;
}

interface ItemVenta {
  id: number;
  descripcion: string;
  precioUnitario: number;
  cantidad: number;
  unidad: string;
  importe: number;
}

interface Venta {
  id: number;
  fecha: string;
  folio: string;
  cliente: string;
  descripcionVenta: string;
  tipoComprobante: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'Confirmada' | 'Pendiente';
  materiales?: ItemVenta[];
  rfc?: string;
  razonSocial?: string;
  regimenFiscal?: string;
  observaciones?: string;
}

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
  // ==========================================================================
  // 1. PROPIEDADES DE FILTRADO Y BÚSQUEDA
  // ==========================================================================
  terminoBusquedaGlobal: string = '';
  filtroPeriodo: string = '';
  filtroEstado: string = '';
  fechaInicioFiltro: string = '';
  fechaFinFiltro: string = '';

  // ==========================================================================
  // 2. COLECCIONES DE DATOS PRINCIPALES
  // ==========================================================================
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  ventasPendientesFacturar: any[] = [];

  // ==========================================================================
  // 3. ESTADOS DE CONTROL DE MODALES (VISIBILIDAD)
  // ==========================================================================
  isModalVentaOpen: boolean = false;
  isModalFacturaOpen: boolean = false;
  isModalDetalleOpen: boolean = false;
  isConfirmDeleteOpen: boolean = false;

  // ==========================================================================
  // 4. OBJETOS SELECCIONADOS / AUXILIARES
  // ==========================================================================
  ventaSeleccionadaDetalle: Venta | null = null;
  ventaAEliminar: Venta | null = null;

  // ==========================================================================
  // 5. ESTRUCTURAS DE FORMULARIOS
  // ==========================================================================
  nuevaVenta: any = {
    esVentaGrande: false,
    tipoComprobante: 'TICKET',
    clienteNombre: '',
    clienteSeleccionadoId: null,
    clienteRfc: '',
    descripcionVenta: '',
    materiales: [],
    aplicarIva: false,
    estado: 'CONFIRMADA',
    subtotal: 0,
    iva: 0,
    total: 0
  };

  nuevaFactura: any = {
    ventaId: null,
    montoVenta: 0,
    clienteId: null,
    clienteRFC: '',
    clienteRazonSocial: '',
    folio: ''
  };

  // ==========================================================================
  // 6. BUSCADOR Y PICKER DE MATERIALES
  // ==========================================================================
  terminoBusquedaMaterial: string = '';
  sugerenciasMateriales: Material[] = [];
  materialSeleccionadoId: number | null = null;
  stockDisponible: number = 0;
  unidadMedidaSeleccionada: string = '';
  cantidadMaterial: number | null = null;
  precioUnitarioSeleccionado: number = 0;
  descripcionMaterialSeleccionado: string = '';

  // ==========================================================================
  // 7. CATÁLOGOS SIMULADOS DE SOPORTE
  // ==========================================================================
  catalogoClientes = [
    { id: 1, razonSocial: 'Multiservicios Dimas Férreos S.A.', rfc: 'MDF260412AA1' },
    { id: 2, razonSocial: 'Constructora del Golfo', rfc: 'CGO881005HB3' }
  ];

  catalogoMateriales: Material[] = [
    { id: 101, descripcion: 'Varilla Corrugada 3/8 Pza', precioUnitario: 145.00, unidad: 'Pzas', stockActual: 150 },
    { id: 102, descripcion: 'Clavo de Acero 2 pulgadas kg', precioUnitario: 45.50, unidad: 'Kgs', stockActual: 2 },
    { id: 103, descripcion: 'Cemento Gris Tolteca 50kg', precioUnitario: 260.00, unidad: 'Bultos', stockActual: 40 },
    { id: 104, descripcion: 'Malla Electrosoldada 6x6 Rda', precioUnitario: 1250.00, unidad: 'Rollos', stockActual: 8 }
  ];

  // ==========================================================================
  // 8. CICLO DE VIDA E INICIALIZACIÓN
  // ==========================================================================
  ngOnInit(): void {
    this.ventas = [
      {
        id: 1,
        fecha: new Date().toISOString().split('T')[0],
        folio: 'V-0001',
        cliente: 'Público General',
        descripcionVenta: 'Suministro inmediato de cemento para obra negra',
        tipoComprobante: 'TICKET',
        subtotal: 1040,
        iva: 0,
        total: 1040,
        estado: 'Confirmada',
        materiales: [{ id: 1, descripcion: 'Cemento Gris Tolteca 50kg', precioUnitario: 260, cantidad: 4, unidad: 'Bultos', importe: 1040 }]
      },
      {
        id: 2,
        fecha: '2026-07-15',
        folio: 'V-0002',
        cliente: 'Constructora del Golfo',
        descripcionVenta: 'Pedido remante de varillas estructurales de 3/8',
        tipoComprobante: 'FACTURA',
        subtotal: 14500,
        iva: 2320,
        total: 16820,
        estado: 'Confirmada',
        materiales: [{ id: 2, descripcion: 'Varilla Corrugada 3/8 Pza', precioUnitario: 145, cantidad: 100, unidad: 'Pzas', importe: 14500 }]
      },
      {
        id: 3,
        fecha: '2026-01-10',
        folio: 'V-0003',
        cliente: 'Multiservicios Dimas Férreos S.A.',
        descripcionVenta: 'Dotación de clavos y fijaciones para mantenimiento industrial',
        tipoComprobante: 'NOTA_VENTA',
        subtotal: 91,
        iva: 0,
        total: 91,
        estado: 'Pendiente',
        materiales: [{ id: 3, descripcion: 'Clavo de Acero 2 pulgadas kg', precioUnitario: 45.5, cantidad: 2, unidad: 'Kgs', importe: 91 }]
      }
    ];

    this.ventasPendientesFacturar = [
      { id: 3, fecha: '2026-01-10', total: 91 }
    ];

    this.filtrarVentas();
  }

  // ==========================================================================
  // 9. LÓGICA DE FILTRADO DE DATOS
  // ==========================================================================
  filtrarVentas(): void {
    const hoyStr = new Date().toISOString().split('T')[0];
    const fechaHoy = new Date(hoyStr);

    this.ventasFiltradas = this.ventas.filter(venta => {
      const matchesSearch = 
        venta.folio.toLowerCase().includes(this.terminoBusquedaGlobal.toLowerCase()) ||
        venta.descripcionVenta.toLowerCase().includes(this.terminoBusquedaGlobal.toLowerCase()) ||
        venta.cliente.toLowerCase().includes(this.terminoBusquedaGlobal.toLowerCase()) ||
        venta.tipoComprobante.toLowerCase().includes(this.terminoBusquedaGlobal.toLowerCase());

      let matchesEstado = true;
      if (this.filtroEstado) {
        matchesEstado = (venta.estado.toLowerCase() === this.filtroEstado.toLowerCase());
      }

      let matchesPeriodo = true;
      const fechaVenta = new Date(venta.fecha);

      if (this.filtroPeriodo === 'hoy') {
        matchesPeriodo = (venta.fecha === hoyStr);
      } else if (this.filtroPeriodo === 'mes') {
        matchesPeriodo = (fechaVenta.getFullYear() === fechaHoy.getFullYear() && fechaVenta.getMonth() === fechaHoy.getMonth());
      } else if (this.filtroPeriodo === 'anio') {
        matchesPeriodo = (fechaVenta.getFullYear() === fechaHoy.getFullYear());
      }

      let matchesRangoFechas = true;
      if (this.fechaInicioFiltro) {
        matchesRangoFechas = matchesRangoFechas && (venta.fecha >= this.fechaInicioFiltro);
      }
      if (this.fechaFinFiltro) {
        matchesRangoFechas = matchesRangoFechas && (venta.fecha <= this.fechaFinFiltro);
      }

      return matchesSearch && matchesEstado && matchesPeriodo && matchesRangoFechas;
    });
  }

  // ==========================================================================
  // 10. GESTIÓN DE APERTURA / CIERRE DE MODALES
  // ==========================================================================
  abrirModalVenta() { this.isModalVentaOpen = true; }
  cerrarModalVenta() { this.isModalVentaOpen = false; this.resetFormVenta(); }

  abrirModalFactura() { this.isModalFacturaOpen = true; }
  cerrarModalFactura() { this.isModalFacturaOpen = false; }

  verDetalleVenta(venta: Venta) {
    this.ventaSeleccionadaDetalle = venta;
    this.isModalDetalleOpen = true;
  }
  cerrarModalDetalle() { this.isModalDetalleOpen = false; this.ventaSeleccionadaDetalle = null; }

  solicitarConfirmacionEliminar(venta: Venta) {
    this.ventaAEliminar = venta;
    this.isConfirmDeleteOpen = true;
  }
  cancelarEliminacion() { this.isConfirmDeleteOpen = false; this.ventaAEliminar = null; }
  
  confirmarEliminacion() {
    if (this.ventaAEliminar) {
      this.ventas = this.ventas.filter(v => v.id !== this.ventaAEliminar!.id);
      this.filtrarVentas();
      this.cancelarEliminacion();
    }
  }

  cerrarModalDesdeAfuera(event: MouseEvent, tipo: string) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      if (tipo === 'venta') this.cerrarModalVenta();
      if (tipo === 'factura') this.cerrarModalFactura();
    }
  }

  // ==========================================================================
  // 11. PROCESOS DEL CARRO DE VENTAS Y MATERIALES
  // ==========================================================================
  filtrarMateriales() {
    if (!this.terminoBusquedaMaterial.trim()) {
      this.sugerenciasMateriales = [];
      return;
    }
    this.sugerenciasMateriales = this.catalogoMateriales.filter(m =>
      m.descripcion.toLowerCase().includes(this.terminoBusquedaMaterial.toLowerCase())
    );
  }

  seleccionarMaterialSugerido(material: Material) {
    this.materialSeleccionadoId = material.id;
    this.descripcionMaterialSeleccionado = material.descripcion;
    this.precioUnitarioSeleccionado = material.precioUnitario;
    this.stockDisponible = material.stockActual;
    this.unidadMedidaSeleccionada = material.unidad;
    this.terminoBusquedaMaterial = material.descripcion;
    this.sugerenciasMateriales = [];
  }

  agregarMaterial() {
    if (!this.materialSeleccionadoId || !this.cantidadMaterial || this.cantidadMaterial <= 0) return;
    
    if (this.cantidadMaterial > this.stockDisponible) {
      this.terminoBusquedaMaterial = "⚠️ ¡Error: Cantidad excede el stock!";
      return;
    }

    const importeCalculado = this.precioUnitarioSeleccionado * this.cantidadMaterial;

    this.nuevaVenta.materiales.push({
      id: this.materialSeleccionadoId,
      descripcion: this.descripcionMaterialSeleccionado,
      precioUnitario: this.precioUnitarioSeleccionado,
      cantidad: this.cantidadMaterial,
      unidad: this.unidadMedidaSeleccionada,
      importe: importeCalculado
    });

    this.calcularTotalesVenta();
    
    this.materialSeleccionadoId = null;
    this.terminoBusquedaMaterial = '';
    this.cantidadMaterial = null;
    this.stockDisponible = 0;
  }

  removerMaterial(index: number) {
    this.nuevaVenta.materiales.splice(index, 1);
    this.calcularTotalesVenta();
  }

  calcularTotalesVenta() {
    const subtotal = this.nuevaVenta.materiales.reduce((acc: number, item: any) => acc + item.importe, 0);
    const iva = this.nuevaVenta.aplicarIva ? subtotal * 0.16 : 0;
    this.nuevaVenta.subtotal = subtotal;
    this.nuevaVenta.iva = iva;
    this.nuevaVenta.total = subtotal + iva;
  }

  actualizarClienteCorporativo() {
    const cliente = this.catalogoClientes.find(c => c.id === this.nuevaVenta.clienteSeleccionadoId);
    if (cliente) {
      this.nuevaVenta.clienteRfc = cliente.rfc;
      this.nuevaVenta.clienteNombre = cliente.razonSocial;
    }
  }

  // ==========================================================================
  // 12. PERSISTENCIA EN MEMORIA Y MÉTODOS DE SALIDA
  // ==========================================================================
  guardarVenta(event: Event) {
    event.preventDefault();
    if (this.nuevaVenta.materiales.length === 0) return;

    const consecutivo = this.ventas.length + 1;
    const nuevoRegistro: Venta = {
      id: consecutivo,
      fecha: new Date().toISOString().split('T')[0],
      folio: `V-000${consecutivo}`,
      cliente: this.nuevaVenta.clienteNombre || 'Público General',
      descripcionVenta: this.nuevaVenta.descripcionVenta || 'Venta general de insumos cargados.',
      tipoComprobante: this.nuevaVenta.tipoComprobante,
      subtotal: this.nuevaVenta.subtotal,
      iva: this.nuevaVenta.iva,
      total: this.nuevaVenta.total,
      estado: this.nuevaVenta.estado === 'CONFIRMADA' ? 'Confirmada' : 'Pendiente',
      materiales: [...this.nuevaVenta.materiales]
    };

    this.ventas.unshift(nuevoRegistro);
    this.filtrarVentas();
    this.cerrarModalVenta();
  }

  cargarDatosVentaSeleccionada() {
    const v = this.ventas.find(x => x.id === this.nuevaFactura.ventaId);
    if (v) this.nuevaFactura.montoVenta = v.total;
  }

  actualizarDatosFiscalesCliente() {
    const c = this.catalogoClientes.find(x => x.id === this.nuevaFactura.clienteId);
    if (c) {
      this.nuevaFactura.clienteRFC = c.rfc;
      this.nuevaFactura.clienteRazonSocial = c.razonSocial;
    }
  }

  guardarFactura(event: Event) {
    event.preventDefault();
    this.cerrarModalFactura();
  }

  descargarArchivoVenta(venta: Venta) { 
    console.log(`Iniciando descarga binaria para folio: ${venta.folio}`); 
  }

  descargarDesdeDetalle() { 
    if (this.ventaSeleccionadaDetalle) this.descargarArchivoVenta(this.ventaSeleccionadaDetalle); 
  }

  resetFormVenta() {
    this.nuevaVenta = { 
      esVentaGrande: false, 
      tipoComprobante: 'TICKET', 
      clienteNombre: '', 
      clienteSeleccionadoId: null, 
      clienteRfc: '', 
      descripcionVenta: '', 
      materiales: [], 
      aplicarIva: false, 
      estado: 'CONFIRMADA', 
      subtotal: 0, 
      iva: 0, 
      total: 0 
    };
  }
}