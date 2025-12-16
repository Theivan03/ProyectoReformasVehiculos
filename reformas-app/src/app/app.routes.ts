import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CrearReformaComponent } from './pages/crear-reforma/crear-reforma.component';
import { EditarReformaComponent } from './pages/editar-reforma/editar-reforma.component';
import { HomeComponent } from './pages/home/home.component';
import { GeneradorDocumentosComponent } from './generador-documentos/generador-documentos.component';
import { FormularioProyectoComponent } from './pages/formulario-proyecto/formulario-proyecto.component';
import { GestionarTallerComponent } from './formulario-taller/gestionar-taller.component';
import { GestionarIngenieroComponent } from './gestionar-ingeniero/gestionar-ingeniero.component';
import { LoginGestionUsuariosComponent } from './pages/login-gestion-usuarios/login-gestion-usuarios.component';
import { AuthProteccionRutasGuard } from './auth-proteccion-rutas.guard';
import { AdminGestionUsuariosComponent } from './pages/admin-gestion-usuarios/admin-gestion-usuarios.component';
import { GestorDocumentacionComponent } from './pagesVivienda/gestor-documentacion/gestor-documentacion.component';
import { GestorTrelloComponent } from './pagesVivienda/gestor-trello/gestor-trello.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginGestionUsuariosComponent,
  },
  {
    path: '',
    canActivate: [AuthProteccionRutasGuard],
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'crear-reforma', component: CrearReformaComponent },
      { path: 'editar-reforma', component: EditarReformaComponent },
      { path: 'documentos', component: GeneradorDocumentosComponent },
      { path: 'formulario', component: FormularioProyectoComponent },
      { path: 'taller', component: GestionarTallerComponent },
      { path: 'ingenieros', component: GestionarIngenieroComponent },
      { path: 'reforma/:step', component: CrearReformaComponent },
      { path: 'reforma', redirectTo: 'reforma/seleccion', pathMatch: 'full' },
      { path: 'admin', component: AdminGestionUsuariosComponent },
      { path: 'documentacion-vt', component: GestorDocumentacionComponent },
      {
        path: 'editar-expediente/:id',
        component: GestorDocumentacionComponent,
      },
      { path: 'gestion-viviendas', component: GestorTrelloComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
