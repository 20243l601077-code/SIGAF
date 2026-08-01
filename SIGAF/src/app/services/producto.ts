import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // La dirección de nuestro mensajero (API)
  private apiURL = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) { }

  // 1. Para ver los productos
  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL);
  }

  // 2. ¡NUEVO! Para guardar un producto en la BD
  guardarProducto(producto: any): Observable<any> {
    // Le mandamos el paquete de datos del producto a la API
    return this.http.post<any>(this.apiURL, producto);
  }
}