import { Routes } from '@angular/router';
import { CrearReformaComponent } from './pages/crear-reforma/crear-reforma.component';

export const routes: Routes = [
  { path: '', redirectTo: 'reforma/tipo-vehiculo', pathMatch: 'full' },
  {
    path: 'crear-reforma',
    redirectTo: 'reforma/tipo-vehiculo',
    pathMatch: 'full',
  },
  { path: 'reforma/:step', component: CrearReformaComponent },
  { path: 'reforma', redirectTo: 'reforma/tipo-vehiculo', pathMatch: 'full' },
  { path: '**', redirectTo: 'reforma/tipo-vehiculo' },
];
