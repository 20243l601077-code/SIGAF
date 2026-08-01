import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ItemInventario {
  description: string;
  category: string;
  unit: string;
  quantity: number | null;
  provider: string;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario {
  isModalOpen: boolean = false;

  nuevoItem: ItemInventario = {
    description: '',
    category: '',
    unit: '',
    quantity: null,
    provider: ''
  };

  abrirModal(): void {
    this.isModalOpen = true;
  }

  cerrarModal(): void {
    this.isModalOpen = false;
    this.resetFormulario();
  }

  cerrarModalDesdeAfuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target && target.classList.contains('modal-overlay')) {
      this.cerrarModal();
    }
  }

  /**
   * Controla el cambio de categoría para gestionar la unidad por defecto
   */
  onCategoryChange(): void {
    if (this.nuevoItem.category === 'materiales') {
      this.nuevoItem.unit = 'pza'; 
    } else {
      this.nuevoItem.unit = 'pza'; 
    }
  }

  /**
   * Ejecuta las validaciones del campo cantidad al presionar teclas
   */
  validarTecladoCantidad(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (this.nuevoItem.category !== 'materiales' && (event.key === '.' || event.key === ',')) {
      event.preventDefault();
    }
  }

  /**
   * Procesa la inserción del elemento una vez que Angular habilita el botón de guardado
   */
  guardarInventario(event: Event): void {
    event.preventDefault();

    const cant = this.nuevoItem.quantity;

    // Resguardo lógico de nulidad por seguridad
    if (cant === null || cant === undefined) return;

    // 1. Validación de cantidad: No permitir 0 ni números negativos
    if (cant <= 0) {
      alert('La cantidad debe ser un número mayor a 0.');
      return;
    }

    // 2. Validación de enteros: Si es herramientas o repuestos, no permitir decimales
    if (this.nuevoItem.category !== 'materiales') {
      if (!Number.isInteger(cant)) {
        alert('Para herramientas o repuestos no se permiten cantidades decimales. Deben ser unidades enteras.');
        return;
      }
    }

    // Asegurar consistencia final del objeto si no es materiales antes de enviar
    if (this.nuevoItem.category !== 'materiales') {
      this.nuevoItem.unit = 'pza';
    }

    console.log("Datos validados correctamente. Listos para enviar a Node/PostgreSQL:", this.nuevoItem);
    this.cerrarModal();
  }

  private resetFormulario(): void {
    this.nuevoItem = {
      description: '',
      category: '',
      unit: '',
      quantity: null,
      provider: ''
    };
  }
}