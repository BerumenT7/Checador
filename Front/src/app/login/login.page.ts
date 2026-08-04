import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmark, eyeOutline, eyeOffOutline, logInOutline, cloudOfflineOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon],
})
export class LoginPage {
  claveChofer = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(private auth: AuthService, private router: Router) {
    addIcons({ shieldCheckmark, eyeOutline, eyeOffOutline, logInOutline, cloudOfflineOutline });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onOfflineMode() {
    this.errorMessage = '';
    if (!this.auth.enterOfflineMode()) {
      this.errorMessage = 'Primero debes iniciar sesión al menos una vez con el servidor disponible.';
      return;
    }
    this.router.navigate(['/home']);
  }

  onLogin() {
    this.errorMessage = '';

    if (!this.claveChofer && !this.password) {
      this.errorMessage = 'Ingresa tu clave de empleado y contraseña.';
      return;
    }
    if (!this.claveChofer) {
      this.errorMessage = 'Ingresa tu clave de empleado.';
      return;
    }
    if (!this.password) {
      this.errorMessage = 'Ingresa tu contraseña.';
      return;
    }

    this.isLoading = true;

    this.auth.login(this.claveChofer, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.parseError(err);
      },
    });
  }

  private parseError(err: any): string {
    if (err.status === 0)   return 'Sin conexión al servidor. Verifica que estés en la misma red Wi-Fi.';
    if (err.status === 401) return 'Clave o contraseña incorrecta.';
    if (err.status === 403) return 'Acceso denegado. No tienes permisos para ingresar.';
    if (err.status === 404) return 'Usuario no encontrado en el sistema.';
    if (err.status >= 500)  return 'Error en el servidor. Contacta a Sistemas.';
    return err?.error?.message || 'Error desconocido. Intenta de nuevo.';
  }
}
