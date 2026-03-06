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
import { GestionarArquitectosComponent } from './gestionar-arquitectos/gestionar-arquitectos.component';
import { GestionarInstaladoresComponent } from './gestionar-instaladores/gestionar-instaladores.component';
import { MemoriaTecnicaDisenoComponent } from './pagesVivienda/memoria-tecnica-diseno/memoria-tecnica-diseno.component';
import { MemoriasListaComponent } from './pagesVivienda/memorias-lista/memorias-lista.component';
import { MemoriaTecnicaSelectorComponent } from './pagesVivienda/memoria-tecnica-selector/memoria-tecnica-selector.component';
import { MemoriaTecnicaAutoconsumoComponent } from './pagesVivienda/memoria-tecnica-autoconsumo/memoria-tecnica-autoconsumo.component';

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
      { path: 'arquitectos', component: GestionarArquitectosComponent },
      { path: 'instaladores', component: GestionarInstaladoresComponent },
      { path: 'reforma/:step', component: CrearReformaComponent },
      { path: 'reforma', redirectTo: 'reforma/seleccion', pathMatch: 'full' },
      { path: 'admin', component: AdminGestionUsuariosComponent },
      { path: 'documentacion-vt', component: GestorDocumentacionComponent },
      {
        path: 'editar-expediente/:id',
        component: GestorDocumentacionComponent,
      },
      { path: 'gestion-viviendas', component: GestorTrelloComponent },
      {
        path: 'memoria-tecnica-diseno',
        component: MemoriaTecnicaSelectorComponent,
      },
      {
        path: 'memoria-tecnica-diseno/consumo',
        component: MemoriaTecnicaDisenoComponent,
      },
      {
        path: 'memoria-tecnica-diseno/autoconsumo',
        component: MemoriaTecnicaAutoconsumoComponent,
      },
      {
        path: 'memorias',
        component: MemoriasListaComponent,
      },
      {
        path: 'memoria-tecnica-diseno/consumo/:id',
        component: MemoriaTecnicaDisenoComponent,
      },
      {
        path: 'memoria-tecnica-diseno/autoconsumo/:id',
        component: MemoriaTecnicaAutoconsumoComponent,
      },
      {
        path: 'memoria-tecnica-diseno/:id',
        component: MemoriaTecnicaDisenoComponent,
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
