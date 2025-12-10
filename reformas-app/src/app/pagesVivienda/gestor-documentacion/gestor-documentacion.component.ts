import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  LucideAngularModule,
  FileText,
  CheckSquare,
  User,
  Home,
  HardHat,
  Download,
  ChevronRight,
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-angular';

import { DocumentoService } from '../funciones/documento.service';

@Component({
  selector: 'app-gestor-documentacion',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, HttpClientModule],
  providers: [DocumentoService],
  templateUrl: './gestor-documentacion.component.html',
  styleUrls: ['./gestor-documentacion.component.css'],
})
export class GestorDocumentacionComponent implements OnInit {
  readonly icons_gestor = {
    FileText,
    CheckSquare,
    User,
    Home,
    HardHat,
    Download,
    ChevronRight,
    ChevronLeft,
    Save,
    Plus,
    Trash2,
    Calendar,
  };

  pasoActual_gestor: number = 1;
  isLoading = false;

  // --- MODELO DE DATOS GLOBAL ---
  datosGlobales_gestor = {
    // Servicios
    servicio_seleccion_ccu: false,
    servicio_seleccion_segunda_ocupacion: false,
    servicio_seleccion_cee: false,
    servicio_seleccion_registro_vt: false,
    servicio_seleccion_nra: false,

    // Verificaciones
    check_es_empresa: false,
    check_requiere_representacion: false,
    check_firma_digital_disponible: false,

    // Titular
    titular_nombre: '',
    titular_apellidos: '',
    titular_dni_nif: '',
    titular_tipo_via: 'calle',
    titular_nombre_via: '',
    titular_numero: '',
    titular_piso: '',
    titular_puerta: '',
    titular_codigo_postal: '',
    titular_poblacion: '',
    titular_provincia: '',

    // Interesado
    existe_interesado_representante: false,
    interesada_nombre: '',
    interesada_apellidos: '',
    interesada_dni_nif: '',

    // Vivienda
    vivienda_direccion_completa: '',
    vivienda_referencia_catastral: '',
    vivienda_tipo_via: 'calle',
    vivienda_nombre_via: '',
    vivienda_numero: '',
    vivienda_piso: '',
    vivienda_puerta: '',
    vivienda_codigo_postal: '',
    vivienda_poblacion: '',
    vivienda_provincia: '',
    vivienda_tipo_suelo: '',
    vivienda_ano_construccion: null,
    vivienda_superficie_total: 0,
    vivienda_superficie_construida: 0,
    vivienda_superficie_util: 0,
    vivienda_lista_plantas: [] as { tipo: string; descripcion: string }[],
    vivienda_alcantarillado_publico: false,
    vivienda_empresa_agua: '',
    vivienda_empresa_luz: '',
    vivienda_empresa_basura: '',
    vivienda_lindero_frente: '',
    vivienda_lindero_fondo: '',
    vivienda_lindero_derecha: '',
    vivienda_lindero_izquierda: '',
    vivienda_lindero_arriba: '',
    vivienda_lindero_abajo: '',
    vivienda_num_arrendatarios: 0,
    vivienda_nombre_registro_propiedad: '',
    vivienda_cru: '',
    vivienda_fecha_ultima_compra: '',
    vivienda_codigo_seguridad_icu: '',
    vivienda_fecha_emision_icu: '',
    vivienda_es_estudio: false,
    vivienda_cantidad_dormitorios: 0,
    vivienda_numero_vt: '',

    // Técnicos
    tecnico_arquitecto_seleccionado: null as any,
    tecnico_ingeniero_seleccionado: null as any,

    // Fechas
    usar_fechas_distintas: false,
    fecha_global: '',
    fechas_tramites: {
      servicio_seleccion_ccu: '',
      servicio_seleccion_segunda_ocupacion: '',
      servicio_seleccion_cee: '',
      servicio_seleccion_registro_vt: '',
      servicio_seleccion_nra: '',
    } as { [key: string]: string },

    tramite_fecha_seleccionado: '',
  };

  // Listas auxiliares
  listaOpcionesLinderos_gestor = ['Vivienda', 'Terreno no construido', 'Nada'];
  listaTiposVia_gestor = [
    'Calle',
    'Avenida',
    'Plaza',
    'Camino',
    'Paseo',
    'Carretera',
    'Ronda',
    'Pasaje',
  ];
  listaTiposPlanta_gestor = [
    'Sótano',
    'Semisótano',
    'Baja',
    'Entresuelo',
    'Primera',
    'Segunda',
    'Tercera',
    'Cuarta',
    'Ático',
    'Buhardilla',
  ];

  listaArquitectos_gestor: any[] = [];
  listaIngenieros_gestor: any[] = [];

  serviciosDisponibles_gestor = [
    {
      key: 'servicio_seleccion_ccu',
      label: 'CCU (Compatibilidad Urbanística)',
    },
    {
      key: 'servicio_seleccion_segunda_ocupacion',
      label: 'Licencia 2ª Ocupación',
    },
    { key: 'servicio_seleccion_cee', label: 'CEE (Certificado Energético)' },
    { key: 'servicio_seleccion_registro_vt', label: 'Registro VT Consellería' },
    { key: 'servicio_seleccion_nra', label: 'Gestión NRA' },
  ];

  checksVerificacion_gestor = [
    {
      key: 'existe_interesado_representante',
      label: 'La persona titular no es la interesada',
    },
    { key: 'check_es_empresa', label: 'Es una empresa' },
    {
      key: 'check_requiere_representacion',
      label: 'Vamos a representar al cliente',
    },
    {
      key: 'check_firma_digital_disponible',
      label: 'Tenemos firma digital del titular',
    },
  ];

  constructor(
    private http: HttpClient,
    private documentoService: DocumentoService
  ) {}

  ngOnInit(): void {
    this.cargarIngenieros();
    this.cargarArquitectos();
  }

  cargarIngenieros(): void {
    this.http.get<any>('http://192.168.1.41:3000/ingenieros').subscribe({
      next: (data) => {
        this.listaIngenieros_gestor = Array.isArray(data) ? data : [data];
      },
      error: (err) => {
        console.error('Error ingenieros:', err);
        this.listaIngenieros_gestor = [];
      },
    });
  }

  cargarArquitectos(): void {
    this.http.get<any>('http://192.168.1.41:3000/arquitectos').subscribe({
      next: (data) => {
        this.listaArquitectos_gestor = Array.isArray(data) ? data : [data];
      },
      error: (err) => {
        console.error('Error arquitectos:', err);
        this.listaArquitectos_gestor = [];
      },
    });
  }

  toggleServicio_gestor(key: string) {
    const datos = this.datosGlobales_gestor as any;
    datos[key] = !datos[key];
  }

  avanzarFase_gestor() {
    if (this.pasoActual_gestor < 7) {
      this.pasoActual_gestor++;
      if (
        this.pasoActual_gestor === 6 &&
        !this.datosGlobales_gestor.tramite_fecha_seleccionado
      ) {
        const activos = this.serviciosActivosList;
        if (activos.length > 0)
          this.datosGlobales_gestor.tramite_fecha_seleccionado = activos[0].key;
      }
    }
  }

  retrocederFase_gestor() {
    if (this.pasoActual_gestor > 1) {
      this.pasoActual_gestor--;
    }
  }

  finalizarExpediente_gestor() {
    alert('Proceso finalizado. Documentos enviados a cola.');
  }

  calcularSuperficieUtil_gestor() {
    const construida = this.datosGlobales_gestor.vivienda_superficie_construida;
    if (construida && construida > 0) {
      this.datosGlobales_gestor.vivienda_superficie_util = parseFloat(
        (construida * 0.85).toFixed(2)
      );
    }
  }

  agregarPlanta_gestor() {
    this.datosGlobales_gestor.vivienda_lista_plantas.push({
      tipo: '',
      descripcion: '',
    });
  }

  eliminarPlanta_gestor(index: number) {
    this.datosGlobales_gestor.vivienda_lista_plantas.splice(index, 1);
  }

  get hayServiciosSeleccionados_gestor(): boolean {
    return Object.keys(this.datosGlobales_gestor).some(
      (k) =>
        k.startsWith('servicio') &&
        (this.datosGlobales_gestor as any)[k] === true
    );
  }

  get serviciosActivosList() {
    return this.serviciosDisponibles_gestor.filter(
      (s) => (this.datosGlobales_gestor as any)[s.key]
    );
  }

  obtenerNombreIngeniero_gestor(): string {
    const ingeniero = this.datosGlobales_gestor.tecnico_ingeniero_seleccionado;
    if (ingeniero) {
      return ingeniero.numero
        ? `${ingeniero.nombre} (Col. ${ingeniero.numero})`
        : ingeniero.nombre;
    }
    return 'Pendiente';
  }

  // Getters visibilidad Fase 4
  get ver_suelo_ano() {
    return (
      this.datosGlobales_gestor.servicio_seleccion_ccu ||
      this.datosGlobales_gestor.servicio_seleccion_segunda_ocupacion
    );
  }
  get ver_ccu_completo() {
    return this.datosGlobales_gestor.servicio_seleccion_ccu;
  }
  get ver_solo_util() {
    return (
      this.datosGlobales_gestor.servicio_seleccion_segunda_ocupacion &&
      !this.datosGlobales_gestor.servicio_seleccion_ccu
    );
  }
  get ver_plantas() {
    return this.datosGlobales_gestor.servicio_seleccion_segunda_ocupacion;
  }
  get ver_alcantarillado() {
    return this.datosGlobales_gestor.servicio_seleccion_segunda_ocupacion;
  }
  get ver_empresas_suministros() {
    return this.datosGlobales_gestor.servicio_seleccion_ccu;
  }
  get ver_datos_vt_conselleria() {
    return this.datosGlobales_gestor.servicio_seleccion_registro_vt;
  }
  get ver_datos_nra() {
    return this.datosGlobales_gestor.servicio_seleccion_nra;
  }

  // =================================================================
  //  GENERACIÓN DE DOCUMENTOS (CLIENTE)
  // =================================================================

  // 1. CCU Y 2ª OCUPACIÓN
  async generarDocumentoRepresentacionCCU2ocu(frase: string) {
    this.isLoading = true;
    try {
      await this.documentoService.generarRepresentacionCCU2ocu(
        this.datosGlobales_gestor,
        frase
      );
      this.isLoading = false;
    } catch (err) {
      console.error('Error al generar el documento:', err);
      alert('Hubo un problema al crear el archivo. Revisa la consola.');
      this.isLoading = false;
    }
  }

  // 2. CEE (NUEVA FUNCIÓN)
  async generarDocumentoRepresentacionCEE() {
    this.isLoading = true;
    try {
      // Llamamos a la función específica del CEE en el servicio
      await this.documentoService.generarRepresentacionCEE(
        this.datosGlobales_gestor
      );
      this.isLoading = false;
    } catch (err) {
      console.error('Error al generar el CEE:', err);
      alert('Hubo un problema al crear el CEE.');
      this.isLoading = false;
    }
  }

  async generarDocumentoActaVisitaCEE() {
    this.isLoading = true;
    try {
      // Llamamos a la función específica del CEE en el servicio
      await this.documentoService.generarActaVisita(this.datosGlobales_gestor);
      this.isLoading = false;
    } catch (err) {
      console.error('Error al generar el acta de visita del CEE:', err);
      alert('Hubo un problema al crear el acta de visita del CEE.');
      this.isLoading = false;
    }
  }

  async generarDeclaracionTecnico() {
    this.isLoading = true;
    try {
      await this.documentoService.generarDeclaracionResponsableTecnico(
        this.datosGlobales_gestor
      );
      this.isLoading = false;
    } catch (err) {
      console.error('Error al generar declaración:', err);
      alert(
        'Error generando el PDF. Asegúrate de que la plantilla "DECLARACION RESPONSABLE TECNICO PROYECTISTA.pdf" está en la carpeta assets.'
      );
      this.isLoading = false;
    }
  }
}
