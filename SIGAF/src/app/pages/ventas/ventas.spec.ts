import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentasComponent } from './ventas';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';

describe('VentasComponent', () => {
  let component: VentasComponent;
  let fixture: ComponentFixture<VentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule, 
        FormsModule, 
        VentasComponent
      ],
      providers: [DecimalPipe]
    }).compileComponents();

    fixture = TestBed.createComponent(VentasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el listado de ventas en el ngOnInit', () => {
    expect(component.ventas.length).toBeGreaterThan(0);
  });

  it('debería filtrar las ventas basadas en el término de búsqueda global', () => {
    component.terminoBusquedaGlobal = 'V-0001';
    component.filtrarVentas();
    expect(component.ventasFiltradas.every(v => v.folio.includes('V-0001'))).toBe(true);
  });

  it('debería alternar correctamente el estado del modal de venta', () => {
    expect(component.isModalVentaOpen).toBe(false);
    component.abrirModalVenta();
    expect(component.isModalVentaOpen).toBe(true);
    component.cerrarModalVenta();
    expect(component.isModalVentaOpen).toBe(false);
  });

  it('debería agregar materiales al carro interno y calcular totales adecuadamente', () => {
    component.materialSeleccionadoId = 101;
    component.descripcionMaterialSeleccionado = 'Varilla Corrugada 3/8 Pza';
    component.precioUnitarioSeleccionado = 145.00;
    component.stockDisponible = 150;
    component.unidadMedidaSeleccionada = 'Pzas';
    component.cantidadMaterial = 10;

    component.agregarMaterial();

    expect(component.nuevaVenta.materiales.length).toBe(1);
    expect(component.nuevaVenta.subtotal).toBe(1450.00);
  });
});