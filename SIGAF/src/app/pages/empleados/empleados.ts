import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Empleado {
  nombre: string;
  puesto: string;
  telefono: string;
  correo: string;
  salario: number | null;
}

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './empleados.html',
  styleUrl: './empleados.css',
})
export class Empleados {
  isModalOpen: boolean = false;

  nuevoEmpleado: Empleado = {
    nombre: '',
    puesto: '',
    telefono: '',
    correo: '',
    salario: null
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
   * Bloquea caracteres no numéricos en el campo teléfono
   */
  validarTecladoTelefono(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Procesa la inserción del nuevo empleado una vez habilitado el botón
   */
  guardarEmpleado(event: Event): void {
    event.preventDefault();

    const sal = this.nuevoEmpleado.salario;
    if (sal !== null && sal <= 0) {
      alert('El salario debe ser un monto mayor a 0.');
      return;
    }

    console.log("Empleado validado y listo para persistir en PostgreSQL:", this.nuevoEmpleado);
    this.cerrarModal();
  }

  private resetFormulario(): void {
    this.nuevoEmpleado = {
      nombre: '',
      puesto: '',
      telefono: '',
      correo: '',
      salario: null
    };
  }
}