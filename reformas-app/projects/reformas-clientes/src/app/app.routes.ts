import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { CrearReformaComponent } from './pages/crear-reforma/crear-reforma.component';
import { EditarReformaComponent } from './pages/editar-reforma/editar-reforma.component';
import { GeneradorDocumentosComponent } from './generador-documentos/generador-documentos.component';
import { FormularioProyectoComponent } from './pages/formulario-proyecto/formulario-proyecto.component';
import { GestionarTallerComponent } from './formulario-taller/gestionar-taller.component';
import { FinalizarReformaComponent } from './pages/finalizar-reforma/finalizar-reforma.component';

export const routes: Routes = [
  { path: '', component: CrearReformaComponent, pathMatch: 'full' },
  { path: 'crear-reforma', component: CrearReformaComponent },
  { path: 'editar-reforma', component: EditarReformaComponent },
  { path: 'documentos', component: GeneradorDocumentosComponent },
  { path: 'formulario', component: FormularioProyectoComponent },
  { path: 'taller', component: GestionarTallerComponent },
  { path: 'reforma/:step', component: CrearReformaComponent },
  { path: 'finalizar', component: FinalizarReformaComponent },
  { path: 'reforma', redirectTo: 'reforma/seleccion', pathMatch: 'full' },
  { path: '**', redirectTo: 'reforma/seleccion' },
];
