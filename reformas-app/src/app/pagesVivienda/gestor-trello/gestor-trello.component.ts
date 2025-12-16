import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  X,
  Save,
  FileDown,
  Edit,
  User,
  MapPin,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Download,
} from 'lucide-angular';

import { DocumentoService } from '../funciones/documento.service';

@Component({
  selector: 'app-gestor-trello',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, HttpClientModule],
  providers: [DocumentoService],
  templateUrl: './gestor-trello.component.html',
})
export class GestorTrelloComponent implements OnInit {
  readonly icons = {
    X,
    Save,
    FileDown,
    Edit,
    User,
    MapPin,
    LayoutDashboard,
    CheckCircle2,
    Clock,
    FileText,
    MessageSquare,
    Download,
  };

  listaViviendas: any[] = [];
  viviendaSeleccionada: any = null;
  isLoading = false;
  draggedVivienda: any = null;
  mostrarModalDocs: boolean = false;

  configuracionServicios = [
    {
      key: 'servicio_seleccion_ccu',
      estadoKey: 'estado_fase_ccu',
      notasKey: 'notas_fase_ccu',
      label: 'CCU',
      fullLabel: 'CCU - Compatibilidad Urbanística',
    },
    {
      key: 'servicio_seleccion_segunda_ocupacion',
      estadoKey: 'estado_fase_segunda_ocupacion',
      notasKey: 'notas_fase_segunda_ocupacion',
      label: '2OCU',
      fullLabel: 'Licencia 2ª Ocupación',
    },
    {
      key: 'servicio_seleccion_cee',
      estadoKey: 'estado_fase_cee',
      notasKey: 'notas_fase_cee',
      label: 'CEE',
      fullLabel: 'Certificado Energético (CEE)',
    },
    {
      key: 'servicio_seleccion_registro_vt',
      estadoKey: 'estado_fase_registro_vt',
      notasKey: 'notas_fase_registro_vt',
      label: 'VT',
      fullLabel: 'Registro Vivienda Turística',
    },
    {
      key: 'servicio_seleccion_nra',
      estadoKey: 'estado_fase_nra',
      notasKey: 'notas_fase_nra',
      label: 'NRA',
      fullLabel: 'Gestión NRA',
    },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private documentoService: DocumentoService
  ) {}

  ngOnInit(): void {
    this.cargarViviendas();
  }

  cargarViviendas() {
    this.isLoading = true;
    this.http.get<any[]>('http://192.168.1.41:3000/api/viviendas').subscribe({
      next: (data) => {
        this.listaViviendas = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  get expedientesEnCurso() {
    return this.listaViviendas.filter(
      (v) => v.estado_general_expediente !== 'terminado'
    );
  }

  get expedientesTerminados() {
    return this.listaViviendas.filter(
      (v) => v.estado_general_expediente === 'terminado'
    );
  }

  abrirFicha(vivienda: any) {
    this.viviendaSeleccionada = JSON.parse(JSON.stringify(vivienda));
  }

  cerrarModal() {
    if (this.viviendaSeleccionada) {
      this.guardarCambios(this.viviendaSeleccionada, true);
    }
    this.viviendaSeleccionada = null;
    this.mostrarModalDocs = false;
  }

  abrirModalDocumentos() {
    this.mostrarModalDocs = true;
  }

  cerrarModalDocumentos() {
    this.mostrarModalDocs = false;
  }

  navegarAEdicion() {
    if (this.viviendaSeleccionada && this.viviendaSeleccionada.id) {
      this.guardarCambios(this.viviendaSeleccionada, true);
      this.router.navigate([
        '/editar-expediente',
        this.viviendaSeleccionada.id,
      ]);
    }
  }

  guardarCambios(
    vivienda: any = this.viviendaSeleccionada,
    silencioso: boolean = false
  ) {
    if (!vivienda) return;
    if (!silencioso) this.isLoading = true;

    this.http
      .put(`http://192.168.1.41:3000/api/viviendas/${vivienda.id}`, vivienda)
      .subscribe({
        next: () => {
          this.cargarViviendas();
          this.isLoading = false;
          if (!silencioso) alert('Guardado correctamente');
        },
        error: (err) => {
          console.error('Error al guardar', err);
          this.isLoading = false;
        },
      });
  }

  onDragStart(event: DragEvent, vivienda: any) {
    this.draggedVivienda = vivienda;
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDrop(event: DragEvent, nuevoEstado: 'empezado' | 'terminado') {
    event.preventDefault();
    if (
      this.draggedVivienda &&
      this.draggedVivienda.estado_general_expediente !== nuevoEstado
    ) {
      this.draggedVivienda.estado_general_expediente = nuevoEstado;
      this.guardarCambios(this.draggedVivienda, true);
    }
    this.draggedVivienda = null;
  }

  getBadgeClass(activo: boolean, estado: string): string {
    if (!activo) return 'badge-off';
    if (estado === 'terminado') return 'badge-success';
    if (estado === 'presentado') return 'badge-info';
    return 'badge-pending';
  }

  async generarDocumentoRepresentacionCCU2ocu(frase: string) {
    this.isLoading = true;
    try {
      await this.documentoService.generarRepresentacionCCU2ocu(
        this.viviendaSeleccionada,
        frase
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar archivo.');
      this.isLoading = false;
    }
  }

  async generarDocumentoRepresentacionCEE() {
    this.isLoading = true;
    try {
      await this.documentoService.generarRepresentacionCEE(
        this.viviendaSeleccionada
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar CEE.');
      this.isLoading = false;
    }
  }

  async generarDocumentoActaVisitaCEE() {
    this.isLoading = true;
    try {
      await this.documentoService.generarActaVisita(this.viviendaSeleccionada);
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar acta.');
      this.isLoading = false;
    }
  }

  async generarDeclaracionTecnico() {
    this.isLoading = true;
    try {
      await this.documentoService.generarDeclaracionResponsableTecnico(
        this.viviendaSeleccionada
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar declaración.');
      this.isLoading = false;
    }
  }

  async generarMemoriaTecnica() {
    this.isLoading = true;
    try {
      await this.documentoService.generarMemoriaTecnica(
        this.viviendaSeleccionada
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar memoria.');
      this.isLoading = false;
    }
  }

  async generarAnexoDecretoOcupacion() {
    this.isLoading = true;
    try {
      await this.documentoService.generarAnexoDecretoOcupacion(
        this.viviendaSeleccionada
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar anexos.');
      this.isLoading = false;
    }
  }

  async generarRegistroVTCoselleria() {
    this.isLoading = true;
    try {
      await this.documentoService.generarRegistroVTPDF(
        this.viviendaSeleccionada
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar registro VT.');
      this.isLoading = false;
    }

    this.isLoading = true;
    try {
      await this.documentoService.generarRegistroVT_SEGUNDA_PARTE(
        this.viviendaSeleccionada
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar segunda parte VT.');
      this.isLoading = false;
    }
  }

  async generarGuiaPresentacionTelematica() {
    this.isLoading = true;
    try {
      await this.documentoService.generarGuiaPresentacionNRA(
        this.viviendaSeleccionada
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar documento de NRA.');
      this.isLoading = false;
    }
  }
}
