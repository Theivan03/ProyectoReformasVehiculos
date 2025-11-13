import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'reformas-app';

  constructor(private router: Router) {}

  resetAndNavigate(route: string) {
    this.clearWizardStorage();
    this.router.navigate([route]);
  }

  clearWizardStorage() {
    try {
      const prefix = 'reforma-wizard-v1';

      // borrar localStorage
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith(prefix)) keysToDelete.push(key);
      }
      keysToDelete.forEach((k) => localStorage.removeItem(k));

      // borrar claves legacy también
      localStorage.removeItem(prefix);
      localStorage.removeItem(prefix + '-nueva');

      // borrar sessionStorage entero
      sessionStorage.clear();
    } catch (err) {
      console.error('Error limpiando almacenamiento:', err);
    }
  }
}
