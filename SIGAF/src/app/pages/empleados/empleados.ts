import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadosService } from './empleados.service';

export interface Empleado {
  id_empleado?: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  puesto: string;
  correo?: string;
  telefono?: string;
  horas_laborales: number;
  rol: string;
  id_usuario?: number | null;
  foto_url?: string;
}

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empleados.html',
  styleUrls: ['./empleados.css']
})
export class EmpleadosComponent implements OnInit, OnDestroy {

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  filtroNombre: string = '';
  filtroPuesto: string = '';

  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];

  mostrarModal: boolean = false;
  modoEdicion: boolean = false;
  camaraActiva: boolean = false;
  mediaStream: MediaStream | null = null;
  
  empleadoForm: Empleado = this.limpiarFormulario();
  errores: { [key: string]: string } = {};

  // Inyectamos ChangeDetectorRef para forzar el refresco tras la petición asíncrona
  constructor(
    private empleadosService: EmpleadosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEmpleadosBD();
  }

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  // --- OBTENER DATOS DE LA BASE DE DATOS ---
  cargarEmpleadosBD(): void {
    this.empleadosService.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data || [];
        this.aplicarFiltros();
        this.cdr.detectChanges(); // <-- Fuerza a Angular a pintar la tabla en el DOM inmediatamente
      },
      error: (err) => {
        console.error('Error al cargar empleados de la BD:', err);
      }
    });
  }

  // --- FILTROS ---
  aplicarFiltros(): void {
    if (!this.empleados) {
      this.empleadosFiltrados = [];
      return;
    }

    this.empleadosFiltrados = this.empleados.filter(emp => {
      const nom = emp.nombre || '';
      const pat = emp.apellido_paterno || '';
      const mat = emp.apellido_materno || '';

      const nombreCompleto = `${nom} ${pat} ${mat}`.toLowerCase();
      const coincideNombre = nombreCompleto.includes((this.filtroNombre || '').toLowerCase());
      const coincidePuesto = !this.filtroPuesto || emp.puesto === this.filtroPuesto;
      return coincideNombre && coincidePuesto;
    });
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroPuesto = '';
    this.aplicarFiltros();
  }

  // --- MODAL ---
  abrirModalNuevo(): void {
    this.modoEdicion = false;
    this.empleadoForm = this.limpiarFormulario();
    this.errores = {};
    this.mostrarModal = true;
  }

  abrirModalEditar(emp: Empleado): void {
    this.modoEdicion = true;
    this.empleadoForm = { ...emp };
    this.errores = {};
    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.detenerCamara();
    this.mostrarModal = false;
  }

  // --- VALIDACIONES ---
  validarFormulario(): boolean {
    this.errores = {};

    const regexTexto = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const regexTelefono = /^\+?[0-9]{10,15}$/;
    
    // 1. Nombre
    if (!this.empleadoForm.nombre || !this.empleadoForm.nombre.trim()) {
      this.errores['nombre'] = 'El nombre es obligatorio.';
    } else if (!regexTexto.test(this.empleadoForm.nombre.trim())) {
      this.errores['nombre'] = 'El nombre solo puede contener letras.';
    }

    // 2. Apellido Paterno
    if (!this.empleadoForm.apellido_paterno || !this.empleadoForm.apellido_paterno.trim()) {
      this.errores['apellido_paterno'] = 'El apellido paterno es obligatorio.';
    } else if (!regexTexto.test(this.empleadoForm.apellido_paterno.trim())) {
      this.errores['apellido_paterno'] = 'Solo se permiten letras.';
    }

    // 3. Apellido Materno
    if (this.empleadoForm.apellido_materno && this.empleadoForm.apellido_materno.trim() !== '') {
      if (!regexTexto.test(this.empleadoForm.apellido_materno.trim())) {
        this.errores['apellido_materno'] = 'Solo se permiten letras.';
      }
    }

    // 4. Puesto
    if (!this.empleadoForm.puesto) {
      this.errores['puesto'] = 'Debes seleccionar un puesto.';
    }

    // 5. Correo Electrónico
    if (this.empleadoForm.correo && this.empleadoForm.correo.trim() !== '') {
      const correoLower = this.empleadoForm.correo.trim().toLowerCase();
      if (!correoLower.endsWith('@gmail.com')) {
        this.errores['correo'] = 'El correo electrónico debe incluir @gmail.com';
      }
    }

    // 6. Teléfono
    if (this.empleadoForm.telefono && this.empleadoForm.telefono.trim() !== '') {
      if (!regexTelefono.test(this.empleadoForm.telefono.trim())) {
        this.errores['telefono'] = 'Ingresa un número válido (mínimo 10 dígitos).';
      }
    }

    // 7. Horas laborales
    if (!this.empleadoForm.horas_laborales || this.empleadoForm.horas_laborales <= 0 || this.empleadoForm.horas_laborales > 84) {
      this.errores['horas_laborales'] = 'Las horas semanales deben estar entre 1 y 84 hrs.';
    }

    return Object.keys(this.errores).length === 0;
  }

  // --- GUARDAR EN BASE DE DATOS ---
  guardarEmpleado(): void {
    if (!this.validarFormulario()) return;

    if (this.modoEdicion && this.empleadoForm.id_empleado) {
      // Editar en BD
      this.empleadosService.actualizarEmpleado(this.empleadoForm.id_empleado, this.empleadoForm).subscribe({
        next: () => {
          this.cargarEmpleadosBD();
          this.cerrarModal();
        },
        error: (err) => alert('Error al actualizar el registro en la base de datos.')
      });
    } else {
      // Crear en BD
      this.empleadosService.crearEmpleado(this.empleadoForm).subscribe({
        next: () => {
          this.cargarEmpleadosBD();
          this.cerrarModal();
        },
        error: (err) => alert('Error al guardar el registro en la base de datos.')
      });
    }
  }

  eliminarEmpleado(id?: number): void {
    if (!id) return;
    if (confirm(`¿Estás seguro de eliminar el empleado #${id}?`)) {
      this.empleadosService.eliminarEmpleado(id).subscribe({
        next: () => this.cargarEmpleadosBD(),
        error: (err) => alert('Error al eliminar en la base de datos.')
      });
    }
  }

  // --- ARCHIVOS Y FOTOS ---
  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.convertirADataUrl(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropFoto(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.convertirADataUrl(event.dataTransfer.files[0]);
    }
  }

  quitarFoto(event: Event): void {
    event.stopPropagation();
    this.empleadoForm.foto_url = '';
  }

  private convertirADataUrl(file: File): void {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.empleadoForm.foto_url = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // --- CÁMARA WEB ---
  async iniciarCamara(): Promise<void> {
    try {
      this.camaraActiva = true;
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setTimeout(() => {
        if (this.videoElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 100);
    } catch (err) {
      alert('No se pudo acceder a la cámara web.');
      this.camaraActiva = false;
    }
  }

  tomarFotoCamara(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth || 300;
    canvas.height = video.videoHeight || 300;

    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.empleadoForm.foto_url = canvas.toDataURL('image/png');
    }

    this.detenerCamara();
  }

  detenerCamara(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.camaraActiva = false;
  }

  private limpiarFormulario(): Empleado {
    return {
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      puesto: '',
      correo: '',
      telefono: '',
      horas_laborales: 48,
      rol: 'operador',
      foto_url: ''
    };
  }
}