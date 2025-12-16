import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
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
  Upload,
  XCircle,
  Image as ImageIcon,
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
  esModoEdicion: boolean = false;
  idViviendaEditar: number | null = null;

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
    Upload,
    XCircle,
    ImageIcon,
  };

  pasoActual_gestor: number = 1;
  isLoading = false;
  isDragging = false;

  datosGlobales_gestor = {
    servicio_seleccion_ccu: false,
    servicio_seleccion_segunda_ocupacion: false,
    servicio_seleccion_cee: false,
    servicio_seleccion_registro_vt: false,
    servicio_seleccion_nra: false,

    check_es_empresa: false,
    check_requiere_representacion: false,
    check_firma_digital_disponible: false,

    titular_nombre: 'Ivan',
    titular_apellidos: 'Cabrera Reig',
    titular_dni_nif: '74018543N',
    titular_tipo_via: 'avenida',
    titular_nombre_via: 'Mediterráneo',
    titular_numero: '2',
    titular_piso: '1',
    titular_puerta: 'B',
    titular_codigo_postal: '03725',
    titular_poblacion: 'Teulada',
    titular_provincia: 'Alicante',

    existe_interesado_representante: false,
    interesada_nombre: '',
    interesada_apellidos: '',
    interesada_dni_nif: '',

    vivienda_direccion_completa: '',
    vivienda_referencia_catastral: '123456789',
    vivienda_tipo_via: 'avenida',
    vivienda_nombre_via: 'Mediterráneo',
    vivienda_numero: '2',
    vivienda_piso: '1',
    vivienda_puerta: 'B',
    vivienda_codigo_postal: '03725',
    vivienda_poblacion: 'Teulada',
    vivienda_provincia: 'Alicante',
    vivienda_tipo_suelo: 'urbano',
    vivienda_ano_construccion: 1990,
    vivienda_superficie_total: 0,
    vivienda_superficie_construida: 0,
    vivienda_superficie_util: 0,
    vivienda_lista_plantas: [] as { tipo: string; descripcion: string }[],
    vivienda_alcantarillado_publico: false,
    vivienda_empresa_agua: 'Ayuntamiento',
    vivienda_empresa_luz: 'Iberdrola',
    vivienda_empresa_basura: 'Ayuntamiento',
    vivienda_lindero_frente: 'Vivienda',
    vivienda_lindero_fondo: 'Vivienda',
    vivienda_lindero_derecha: 'Vivienda',
    vivienda_lindero_izquierda: 'Vivienda',
    vivienda_lindero_arriba: 'Vivienda',
    vivienda_lindero_abajo: 'Vivienda',
    vivienda_num_arrendatarios: 2,
    vivienda_nombre_registro_propiedad: 'Jávea 2',
    vivienda_cru: '12345',
    vivienda_fecha_ultima_compra: '20/10/2000',
    vivienda_codigo_seguridad_icu: '123456789',
    vivienda_fecha_emision_icu: '11/12/2025',
    vivienda_es_estudio: false,
    vivienda_cantidad_dormitorios: 1,
    vivienda_numero_vt: '123',

    tecnico_arquitecto_seleccionado: null as any,
    tecnico_ingeniero_seleccionado: null as any,

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

    firma_cliente_imagen: '',

    estado_general_expediente: 'empezado',

    estado_fase_ccu: 'sin empezar',
    estado_fase_segunda_ocupacion: 'sin empezar',
    estado_fase_cee: 'sin empezar',
    estado_fase_registro_vt: 'sin empezar',
    estado_fase_nra: 'sin empezar',

    notas_fase_ccu: '',
    notas_fase_segunda_ocupacion: '',
    notas_fase_cee: '',
    notas_fase_registro_vt: '',
    notas_fase_nra: '',
  };

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
    private documentoService: DocumentoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarIngenieros();
    this.cargarArquitectos();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.esModoEdicion = true;
        this.idViviendaEditar = +id;
        this.cargarDatosParaEditar(this.idViviendaEditar);
      } else {
        this.esModoEdicion = false;
      }
    });
  }

  cargarDatosParaEditar(id: number) {
    this.isLoading = true;
    this.http.get<any[]>('http://192.168.1.41:3000/api/viviendas').subscribe({
      next: (data) => {
        const vivienda = data.find((v) => v.id === id);
        if (vivienda) {
          this.datosGlobales_gestor = {
            ...this.datosGlobales_gestor,
            ...vivienda,
          };
        }
        this.isLoading = false;
      },
      error: (e) => {
        console.error(e);
        this.isLoading = false;
      },
    });
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
    if (this.pasoActual_gestor < 8) {
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

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (
      this.pasoActual_gestor === 7 &&
      !this.datosGlobales_gestor.check_firma_digital_disponible
    ) {
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) this.procesarArchivo(blob);
            break;
          }
        }
      }
    }
  }

  cargarFirmaInput(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.procesarArchivo(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.datosGlobales_gestor.check_firma_digital_disponible) {
      this.isDragging = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (!this.datosGlobales_gestor.check_firma_digital_disponible) {
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        this.procesarArchivo(files[0]);
      }
    }
  }

  procesarArchivo(file: File) {
    if (!file.type.match(/image.*/)) {
      alert('Por favor, sube solo archivos de imagen (PNG, JPG, JPEG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          this.datosGlobales_gestor.firma_cliente_imagen = compressedDataUrl;
        }
      };
    };
    reader.readAsDataURL(file);
  }

  eliminarFirma() {
    this.datosGlobales_gestor.firma_cliente_imagen = '';
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

  finalizarExpediente_gestor() {
    this.isLoading = true;

    if (this.esModoEdicion && this.idViviendaEditar) {
      this.http
        .put(
          `http://192.168.1.41:3000/api/viviendas/${this.idViviendaEditar}`,
          this.datosGlobales_gestor
        )
        .subscribe({
          next: () => {
            this.isLoading = false;
            alert('¡Expediente actualizado correctamente!');
            this.router.navigate(['/gestion-viviendas']);
          },
          error: () => {
            this.isLoading = false;
            alert('Error al actualizar');
          },
        });
    } else {
      const datosNuevos = {
        ...this.datosGlobales_gestor,
        fechaCreacion: new Date().toISOString(),
      };

      this.http
        .post('http://192.168.1.41:3000/api/viviendas', datosNuevos)
        .subscribe({
          next: () => {
            this.isLoading = false;
            alert('¡Expediente creado correctamente!');
            this.router.navigate(['/gestion-viviendas']);
          },
          error: () => {
            this.isLoading = false;
            alert('Error al crear');
          },
        });
    }
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

  async generarDocumentoRepresentacionCCU2ocu(frase: string) {
    this.isLoading = true;
    try {
      await this.documentoService.generarRepresentacionCCU2ocu(
        this.datosGlobales_gestor,
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
        this.datosGlobales_gestor
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
      await this.documentoService.generarActaVisita(this.datosGlobales_gestor);
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
        this.datosGlobales_gestor
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
        this.datosGlobales_gestor
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
        this.datosGlobales_gestor
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
        this.datosGlobales_gestor
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar anexos.');
      this.isLoading = false;
    }

    this.isLoading = true;
    try {
      await this.documentoService.generarRegistroVT_SEGUNDA_PARTE(
        this.datosGlobales_gestor
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar anexos.');
      this.isLoading = false;
    }
  }
  async generarGuiaPresentacionTelematica() {
    this.isLoading = true;
    try {
      await this.documentoService.generarGuiaPresentacionNRA(
        this.datosGlobales_gestor
      );
      this.isLoading = false;
    } catch (err) {
      console.error(err);
      alert('Error al generar documento de NRA.');
      this.isLoading = false;
    }
  }

  compararProfesionales(obj1: any, obj2: any): boolean {
    if (!obj1 && !obj2) return true;
    if (!obj1 || !obj2) return false;
    return obj1.nombre === obj2.nombre;
  }
}
