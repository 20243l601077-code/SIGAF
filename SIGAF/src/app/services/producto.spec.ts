import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // La dirección donde está parado nuestro mensajero de Node.js
  private apiURL = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) { }

  // Función para pedirle los productos al mensajero
  obtenerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiURL);
  }
}