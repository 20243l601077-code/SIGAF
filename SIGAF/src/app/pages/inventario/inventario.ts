import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ItemInventario {
  id: string;
  codigo: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  minima: number;
  precioUnitario: number;
  provider: string;
  estado: 'Disponible' | 'Bajo Stock' | 'Agotado';
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css']
})
export class InventarioComponent implements OnInit {
  
  // Modales
  isModalOpen: boolean = false;
  isDetailsModalOpen: boolean = false;
  isAddStockModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;

  selectedItem: ItemInventario | null = null;

  // Variables del buscador dinámico de la tabla
  filterText: string = '';
  filterCategory: string = '';
  filterStatus: string = '';

  // Variable para buscar insumo por código en el modal global de reabastecimiento
  buscarCodigo: string = '';

  // Modelos de formularios
  nuevoItem: any = {
    description: '',
    category: '',
    unit: '',
    quantity: null,
    minima: 5,
    precioUnitario: null,
    provider: ''
  };

  reabastecimiento: any = {
    cantidadNueva: null,
    precioAdquisicion: null
  };

  // Catálogo maestro original
  inventarioList: ItemInventario[] = [
    {
      id: '1',
      codigo: '#01234',
      description: 'Riel de acero reforzado de 12m',
      category: 'materiales',
      unit: 'Pza',
      quantity: 45,
      minima: 10,
      precioUnitario: 1250.00,
      provider: 'Aceros de Veracruz S.A.',
      estado: 'Disponible'
    },
    {
      id: '2',
      codigo: '#01235',
      description: 'Pernos de anclaje de alta presión',
      category: 'herramientas',
      unit: 'Caja',
      quantity: 4,
      minima: 15,
      precioUnitario: 85.50,
      provider: 'Ferretería Industrial Orizaba',
      estado: 'Bajo Stock'
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  // BUSCADOR DINÁMICO
  get filteredInventario(): ItemInventario[] {
    return this.inventarioList.filter(item => {
      const matchesText = !this.filterText ? true :
        item.description.toLowerCase().includes(this.filterText.toLowerCase()) ||
        item.codigo.toLowerCase().includes(this.filterText.toLowerCase()) ||
        item.provider.toLowerCase().includes(this.filterText.toLowerCase());

      const matchesCategory = !this.filterCategory ? true :
        item.category.toLowerCase() === this.filterCategory.toLowerCase();

      const matchesStatus = !this.filterStatus ? true :
        item.estado.toLowerCase() === this.filterStatus.toLowerCase();

      return matchesText && matchesCategory && matchesStatus;
    });
  }

  // Retorna el insumo encontrado dinámicamente según el código ingresado en el modal de stock
  get insumoEncontradoPorCodigo(): ItemInventario | null {
    if (!this.buscarCodigo) return null;
    return this.inventarioList.find(item => item.codigo.trim().toLowerCase() === this.buscarCodigo.trim().toLowerCase()) || null;
  }

  limpiarFiltros(): void {
    this.filterText = '';
    this.filterCategory = '';
    this.filterStatus = '';
  }

  // --- MODAL 1: REGISTRAR ELEMENTO NUEVO ---
  abrirModal(): void { this.isModalOpen = true; }
  cerrarModal(): void { this.isModalOpen = false; this.resetFormulario(); }

  onCategoryChange(): void {
  if (this.nuevoItem.category === 'materiales') {
    this.nuevoItem.unit = ''; // Se limpia para elegir m, kg, pza, etc.
  } else {
    this.nuevoItem.unit = 'Pza';
    // Si ya hay una cantidad ingresada, la redondeamos hacia abajo
    if (this.nuevoItem.quantity) {
      this.nuevoItem.quantity = Math.floor(this.nuevoItem.quantity);
    }
    if (this.nuevoItem.minima) {
      this.nuevoItem.minima = Math.floor(this.nuevoItem.minima);
    }
  }
}

  guardarInventario(event: Event): void {
  event.preventDefault();

  if (!this.nuevoItem.description || this.nuevoItem.quantity <= 0 || this.nuevoItem.precioUnitario <= 0 || this.nuevoItem.minima <= 0) {
    return;
  }

  // RESTRICCIÓN: Si NO es material (es herramienta o repuesto), no permite decimales
  if (this.nuevoItem.category !== 'materiales') {
    if (!Number.isInteger(this.nuevoItem.quantity) || !Number.isInteger(this.nuevoItem.minima)) {
      alert('Las herramientas y repuestos deben registrarse en cantidades enteras.');
      return; 
    }
  }

   const nuevoCodigoInt = 1234 + this.inventarioList.length + 1;
  const codigoFormateado = `#0${nuevoCodigoInt}`;

  const itemAInsertar: ItemInventario = {
    id: (this.inventarioList.length + 1).toString(),
    codigo: codigoFormateado,
    description: this.nuevoItem.description,
    category: this.nuevoItem.category,
    unit: this.nuevoItem.unit || 'Pza',
    quantity: this.nuevoItem.quantity,
    minima: this.nuevoItem.minima,
    precioUnitario: this.nuevoItem.precioUnitario,
    provider: this.nuevoItem.provider,
    estado: this.calcularEstado(this.nuevoItem.quantity, this.nuevoItem.minima)
  };

    this.inventarioList.push(itemAInsertar);
  this.cerrarModal();
}

  // --- MODAL 2: DETALLES DEL MATERIAL ---
  abrirDetailsModal(item: ItemInventario): void {
    this.selectedItem = item;
    this.isDetailsModalOpen = true;
  }
  cerrarDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedItem = null;
  }

 // --- MODAL 3: REABASTECIMIENTO DE STOCK GLOBAL CON BÚSQUEDA INTERNA ---
abrirAddStockModalGlobal(): void {
  this.buscarCodigo = '';
  this.reabastecimiento = { 
    cantidadNueva: null, 
    precioAdquisicion: null 
  };
  this.isAddStockModalOpen = true; // <-- Cambia a true para activar la clase 'is-visible' en el HTML
}

cerrarAddStockModal(): void {
  this.isAddStockModalOpen = false;
  this.buscarCodigo = '';
  this.reabastecimiento = { cantidadNueva: null, precioAdquisicion: null };
}
  
 procesarMasStock(event: Event): void {
  event.preventDefault();
  const itemAIncrementar = this.insumoEncontradoPorCodigo;

  if (itemAIncrementar && this.reabastecimiento.cantidadNueva > 0) {
    // RESTRICCIÓN EN REABASTECIMIENTO: Evita fracciones en herramientas y repuestos
    if (itemAIncrementar.category !== 'materiales' && !Number.isInteger(this.reabastecimiento.cantidadNueva)) {
      alert('No se pueden reabastecer fracciones de herramientas o repuestos.');
      return;
    }

    itemAIncrementar.quantity += this.reabastecimiento.cantidadNueva;
    
    if (this.reabastecimiento.precioAdquisicion > 0) {
      itemAIncrementar.precioUnitario = this.reabastecimiento.precioAdquisicion;
    }
    itemAIncrementar.estado = this.calcularEstado(itemAIncrementar.quantity, itemAIncrementar.minima);
    this.cerrarAddStockModal();
  }
}

  // --- MODAL 4: CONFIRMACIÓN DE ELIMINACIÓN ---
  abrirDeleteModal(item: ItemInventario): void {
    this.selectedItem = item;
    this.isDeleteModalOpen = true;
  }
  cerrarDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedItem = null;
  }
  
  confirmarEliminar(): void {
    if (this.selectedItem) {
      this.inventarioList = this.inventarioList.filter(i => i.id !== this.selectedItem!.id);
    }
    this.cerrarDeleteModal();
  }

  private calcularEstado(cant: number, min: number): 'Disponible' | 'Bajo Stock' | 'Agotado' {
    if (cant === 0) return 'Agotado';
    if (cant <= min) return 'Bajo Stock';
    return 'Disponible';
  }

  resetFormulario(): void {
    this.nuevoItem = { description: '', category: '', unit: '', quantity: null, minima: 5, precioUnitario: null, provider: '' };
  }

  cerrarModalesDesdeAfuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.isModalOpen = false;
      this.isDetailsModalOpen = false;
      this.isAddStockModalOpen = false;
      this.isDeleteModalOpen = false;
      this.resetFormulario();
    }
  }
}