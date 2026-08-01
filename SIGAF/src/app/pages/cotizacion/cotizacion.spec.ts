import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MaterialCotizado {
  id: number;
  descripcion: string;
  precioUnitario: number;
  cantidad: number;
  unidad: string;
  importe: number;
}

interface Cotizacion {
  id: number;
  fecha: string;
  folio: string;
  descripcion: string;
  clienteNombre?: string;
  clienteRazonSocial?: string;
  clienteSeleccionadoId?: number | null;
  rfc?: string;
  telefono?: string;
  direccion?: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'Aprobada' | 'Pendiente' | 'Vencida';
  fechaVencimiento: string;
  esCorporativo: boolean;
  aplicarIva: boolean;
  materiales: MaterialCotizado[];
}

@Component({
  selector: 'app-cotizacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cotizacion.html',
  styleUrls: ['./cotizacion.css']
})
export class CotizacionComponent implements OnInit {

  // Modales
  isModalCotizacionOpen: boolean = false;
  isModalDetalleOpen: boolean = false;
  isConfirmDeleteOpen: boolean = false;

  cotizacionSeleccionadaDetalle: Cotizacion | null = null;
  cotizacionAEliminar: Cotizacion | null = null;
  fechaActual: string = '';

  // Formulario
  nuevaCotizacion: Omit<Cotizacion, 'id' | 'fecha' | 'folio' | 'iva'> & { id?: number; fecha?: string; folio?: string; iva?: number } = {
    esCorporativo: false,
    clienteNombre: '',
    clienteSeleccionadoId: null,
    rfc: '',
    descripcion: '',
    materiales: [],
    aplicarIva: true,
    estado: 'Pendiente',
    subtotal: 0,
    total: 0,
    fechaVencimiento: ''
  };

  // Buscador e Inventario de Materiales
  terminoBusquedaMaterial: string = '';
  materialSeleccionadoId: number | null = null;
  stockDisponible: number = 0;
  unidadMedidaSeleccionada: string = '';
  precioUnitarioSeleccionado: number = 0;
  descripcionMaterialSeleccionado: string = '';
  cantidadMaterial: number | null = null;

  // Filtros Globales y Búsqueda Dinámica
  terminoBusquedaGlobal: string = '';
  filtroPeriodo: string = '';
  filtroEstado: string = '';
  fechaInicioFiltro: string = '';
  fechaFinFiltro: string = '';

  // Data general de SIGAF
  cotizacionesMaster: Cotizacion[] = [];
  cotizacionesFiltradas: Cotizacion[] = [];
  catalogoClientes: any[] = [];
  inventarioProductosMaster: any[] = [];
  sugerenciasMateriales: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.obtenerFechaActualSistema();
    this.cargarMocksCorporativosSIGAF();
    this.filtrarCotizaciones();
  }

  private obtenerFechaActualSistema(): void {
    const hoy = new Date();
    this.fechaActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }

  abrirModalCotizacion(): void {
    this.isModalCotizacionOpen = true;
    this.resetFormularioNuevaCotizacion();
  }

  cerrarModalCotizacion(): void {
    this.isModalCotizacionOpen = false;
  }

  verDetalleCotizacion(cotizacion: Cotizacion): void {
    this.cotizacionSeleccionadaDetalle = { ...cotizacion };
    this.isModalDetalleOpen = true;
  }

  cerrarModalDetalle(): void {
    this.isModalDetalleOpen = false;
    this.cotizacionSeleccionadaDetalle = null;
  }

  solicitarConfirmacionEliminar(cotizacion: Cotizacion): void {
    this.cotizacionAEliminar = cotizacion;
    this.isConfirmDeleteOpen = true;
  }

  cancelarEliminacion(): void {
    this.isConfirmDeleteOpen = false;
    this.cotizacionAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (this.cotizacionAEliminar) {
      this.cotizacionesMaster = this.cotizacionesMaster.filter(c => c.id !== this.cotizacionAEliminar!.id);
      this.filtrarCotizaciones(); // Actualiza la tabla dinámicamente
    }
    this.isConfirmDeleteOpen = false;
    this.cotizacionAEliminar = null;
  }

  // Lógica de Búsqueda Dinámica y Filtros Simultáneos
  filtrarCotizaciones(): void {
    let listado = [...this.cotizacionesMaster];

    // 1. Filtro por término de búsqueda global (Folio, Descripción, Cliente o Estado)
    if (this.terminoBusquedaGlobal.trim()) {
      const termino = this.terminoBusquedaGlobal.toLowerCase();
      listado = listado.filter(c => {
        const nombreCliente = c.esCorporativo ? (c.clienteRazonSocial || '') : (c.clienteNombre || '');
        return c.folio.toLowerCase().includes(termino) ||
               c.descripcion.toLowerCase().includes(termino) ||
               c.estado.toLowerCase().includes(termino) ||
               nombreCliente.toLowerCase().includes(termino);
      });
    }

    // 2. Filtro por Estado exacto
    if (this.filtroEstado) {
      listado = listado.filter(c => c.estado === this.filtroEstado);
    }

    // 3. Filtro por Rango de Fechas
    if (this.fechaInicioFiltro) {
      listado = listado.filter(c => c.fecha >= this.fechaInicioFiltro);
    }
    if (this.fechaFinFiltro) {
      listado = listado.filter(c => c.fecha <= this.fechaFinFiltro);
    }

    // Asignación directa para refrescar el ciclo de renderizado en el HTML
    this.cotizacionesFiltradas = listado;
  }

  filtrarMateriales(): void {
    if (!this.terminoBusquedaMaterial.trim()) {
      this.sugerenciasMateriales = [];
      return;
    }
    const txt = this.terminoBusquedaMaterial.toLowerCase();
    this.sugerenciasMateriales = this.inventarioProductosMaster.filter(prod => 
      prod.descripcion.toLowerCase().includes(txt)
    );
  }

  seleccionarMaterialSugerido(material: any): void {
    this.materialSeleccionadoId = material.id;
    this.descripcionMaterialSeleccionado = material.descripcion;
    this.precioUnitarioSeleccionado = material.precioUnitario;
    this.stockDisponible = material.stockActual;
    this.unidadMedidaSeleccionada = material.unidad;
    this.terminoBusquedaMaterial = material.descripcion;
    this.sugerenciasMateriales = [];
  }

  agregarMaterial(): void {
    if (!this.materialSeleccionadoId || !this.cantidadMaterial || this.cantidadMaterial <= 0) {
      alert('Debe seleccionar un producto válido del catálogo e indicar una cantidad real.');
      return;
    }

    const importeCalculado = this.precioUnitarioSeleccionado * this.cantidadMaterial;

    this.nuevaCotizacion.materiales.push({
      id: this.materialSeleccionadoId,
      descripcion: this.descripcionMaterialSeleccionado,
      precioUnitario: this.precioUnitarioSeleccionado,
      cantidad: this.cantidadMaterial,
      unidad: this.unidadMedidaSeleccionada,
      importe: importeCalculado
    });

    this.calcularTotalesCotizacion();
    this.terminoBusquedaMaterial = '';
    this.materialSeleccionadoId = null;
    this.stockDisponible = 0;
    this.cantidadMaterial = null;
  }

  removerMaterial(index: number): void {
    this.nuevaCotizacion.materiales.splice(index, 1);
    this.calcularTotalesCotizacion();
  }

  calcularTotalesCotizacion(): void {
    const subtotalBruto = this.nuevaCotizacion.materiales.reduce((acc, item) => acc + item.importe, 0);
    this.nuevaCotizacion.subtotal = subtotalBruto;
    this.nuevaCotizacion.total = this.nuevaCotizacion.aplicarIva ? (subtotalBruto * 1.16) : subtotalBruto;
  }

  actualizarClienteCorporativo(): void {
    const empresa = this.catalogoClientes.find(c => c.id === this.nuevaCotizacion.clienteSeleccionadoId);
    if (empresa) this.nuevaCotizacion.rfc = empresa.rfc;
  }

  guardarCotizacion(event: Event): void {
    event.preventDefault();

    if (this.nuevaCotizacion.fechaVencimiento && this.nuevaCotizacion.fechaVencimiento < this.fechaActual) {
      alert('Error de Consistencia: La fecha límite de la cotización no puede ser menor al día de hoy.');
      return;
    }

    if (this.nuevaCotizacion.materiales.length === 0) {
      alert('Imposible procesar: La cotización debe contar con al menos un ítem agregado.');
      return;
    }

    let clienteFinal = this.nuevaCotizacion.clienteNombre || 'Público en General';
    let rfcFinal = this.nuevaCotizacion.rfc || '';
    let dirFinal = '';
    let telFinal = '';

    if (this.nuevaCotizacion.esCorporativo) {
      const cmp = this.catalogoClientes.find(c => c.id === this.nuevaCotizacion.clienteSeleccionadoId);
      if (cmp) {
        clienteFinal = cmp.razonSocial;
        rfcFinal = cmp.rfc;
        dirFinal = cmp.direccion;
        telFinal = cmp.telefono;
      }
    }

    const sub = this.nuevaCotizacion.subtotal;

    const nuevaCotizacionCompleta: Cotizacion = {
      id: Date.now(),
      fecha: this.fechaActual,
      folio: `COT-${String(this.cotizacionesMaster.length + 1).padStart(4, '0')}`,
      descripcion: this.nuevaCotizacion.descripcion || 'Sin observaciones.',
      clienteNombre: !this.nuevaCotizacion.esCorporativo ? clienteFinal : undefined,
      clienteRazonSocial: this.nuevaCotizacion.esCorporativo ? clienteFinal : undefined,
      clienteSeleccionadoId: this.nuevaCotizacion.clienteSeleccionadoId,
      rfc: rfcFinal,
      direccion: dirFinal,
      telefono: telFinal,
      subtotal: sub,
      iva: this.nuevaCotizacion.aplicarIva ? (sub * 0.16) : 0,
      total: this.nuevaCotizacion.total,
      estado: this.nuevaCotizacion.estado as 'Aprobada' | 'Pendiente' | 'Vencida',
      fechaVencimiento: this.nuevaCotizacion.fechaVencimiento,
      esCorporativo: this.nuevaCotizacion.esCorporativo,
      aplicarIva: this.nuevaCotizacion.aplicarIva,
      materiales: [...this.nuevaCotizacion.materiales]
    };

    // Agregar al inicio del arreglo maestro
    this.cotizacionesMaster.unshift(nuevaCotizacionCompleta);
    
    // Forzar redibujado aplicando búsquedas vigentes
    this.filtrarCotizaciones();
    this.cerrarModalCotizacion();
  }

  descargarArchivoCotizacion(cot: Cotizacion): void {
    console.log(`Exportando reporte PDF nativo para el folio: ${cot.folio}`);
  }

  descargarDesdeDetalle(): void {
    if (this.cotizacionSeleccionadaDetalle) {
      this.descargarArchivoCotizacion(this.cotizacionSeleccionadaDetalle);
    }
  }

  private resetFormularioNuevaCotizacion(): void {
    this.nuevaCotizacion = {
      esCorporativo: false,
      clienteNombre: '',
      clienteSeleccionadoId: null,
      rfc: '',
      descripcion: '',
      materiales: [],
      aplicarIva: true,
      estado: 'Pendiente',
      subtotal: 0,
      total: 0,
      fechaVencimiento: this.fechaActual
    };
    this.terminoBusquedaMaterial = '';
    this.materialSeleccionadoId = null;
  }

  private cargarMocksCorporativosSIGAF(): void {
    this.catalogoClientes = [
      { id: 101, razonSocial: 'Multiservicios Dimas Férreos S.A. de C.V.', rfc: 'MDF160428AA1', direccion: 'Av. Industrial N° 405', telefono: '271-714-2030' }
    ];
    this.inventarioProductosMaster = [
      { id: 1, descripcion: 'Vigueta de Acero Estructural H-100 (6m)', precioUnitario: 1250, stockActual: 45, unidad: 'Pzas' },
      { id: 2, descripcion: 'Perfil Tubular Galvanizado Z-200 Calibre 14', precioUnitario: 420, stockActual: 120, unidad: 'Tramos' }
    ];
    this.cotizacionesMaster = [
      {
        id: 1,
        fecha: '2026-08-01',
        folio: 'COT-0001',
        descripcion: 'Suministro inicial de perfiles tubulares para bodegas norte.',
        clienteRazonSocial: 'Multiservicios Dimas Férreos S.A. de C.V.',
        subtotal: 8400, iva: 1344, total: 9744,
        estado: 'Aprobada', fechaVencimiento: '2026-08-15',
        esCorporativo: true, aplicarIva: true,
        materiales: [{ id: 2, descripcion: 'Perfil Tubular Galvanizado Z-200 Calibre 14', precioUnitario: 420, cantidad: 20, unidad: 'Tramos', importe: 8400 }]
      }
    ];
  }
}