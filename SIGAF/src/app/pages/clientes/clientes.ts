import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Cliente {
  razonSocial: string;
  rfc: string;
  telefono: string;
  correo: string;
  direccion: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes {
  isModalOpen: boolean = false;

  nuevoCliente: Cliente = {
    razonSocial: '',
    rfc: '',
    telefono: '',
    correo: '',
    direccion: ''
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

  validarTecladoTelefono(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
      event.preventDefault();
    }
  }

  guardarCliente(event: Event): void {
    event.preventDefault();
    console.log("Cliente listo para registrar en SIGAF:", this.nuevoCliente);
    this.cerrarModal();
  }

  private resetFormulario(): void {
    this.nuevoCliente = {
      razonSocial: '',
      rfc: '',
      telefono: '',
      correo: '',
      direccion: ''
    };
  }
}