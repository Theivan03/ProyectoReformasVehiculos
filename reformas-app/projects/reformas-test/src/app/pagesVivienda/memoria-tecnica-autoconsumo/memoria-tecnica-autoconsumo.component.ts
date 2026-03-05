import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  ArrowLeft,
  Box,
  Building,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Download,
  FileText,
  Home,
  ImageIcon,
  LucideAngularModule,
  MapPin,
  Save,
  User,
  Plus,
  Trash2,
  Zap,
} from 'lucide-angular';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import PizZip from 'pizzip';
import saveAs from 'file-saver';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { firstValueFrom } from 'rxjs';

type CaracteristicaAutoconsumoExclusiva =
  | 'tipoInstalacionAutoconsumo'
  | 'modalidadAutoconsumo'
  | 'tipoConexionAutoconsumo'
  | 'colectiva';

type TipoMemoriaDescriptiva =
  | 'nuevaInstalacion'
  | 'modificacionInstalacionExistente';

type CambioModificacionKey =
  | 'deConExcedentesASinExcedentes'
  | 'deSinExcedentesAConExcedentes'
  | 'deProduccionTodoTodoASinExcedentes'
  | 'deProduccionTodoTodoAConExcedentes'
  | 'conVariacionPotencia'
  | 'sustitucionEquipos'
  | 'otros';

type CampoInstalador = {
  key: string;
  label: string;
  value: string;
};

@Component({
  selector: 'app-memoria-tecnica-autoconsumo',
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    HttpClientModule,
    RouterModule,
  ],
  templateUrl: './memoria-tecnica-autoconsumo.component.html',
  styleUrl: './memoria-tecnica-autoconsumo.component.css',
})
export class MemoriaTecnicaAutoconsumoComponent {
  pasoActual = 1;
  totalPasos = 11;
  isGenerating = false;
  isSaving = false;
  isLoadingData = false;
  isLoadingInstaladores = false;
  instaladores: any[] = [];
  instaladorSeleccionadoNombre: string | null = null;
  private autoDownloadYaEjecutado = false;
  private tipoMemoriaRuta: 'consumo' | 'autoconsumo' = 'consumo';
  private readonly apiBaseUrl = `http://${window.location.hostname || 'localhost'}:3000`;

  icons = {
    FileText,
    User,
    MapPin,
    Zap,
    CheckSquare,
    Download,
    ChevronLeft,
    ChevronRight,
    Save,
    Home,
    Building,
    Box,
    ImageIcon,
    CloudUpload,
    ArrowLeft,
    Plus,
    Trash2,
  };

  readonly opcionesTipoContador = [
    { value: 'PF', label: 'PF (Bidireccional en punto frontera)' },
    { value: 'GN', label: 'GN (Medida de generación neta)' },
    { value: 'CT', label: 'CT (Medida consumo consumidor asociado)' },
    { value: 'GB', label: 'GB (Medida de generación bruta)' },
    { value: 'CSA', label: 'CSA (Medida consumo servicios auxiliares)' },
  ];

  readonly opcionesConfiguracionMedida = [
    {
      value: 'A',
      label: 'A - Un equipo de medida bidireccional en punto frontera',
    },
    {
      value: 'B',
      label:
        'B - Un equipo de medida bidireccional en punto de frontera y otro de generacion neta',
    },
    {
      value: 'C',
      label:
        'C - Un equipo de medida del consumo total y otro bidireccional de generacion neta',
    },
    {
      value: 'D',
      label:
        'D - Un equipo de medida del consumo total, otro de generacion bruta y otro de consumo de servicios auxiliares',
    },
    { value: 'E', label: 'E - Configuracion singular' },
  ];

  readonly opcionesAgrupacionPlacas = [
    { value: '', label: 'En blanco' },
    { value: 'si', label: 'Sí­' },
    { value: 'no', label: 'No' },
  ];

  readonly opcionesSiNoInversor = [
    { value: 'SI', label: 'Sí­' },
    { value: 'NO', label: 'No' },
  ];

  readonly opcionesTipoInstalacionAutoconsumo = [
    { value: 'redInterior', label: 'Red interior' },
    {
      value: 'redInteriorDiversosConsumidores',
      label: 'Red interior de diversos consumidores',
    },
    { value: 'proximaApartirDeRed', label: 'Próxima a partir de red' },
  ];

  readonly opcionesModalidadAutoconsumo = [
    { value: 'sinExcedentes', label: 'Sin excedentes' },
    { value: 'conExcedentes', label: 'Con excedentes' },
  ];

  readonly opcionesTipoConexionAutoconsumo = [
    { value: 'redInterior', label: 'Red interior' },
    {
      value: 'redInteriorVariosConsumidores',
      label: 'Red interior de varios consumidores',
    },
    { value: 'proximaATravesDeRed', label: 'Próxima a través de red' },
  ];

  readonly opcionesColectiva = [
    { value: 'si', label: 'Sí­' },
    { value: 'no', label: 'No' },
  ];

  readonly opcionesTipoMemoriaDescriptiva: {
    value: TipoMemoriaDescriptiva;
    label: string;
  }[] = [
    { value: 'nuevaInstalacion', label: 'Nueva instalación' },
    {
      value: 'modificacionInstalacionExistente',
      label: 'Modificación de instalación existente',
    },
  ];

  readonly opcionesCambioModificacion: {
    value: CambioModificacionKey;
    label: string;
  }[] = [
    {
      value: 'deConExcedentesASinExcedentes',
      label: 'De autoconsumo con excedentes a autoconsumo sin excedentes',
    },
    {
      value: 'deSinExcedentesAConExcedentes',
      label: 'De autoconsumo sin excedentes a autoconsumo con excedentes',
    },
    {
      value: 'deProduccionTodoTodoASinExcedentes',
      label: 'De producción \"todo-todo\" a autoconsumo sin excedentes',
    },
    {
      value: 'deProduccionTodoTodoAConExcedentes',
      label: 'De producción \"todo-todo\" a autoconsumo con excedentes',
    },
    { value: 'conVariacionPotencia', label: 'Con variación de potencia' },
    { value: 'sustitucionEquipos', label: 'Sustitución de equipos' },
    { value: 'otros', label: 'Otros' },
  ];

  readonly etiquetasCamposInstalador: Record<string, string> = {
    empresaInstaladoraOInstalador: 'Empresa instaladora / instalador',
    cifODni: 'CIF / DNI',
  };

  get isAutoconsumo(): boolean {
    return (
      this.normalizarTipoMemoria(
        this.datos.tipoMemoria,
        this.tipoMemoriaRuta,
      ) === 'autoconsumo'
    );
  }

  isDragOver: { [key: string]: boolean } = {
    planoMapsImagen: false,
    planoCatastroImagen: false,
    esquemaUnifilarImagen: false,
    croquisTrazadoImagen: false,
  };

  private crearInstaladorVacio() {
    return {
      empresaInstaladoraOInstalador: '',
      cifODni: '',
    };
  }

  datos = {
    id: null,
    tipoMemoria: 'consumo',
    // NUEVO: Control de dirección
    mismaDireccion: false, // Por defecto false (pide las dos)

    titular: {
      nombre: '',
      apellidos: '',
      nif: '',
      domicilio: '',
      cp: '',
      localidad: '',
      poblacion: '',
      provincia: '',
      telefono: '',
      correo: '',
    },
    emplazamiento: {
      direccion: '',
      localidad: '',
      poblacion: '',
      provincia: '',
      cp: '',
      cups: '',
      refCatastral: '',
      telefono: '',
      correo: '',
      tension: '',
      empresaDistribuidora: 'I-DE REDES ELÉCTRICAS INTELIGENTES, S.A.U.',
      uso: '',
      superficie: '',
      planoImagen: null as string | null,
    },
    caracteristicas: {
      potenciaInstalada: '',
      tipoCableMm2: '6',
      tipoInstalacion: 'monofasica',
      diametroTuboMm: '32',
      esquemaUnifilar: '1',
      tipoInstalacionAutoconsumo: 'redInterior',
      modalidadAutoconsumo: 'sinExcedentes',
      tipoConexionAutoconsumo: 'redInterior',
      colectiva: 'no',
      numeroConsumidores: '',
    },
    memoriaDescriptiva: {
      tipoActuacion: 'nuevaInstalacion' as TipoMemoriaDescriptiva,
      numeroRegAutoconsumo: '',
      cambios: {
        deConExcedentesASinExcedentes: false,
        deSinExcedentesAConExcedentes: false,
        deProduccionTodoTodoASinExcedentes: false,
        deProduccionTodoTodoAConExcedentes: false,
        conVariacionPotencia: false,
        sustitucionEquipos: false,
        otros: false,
      },
      descripcionOtros: '',
    },
    configuracionMedida: 'A',
    instalador: this.crearInstaladorVacio(),
    contadores: [this.crearContadorVacio()],
    placas: [this.crearPlacaVacia()],
    inversores: [this.crearInversorVacio()],
    energia: {
      energiaGeneradaAnualEstimadaKwhEnergia: '',
      energiaConsumidaAnualKwhEnergia: '',
      energiaAbocadaAnualEstimadaKwhEnergia: '',
    },
    lineas: [this.crearLineaVacia()],
    imagenes: {
      planoMapsImagen: null as string | null,
      planoCatastroImagen: null as string | null,
      tipoEsquemaUnifilarImagen: 'automatico' as 'automatico' | 'aportado',
      esquemaUnifilarImagen: null as string | null,
      croquisTrazadoImagen: null as string | null,
      descripcionCroquisImagen: '',
    },
    fechaFirma: { dia: '', mes: '', anyo: '', lugar: '' },
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cargarInstaladores();
    this.tipoMemoriaRuta = this.obtenerTipoMemoriaDesdeRuta();
    const autoDownload =
      this.route.snapshot.queryParamMap.get('autoDownload') === '1';
    const autoDownloadToken =
      this.route.snapshot.queryParamMap.get('dlToken') || '';
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatosDelServidor(id, autoDownload, autoDownloadToken);
      return;
    }
    this.datos.tipoMemoria = this.tipoMemoriaRuta;
    this.sincronizarLocalidadPoblacion();
    this.actualizarDiametroTubo();
    this.normalizarMemoriaDescriptiva();
    this.sincronizarInstaladorSeleccionadoConDatos();
  }

  cargarDatosDelServidor(
    id: string,
    autoDownload: boolean = false,
    autoDownloadToken: string = '',
  ) {
    this.isLoadingData = true;
    this.http.get(`${this.apiBaseUrl}/api/memorias/${id}`).subscribe({
      next: (data: any) => {
        // Mezcla profunda para mantener defaults de nuevas propiedades
        this.datos = {
          ...this.datos,
          ...data,
          titular: { ...this.datos.titular, ...(data?.titular || {}) },
          emplazamiento: {
            ...this.datos.emplazamiento,
            ...(data?.emplazamiento || {}),
          },
          caracteristicas: {
            ...this.datos.caracteristicas,
            ...(data?.caracteristicas || {}),
          },
          memoriaDescriptiva: {
            ...this.datos.memoriaDescriptiva,
            ...(data?.memoriaDescriptiva || {}),
            cambios: {
              ...this.datos.memoriaDescriptiva.cambios,
              ...(data?.memoriaDescriptiva?.cambios || {}),
            },
          },
          instalador: { ...this.datos.instalador, ...(data?.instalador || {}) },
          fechaFirma: { ...this.datos.fechaFirma, ...(data?.fechaFirma || {}) },
        };
        this.datos.tipoMemoria = this.normalizarTipoMemoria(
          this.datos.tipoMemoria,
          'consumo',
        );
        this.sincronizarLocalidadPoblacion();
        this.actualizarDiametroTubo();
        this.normalizarMemoriaDescriptiva();
        this.sincronizarInstaladorSeleccionadoConDatos();
        this.isLoadingData = false;
        if (
          autoDownload &&
          !this.autoDownloadYaEjecutado &&
          this.debeEjecutarAutoDownload(id, autoDownloadToken)
        ) {
          this.autoDownloadYaEjecutado = true;
          setTimeout(() => this.generarPDF(), 0);
        }
      },
      error: (err) => {
        console.error('Error cargando memoria:', err);
        alert('No se pudo cargar la memoria solicitada.');
        this.router.navigate(['/memorias']);
      },
    });
  }

  avanzarPaso() {
    // Si estamos en Paso 1 y es la misma dirección, saltamos el Paso 2 (Emplazamiento)
    if (this.pasoActual === 1 && this.datos.mismaDireccion) {
      this.pasoActual = 3;
    } else if (this.pasoActual < this.totalPasos) {
      this.pasoActual++;
    }
  }

  retrocederPaso() {
    // Si estamos en Paso 3 y es la misma dirección, volvemos al Paso 1
    if (this.pasoActual === 3 && this.datos.mismaDireccion) {
      this.pasoActual = 1;
    } else if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  volver() {
    this.router.navigate(['/memorias']);
  }

  private obtenerTipoMemoriaDesdeRuta(): 'consumo' | 'autoconsumo' {
    const urlActual = (this.router.url || '').toLowerCase();
    return urlActual.includes('/autoconsumo') ? 'autoconsumo' : 'consumo';
  }

  private normalizarTipoMemoria(
    tipo: any,
    fallback: 'consumo' | 'autoconsumo' = 'consumo',
  ): 'consumo' | 'autoconsumo' {
    const valor = String(tipo || '').toLowerCase();
    if (valor === 'autoconsumo') return 'autoconsumo';
    if (valor === 'consumo') return 'consumo';
    return fallback;
  }

  private debeEjecutarAutoDownload(id: string, token: string): boolean {
    try {
      const tokenNormalizado = token || 'sin-token';
      const key = `mtd_auto_download_${id}_${tokenNormalizado}`;
      if (window.sessionStorage.getItem(key) === '1') {
        return false;
      }
      window.sessionStorage.setItem(key, '1');
      return true;
    } catch {
      return true;
    }
  }

  private extraerSoloCalle(direccionCompleta: string): string {
    if (!direccionCompleta) return '';
    const trimmed = direccionCompleta.trim();
    const commaSplit = trimmed.split(',');
    if (commaSplit.length > 1) return commaSplit[0].trim();
    const match = trimmed.match(
      /^(.*?)\s+(?:\d+|s\/n|n(?:\u00BA|\u00B0|o)?\s*\d+)\b/i,
    );
    return match && match[1] ? match[1].trim() : trimmed;
  }

  private extraerNumeroEdificio(direccionCompleta: string): string {
    if (!direccionCompleta) return '';
    const upper = direccionCompleta.toUpperCase();

    if (/\bS\s*\/\s*N\b/.test(upper)) return 'S/N';

    const parts = direccionCompleta
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const numMatch = parts[1].match(/\d+/);
      if (numMatch) return numMatch[0];
    }

    const marcado = upper.match(/\bN[\u00BA\u00B0O]?\s*\.?\s*(\d+)\b/);
    if (marcado && marcado[1]) return marcado[1];

    let base = upper.split(',')[0];
    base = base.split(
      /\b(PISO|PTA|PUERTA|PLANTA|ESC|ESCALERA|BLOQUE|BAJO)\b/i,
    )[0];

    const ordinalIndex = base.search(/\d+\s*[\u00BA\u00AA]/);
    if (ordinalIndex !== -1) {
      base = base.slice(0, ordinalIndex);
    }

    const nums = base.match(/\d+/g);
    if (!nums || nums.length === 0) return '';
    return nums[nums.length - 1];
  }

  guardarEnServidor() {
    this.datos.tipoMemoria = this.normalizarTipoMemoria(
      this.datos.tipoMemoria,
      this.datos.id ? 'consumo' : this.tipoMemoriaRuta,
    );
    this.sincronizarLocalidadPoblacion();
    this.actualizarDiametroTubo();
    this.normalizarMemoriaDescriptiva();
    this.isSaving = true;

    const url = `${this.apiBaseUrl}/api/memorias`;

    this.http.post(url, this.datos).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.id) {
          this.datos.id = response.id; // Guardamos el ID por si le da a guardar otra vez (para editar)
          alert('Datos guardados correctamente en el servidor.');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al guardar:', error);
        alert('Error al conectar con el servidor. Revisa que está encendido.');
      },
    });
  }

  async generarPDF() {
    if (this.isGenerating) {
      return;
    }
    this.isGenerating = true;
    try {
      this.sincronizarLocalidadPoblacion();
      this.actualizarDiametroTubo();
      this.normalizarMemoriaDescriptiva();
      const cargarAsset = async (url: string): Promise<ArrayBuffer> => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `No se pudo cargar el recurso ${url} (HTTP ${res.status})`,
          );
        }
        return res.arrayBuffer();
      };
      // 1. CARGA DE RECURSOS
      const urlPdf = '/assets/MEMORIA_TECNICA_DISENO.pdf';
      const esquemaSeleccionado =
        this.datos.caracteristicas.esquemaUnifilar || '1';
      const esquemaUnifilarMap: Record<string, string> = {
        '1': '/assets/ESQUEMA VIVIENDA ELECTRIFICACION BASICA.png',
        '2': '/assets/GRADO DE ELETRIFICACION ELEVADA.png',
      };
      const urlEsquemaF =
        esquemaUnifilarMap[esquemaSeleccionado] || esquemaUnifilarMap['1'];
      const urlCuadroH = '/assets/cuadro.jpg';
      const urlPlanoI = '/assets/plano emplazamiento.png';

      const [existingPdfBytes, esquemaFBytes, cuadroHBytes, planoIBytes] =
        await Promise.all([
          cargarAsset(urlPdf),
          cargarAsset(urlEsquemaF),
          cargarAsset(urlCuadroH),
          cargarAsset(urlPlanoI),
        ]);

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      const fontHand = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);

      let esquemaImageF;
      try {
        esquemaImageF = await pdfDoc.embedPng(esquemaFBytes);
      } catch {
        esquemaImageF = await pdfDoc.embedJpg(esquemaFBytes);
      }
      const cuadroImageH = await pdfDoc.embedJpg(cuadroHBytes);
      const planoImageI = await pdfDoc.embedPng(planoIBytes);

      const colorBoli = rgb(0, 0, 0.7);

      // Helpers Campos
      const setField = (name: string, value: string) => {
        try {
          const f = form.getTextField(name);
          if (f) f.setText(value?.toString().toUpperCase() || '');
        } catch (e) {
          console.warn(`[MTD] Campo PDF no encontrado: ${name}`);
        }
      };
      const setCheck = (name: string, c: boolean) => {
        try {
          const f = form.getCheckBox(name);
          if (f) c ? f.check() : f.uncheck();
        } catch (e) {}
      };

      // --- RELLENADO DE DATOS ---
      if (this.datos.mismaDireccion) {
        const localidadTitular = this.obtenerLocalidadTitular();
        this.datos.emplazamiento.direccion = this.datos.titular.domicilio;
        this.datos.emplazamiento.localidad = localidadTitular;
        this.datos.emplazamiento.poblacion = this.datos.titular.poblacion;
        this.datos.emplazamiento.provincia = this.datos.titular.provincia;
        this.datos.emplazamiento.cp = this.datos.titular.cp;
        this.datos.emplazamiento.telefono = this.datos.titular.telefono;
        this.datos.emplazamiento.correo = this.datos.titular.correo;
      }

      // ... (Resto de asignaciones de campos A, B, C igual que antes) ...
      const titularNombreDocumento = this.construirNombreTitularParaDocumento();
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_NOM[0]',
        titularNombreDocumento,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_DNI[0]',
        this.datos.titular.nif,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_DOM[0]',
        this.datos.titular.domicilio,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_CP[0]',
        this.datos.titular.cp,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_LOC[0]',
        this.obtenerLocalidadTitular(),
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_PRO[0]',
        this.datos.titular.provincia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_TEL[0]',
        this.datos.titular.telefono,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_CORREO[0]',
        this.datos.titular.correo,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_EMPL[0]',
        this.datos.emplazamiento.direccion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_LOC[0]',
        this.obtenerLocalidadEmplazamiento(),
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_TEL[0]',
        this.datos.emplazamiento.cups,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_PROV[0]',
        this.datos.emplazamiento.provincia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_CP[0]',
        this.datos.emplazamiento.cp,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_REFCAD[0]',
        this.datos.emplazamiento.refCatastral,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Uso[0]',
        this.datos.emplazamiento.uso,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Superficie[0]',
        this.datos.emplazamiento.superficie,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_P_Instalada[0]',
        this.datos.caracteristicas.potenciaInstalada,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_SISTI[0]',
        this.datos.caracteristicas.tipoInstalacion === 'trifasica'
          ? '3x400/230V'
          : '1x230V',
      );

      const nombreCalleSolo = this.extraerSoloCalle(
        this.datos.emplazamiento.direccion,
      );

      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_DIA[0]',
        this.datos.fechaFirma.dia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Superficie[0]',
        this.datos.emplazamiento.superficie,
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_MES[0]',
        this.datos.fechaFirma.mes,
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_ANY[0]',
        this.datos.fechaFirma.anyo,
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_LLOC[0]',
        this.datos.fechaFirma.lugar,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C4_DIM[0]',
        `TUBO DE ${this.datos.caracteristicas.diametroTuboMm} mm`,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_T1[0].Fila6[0].C4_F6_C3[0]',
        `H07Z1(AS)CU, ${this.datos.caracteristicas.tipoCableMm2} m`,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_T1[0].Fila6[0].C4_F6_C4[0]',
        `H07Z1(AS)CU, ${this.datos.caracteristicas.tipoCableMm2} mm2`,
      );

      const pages = pdfDoc.getPages();
      const page5 = pages[4];
      const { width, height } = page5.getSize();

      const esquemaDims = esquemaImageF.scaleToFit(520, 150);
      page5.drawImage(esquemaImageF, {
        x: width / 2 - esquemaDims.width / 2,
        y: height - 310,
        width: esquemaDims.width,
        height: esquemaDims.height,
      });

      const cuadroDims = cuadroImageH.scaleToFit(480, 110);
      page5.drawImage(cuadroImageH, {
        x: width / 2 - cuadroDims.width / 2,
        y: 260,
        width: cuadroDims.width,
        height: cuadroDims.height,
      });

      const planoDims = planoImageI.scaleToFit(350, 150);
      const iX = width / 2 - planoDims.width / 2;
      const iY = 75;

      // Dibujamos la imagen de fondo
      page5.drawImage(planoImageI, {
        x: iX,
        y: iY,
        width: planoDims.width,
        height: planoDims.height,
      });

      // N?mero de la casa (edificio)
      let numeroCasa =
        this.extraerNumeroEdificio(this.datos.emplazamiento.direccion) || '7';

      page5.drawText(numeroCasa, {
        x: iX + planoDims.width / 2 - 25,
        y: iY + planoDims.height / 2,
        size: 14,
        font: fontHand,
        color: colorBoli,
      });

      // Nombre de la calle
      const textCalle = `${nombreCalleSolo.toUpperCase()}`;
      const textWidth = fontHand.widthOfTextAtSize(textCalle, 18);

      page5.drawText(textCalle, {
        x: width / 2 - textWidth / 2,
        y: iY + 50,
        size: 18,
        font: fontHand,
        color: colorBoli,
        rotate: degrees(1.5),
      });

      form.flatten();
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      saveAs(blob, `MTD_${titularNombreDocumento || 'Documento'}.pdf`);
      try {
        await this.generarManualUsoMantenimiento(titularNombreDocumento);
      } catch (manualError) {
        console.error(
          'Error generando manual de uso y mantenimiento:',
          manualError,
        );
        alert(
          'La memoria tecnica se ha generado, pero no se pudo generar el manual de uso y mantenimiento.',
        );
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Revisa la consola.');
    } finally {
      this.isGenerating = false;
    }
  }

  onDragOver(event: DragEvent, campo: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver[campo] = true;
  }

  onDragLeave(event: DragEvent, campo: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver[campo] = false;
  }

  onDrop(event: DragEvent, campo: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver[campo] = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivoImagen(
        files[0],
        campo as keyof typeof this.datos.imagenes,
      );
    }
  }

  onPaste(event: ClipboardEvent, campo: string) {
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            this.procesarArchivoImagen(
              file,
              campo as keyof typeof this.datos.imagenes,
            );
            break;
          }
        }
      }
    }
  }

  onFileSelected(event: Event, campo: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.procesarArchivoImagen(
        input.files[0],
        campo as keyof typeof this.datos.imagenes,
      );
    }
  }

  procesarArchivoImagen(file: File, campo: keyof typeof this.datos.imagenes) {
    if (!file.type.match(/image\/*/)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      (this.datos.imagenes as any)[campo] = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  eliminarImagen(campo: keyof typeof this.datos.imagenes, event: Event) {
    event.stopPropagation();
    (this.datos.imagenes as any)[campo] = null;
  }

  crearContadorVacio() {
    return {
      tipo: '',
      ubicacion: '',
      fabricante: '',
      modelo: '',
      numFabricacion: '',
      relacionIntensidad: '',
      tension: '',
      constanteLectura: '',
      clase: '',
      elementoCorte: '',
    };
  }

  agregarContador() {
    if (this.datos.contadores.length < 5) {
      this.datos.contadores.push(this.crearContadorVacio());
    }
  }

  eliminarContador(index: number) {
    if (this.datos.contadores.length > 1) {
      this.datos.contadores.splice(index, 1);
    }
  }

  crearPlacaVacia() {
    return {
      fabricante: '',
      modelo: '',
      numPlacas: '',
      potMaxUnit: '',
      corrienteMaxPotencia: '',
      tensionCircuitoAbierto: '',
      icc: '',
      tensionMaxPotencia: '',
      superficieTotal: '',
      agrupacionPlacas: '',
    };
  }

  agregarPlaca() {
    if (this.datos.placas.length < 3) {
      this.datos.placas.push(this.crearPlacaVacia());
    }
  }

  eliminarPlaca(index: number) {
    if (this.datos.placas.length > 1) {
      this.datos.placas.splice(index, 1);
    }
  }

  crearInversorVacio() {
    return {
      numUnidadesInversor: '',
      fabricanteInversor: '',
      modeloInversor: '',
      tensionNominalAcInversor: '',
      potenciaAcInversor: '',
      vccMaximaInversor: '',
      vccMinimaInversor: '',
      conexionInversor: '',
      proteccionVacBajaInversor: 'SI',
      tensionActuacionVacBajaInversor: '',
      proteccionVacAltaInversor: 'SI',
      tensionActuacionVacAltaInversor: '',
      proteccionFrecuenciaBajaInversor: 'SI',
      frecuenciaActuacionBajaInversor: '',
      proteccionFrecuenciaAltaInversor: 'SI',
      frecuenciaActuacionAltaInversor: '',
      proteccionIslaInversor: 'SI',
    };
  }

  agregarInversor() {
    if (this.datos.inversores.length < 5) {
      this.datos.inversores.push(this.crearInversorVacio());
    }
  }

  eliminarInversor(index: number) {
    if (this.datos.inversores.length > 1) {
      this.datos.inversores.splice(index, 1);
    }
  }

  crearLineaVacia() {
    return {
      denominacionLinea: '',
      potenciaPrevistaKwLinea: '',
      longitudMLinea: '',
      dispositivoProteccionInALinea: '',
      materialConductorSeccionMm2Linea: '',
      intensidadAdmisibleIzALinea: '',
      caidaTensionAuPorcentajeLinea: '',
    };
  }

  agregarLinea() {
    if (this.datos.lineas.length < 9) {
      this.datos.lineas.push(this.crearLineaVacia());
    }
  }

  eliminarLinea(index: number) {
    if (this.datos.lineas.length > 1) {
      this.datos.lineas.splice(index, 1);
    }
  }

  private construirNombreTitularParaDocumento(): string {
    const apellidos = (this.datos.titular.apellidos || '').trim();
    const nombre = (this.datos.titular.nombre || '').trim();

    return [apellidos, nombre].filter(Boolean).join(' ').replace(/\s+/g, ' ');
  }

  private async generarManualUsoMantenimiento(
    titularNombreDocumento: string,
  ): Promise<void> {
    const plantillaUrl =
      '/assets/MANUAL DE USO Y MANTENIMIENTO DE INSTALACION ELECTRICA.docx';
    const arrayBuffer = await fetch(plantillaUrl).then((r) => r.arrayBuffer());
    const zip = new PizZip(arrayBuffer);

    const documentXmlFile = zip.file('word/document.xml');
    if (!documentXmlFile) {
      throw new Error('No se encuentra word/document.xml en la plantilla DOCX');
    }

    const titularManual =
      (titularNombreDocumento || this.datos.titular.nombre || '')
        .trim()
        .toUpperCase() || ' ';
    const direccionManual =
      (this.datos.emplazamiento.direccion || this.datos.titular.domicilio || '')
        .trim()
        .toUpperCase() || ' ';
    const cpManual =
      (this.datos.emplazamiento.cp || this.datos.titular.cp || '')
        .trim()
        .toUpperCase() || ' ';
    const poblacionManual =
      (
        this.datos.emplazamiento.localidad ||
        this.datos.emplazamiento.poblacion ||
        this.datos.titular.localidad ||
        this.datos.titular.poblacion ||
        ''
      )
        .trim()
        .toUpperCase() || ' ';
    const provinciaManual =
      (this.datos.emplazamiento.provincia || this.datos.titular.provincia || '')
        .trim()
        .toUpperCase() || ' ';

    let documentXml = documentXmlFile.asText();
    documentXml = documentXml
      .replace('CONSTRUCCIONES JUST SA', this.escaparXml(titularManual))
      .replace(
        'AVENIDA LLAURADOR, 31-5, 1Âº 2',
        this.escaparXml(direccionManual),
      )
      .replace('46780', this.escaparXml(cpManual))
      .replace('OLIVA', this.escaparXml(poblacionManual))
      .replace('VALENCIA', this.escaparXml(provinciaManual));

    zip.file('word/document.xml', documentXml);

    const docxBlob = zip.generate({
      type: 'blob',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const nombreLimpio = this.limpiarNombreArchivo(
      titularNombreDocumento || 'Documento',
    );
    const pdfBlob = await this.convertirDocxAPdf(
      docxBlob,
      `MANUAL_USO_Y_MANTENIMIENTO_${nombreLimpio}.docx`,
    );
    saveAs(pdfBlob, `MANUAL_USO_Y_MANTENIMIENTO_${nombreLimpio}.pdf`);
  }

  private async convertirDocxAPdf(
    docxBlob: Blob,
    nombreArchivoDocx: string,
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('doc', docxBlob, nombreArchivoDocx);

    return firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/convertir-docx-a-pdf`, formData, {
        responseType: 'blob',
      }),
    );
  }

  private escaparXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private limpiarNombreArchivo(value: string): string {
    const limpio = value
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return limpio || 'Documento';
  }

  private obtenerLocalidadTitular(): string {
    return this.datos.titular.localidad || this.datos.titular.poblacion || '';
  }

  private obtenerLocalidadEmplazamiento(): string {
    return (
      this.datos.emplazamiento.localidad ||
      this.datos.emplazamiento.poblacion ||
      ''
    );
  }

  get informacionInstaladorSeleccionado(): CampoInstalador[] {
    return Object.entries(this.datos.instalador || {})
      .filter(
        ([, valor]) =>
          valor !== null &&
          valor !== undefined &&
          String(valor).trim().length > 0,
      )
      .map(([key, value]) => ({
        key,
        label: this.formatearEtiquetaCampoInstalador(key),
        value: String(value),
      }));
  }

  cargarInstaladores() {
    this.isLoadingInstaladores = true;
    this.http.get<any>(`${this.apiBaseUrl}/instaladores`).subscribe({
      next: (data) => {
        this.instaladores = Array.isArray(data) ? data : data ? [data] : [];
        this.sincronizarInstaladorSeleccionadoConDatos();
        this.isLoadingInstaladores = false;
      },
      error: (err) => {
        console.error('Error al cargar instaladores:', err);
        this.instaladores = [];
        this.sincronizarInstaladorSeleccionadoConDatos();
        this.isLoadingInstaladores = false;
      },
    });
  }

  seleccionarInstalador(nombreInstalador: string | null) {
    this.instaladorSeleccionadoNombre = nombreInstalador;
    if (!nombreInstalador) {
      this.datos.instalador = this.crearInstaladorVacio();
      return;
    }

    const instalador = this.obtenerInstaladorPorNombre(nombreInstalador);
    if (instalador) {
      this.datos.instalador = { ...instalador };
      return;
    }

    this.datos.instalador = {
      ...this.crearInstaladorVacio(),
      empresaInstaladoraOInstalador: nombreInstalador,
    };
  }

  obtenerNombreInstalador(instalador: any): string {
    const nombreEmpresa = String(
      instalador?.empresaInstaladoraOInstalador || instalador?.nombre || '',
    ).trim();
    if (nombreEmpresa) return nombreEmpresa;

    const nombrePersona = [instalador?.nombre, instalador?.apellidos]
      .map((parte) => String(parte || '').trim())
      .filter(Boolean)
      .join(' ');
    return nombrePersona.trim();
  }

  private sincronizarInstaladorSeleccionadoConDatos() {
    const nombre = this.obtenerNombreInstalador(this.datos.instalador);
    this.instaladorSeleccionadoNombre = nombre || null;
  }

  private obtenerInstaladorPorNombre(nombreInstalador: string): any | null {
    const nombreBuscado = this.normalizarTextoComparacion(nombreInstalador);
    return (
      this.instaladores.find(
        (instalador) =>
          this.normalizarTextoComparacion(
            this.obtenerNombreInstalador(instalador),
          ) === nombreBuscado,
      ) || null
    );
  }

  private normalizarTextoComparacion(valor: any): string {
    return String(valor || '')
      .trim()
      .toLowerCase();
  }

  private formatearEtiquetaCampoInstalador(clave: string): string {
    if (this.etiquetasCamposInstalador[clave]) {
      return this.etiquetasCamposInstalador[clave];
    }

    const normalizado = clave
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();

    if (!normalizado) return clave;
    return normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
  }

  seleccionarOpcionExclusiva(
    campo: CaracteristicaAutoconsumoExclusiva,
    valor: string,
  ) {
    this.datos.caracteristicas[campo] = valor;
    if (campo === 'colectiva' && valor !== 'si') {
      this.datos.caracteristicas.numeroConsumidores = '';
    }
    this.normalizarCamposAutoconsumo();
  }

  seleccionarTipoMemoriaDescriptiva(tipo: TipoMemoriaDescriptiva) {
    this.datos.memoriaDescriptiva.tipoActuacion = tipo;
    this.normalizarMemoriaDescriptiva();
  }

  alternarCambioModificacion(campo: CambioModificacionKey, checked: boolean) {
    const cambios = this.datos.memoriaDescriptiva.cambios;

    if (campo === 'otros') {
      cambios.otros = checked;
      if (checked) {
        this.desmarcarCambiosModificacionNoOtros();
      } else {
        this.datos.memoriaDescriptiva.descripcionOtros = '';
      }
      this.normalizarMemoriaDescriptiva();
      return;
    }

    cambios[campo] = checked;
    if (checked && cambios.otros) {
      cambios.otros = false;
      this.datos.memoriaDescriptiva.descripcionOtros = '';
    }

    this.normalizarMemoriaDescriptiva();
  }

  private normalizarCamposAutoconsumo() {
    const normalizar = (
      valor: string,
      opciones: { value: string }[],
      fallback: string,
    ): string => {
      return opciones.some((opcion) => opcion.value === valor)
        ? valor
        : fallback;
    };

    const caracteristicas = this.datos.caracteristicas;
    caracteristicas.tipoInstalacionAutoconsumo = normalizar(
      caracteristicas.tipoInstalacionAutoconsumo,
      this.opcionesTipoInstalacionAutoconsumo,
      'redInterior',
    );
    caracteristicas.modalidadAutoconsumo = normalizar(
      caracteristicas.modalidadAutoconsumo,
      this.opcionesModalidadAutoconsumo,
      'sinExcedentes',
    );
    caracteristicas.tipoConexionAutoconsumo = normalizar(
      caracteristicas.tipoConexionAutoconsumo,
      this.opcionesTipoConexionAutoconsumo,
      'redInterior',
    );
    caracteristicas.colectiva = normalizar(
      caracteristicas.colectiva,
      this.opcionesColectiva,
      'no',
    );

    if (caracteristicas.colectiva !== 'si') {
      caracteristicas.numeroConsumidores = '';
      return;
    }

    const numeroConsumidores = Number(caracteristicas.numeroConsumidores);
    caracteristicas.numeroConsumidores =
      Number.isFinite(numeroConsumidores) && numeroConsumidores > 0
        ? String(Math.trunc(numeroConsumidores))
        : '';
  }

  private desmarcarCambiosModificacionNoOtros() {
    const cambios = this.datos.memoriaDescriptiva.cambios;
    this.opcionesCambioModificacion
      .filter((opcion) => opcion.value !== 'otros')
      .forEach((opcion) => {
        cambios[opcion.value] = false;
      });
  }

  private limpiarCambiosModificacion() {
    const cambios = this.datos.memoriaDescriptiva.cambios;
    this.opcionesCambioModificacion.forEach((opcion) => {
      cambios[opcion.value] = false;
    });
    this.datos.memoriaDescriptiva.numeroRegAutoconsumo = '';
    this.datos.memoriaDescriptiva.descripcionOtros = '';
  }

  private normalizarMemoriaDescriptiva() {
    const memoria = this.datos.memoriaDescriptiva;
    memoria.tipoActuacion =
      memoria.tipoActuacion === 'modificacionInstalacionExistente'
        ? 'modificacionInstalacionExistente'
        : 'nuevaInstalacion';

    if (memoria.tipoActuacion !== 'modificacionInstalacionExistente') {
      this.limpiarCambiosModificacion();
      return;
    }

    memoria.numeroRegAutoconsumo = String(
      memoria.numeroRegAutoconsumo || '',
    ).trim();

    this.opcionesCambioModificacion.forEach((opcion) => {
      memoria.cambios[opcion.value] = Boolean(memoria.cambios[opcion.value]);
    });

    if (memoria.cambios.otros) {
      this.desmarcarCambiosModificacionNoOtros();
      memoria.descripcionOtros = String(memoria.descripcionOtros || '').trim();
    } else {
      memoria.descripcionOtros = '';
    }
  }

  private sincronizarLocalidadPoblacion() {
    const sincronizar = (obj: { localidad?: string; poblacion?: string }) => {
      const localidad = (obj.localidad || '').trim();
      const poblacion = (obj.poblacion || '').trim();

      if (!localidad && poblacion) {
        obj.localidad = poblacion;
      }
      if (!poblacion && localidad) {
        obj.poblacion = localidad;
      }
    };

    sincronizar(this.datos.titular);
    sincronizar(this.datos.emplazamiento);
  }

  actualizarDiametroTubo() {
    this.normalizarCamposAutoconsumo();

    const tipoInstalacionNormalizado =
      this.datos.caracteristicas.tipoInstalacion === 'trifasica'
        ? 'trifasica'
        : 'monofasica';
    this.datos.caracteristicas.tipoInstalacion = tipoInstalacionNormalizado;

    const tipoCableNormalizado = Number(
      this.datos.caracteristicas.tipoCableMm2,
    );
    const tipoCable = [6, 10, 16].includes(tipoCableNormalizado)
      ? tipoCableNormalizado
      : 6;
    this.datos.caracteristicas.tipoCableMm2 = String(tipoCable);

    const esquemaNormalizado = String(
      this.datos.caracteristicas.esquemaUnifilar || '1',
    );
    this.datos.caracteristicas.esquemaUnifilar = ['1', '2', '3'].includes(
      esquemaNormalizado,
    )
      ? esquemaNormalizado
      : '1';

    if (tipoCable === 16) {
      this.datos.caracteristicas.diametroTuboMm = '50';
      return;
    }

    if (tipoCable === 6 || tipoCable === 10) {
      this.datos.caracteristicas.diametroTuboMm =
        tipoInstalacionNormalizado === 'trifasica' ? '40' : '32';
      return;
    }

    this.datos.caracteristicas.diametroTuboMm = '';
  }
}
