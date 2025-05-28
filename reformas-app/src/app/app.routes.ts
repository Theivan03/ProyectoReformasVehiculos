import { Routes } from '@angular/router';
import { CrearReformaComponent } from './pages/crear-reforma/crear-reforma.component';
import { EditarReformaComponent } from './pages/editar-reforma/editar-reforma.component';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'crear-reforma', component: CrearReformaComponent },
  { path: 'editar-reforma', component: EditarReformaComponent },
];
