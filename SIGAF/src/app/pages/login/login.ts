import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  mensajeGeneral: string = '';
  
  mostrarPassword: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  // Mostrar y ocultar la contraseña
  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.loginForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { usuario, password } = this.loginForm.value;
    const correoCompleto = `${usuario}@sigaf.com`;

    this.http.post('http://localhost:3000/api/login', {
      usuario: correoCompleto,
      password
    }).subscribe({
      next: (res: any) => {
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.router.navigate(['/principal']); 
      },
      error: (err) => {
        this.mensajeGeneral = err.error?.mensaje || 'Error al iniciar sesión';
      }
    });
  }
}