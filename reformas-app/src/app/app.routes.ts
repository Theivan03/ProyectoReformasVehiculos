import { Routes } from '@angular/router';
import { CrearReformaComponent } from './pages/crear-reforma/crear-reforma.component';
import { EditarReformaComponent } from './pages/editar-reforma/editar-reforma.component';
import { HomeComponent } from './pages/home/home.component';
import { GeneradorDocumentosComponent } from './generador-documentos/generador-documentos.component';
import { FormularioProyectoComponent } from './pages/formulario-proyecto/formulario-proyecto.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'crear-reforma', component: CrearReformaComponent },
  { path: 'editar-reforma', component: EditarReformaComponent },
  { path: 'documentos', component: GeneradorDocumentosComponent },
  { path: 'formulario', component: FormularioProyectoComponent },
];
