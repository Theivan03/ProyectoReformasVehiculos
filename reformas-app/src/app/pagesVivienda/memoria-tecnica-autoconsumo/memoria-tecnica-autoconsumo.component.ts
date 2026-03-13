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

type CambiosModificacion = Record<CambioModificacionKey, boolean>;

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

  // Sustituye tu array en la parte superior de la clase por este:
  readonly opcionesTipoContador = [
    {
      value:
        'PF (Bidireccional en punt frontera / Bidireccional en punto frontera)',
      label: 'PF (Bidireccional en punto frontera)',
    },
    {
      value: 'GN (Mesura de generació neta / Medida de generación neta)',
      label: 'GN (Medida de generación neta)',
    },
    {
      value:
        'CT (Mesura consum consumidor associat / Medida consumo \nconsumidor asociado)',
      label: 'CT (Medida consumo consumidor asociado)',
    },
    {
      value: 'GB (Mesura de generació bruta / Medida de generación bruta)',
      label: 'GB (Medida de generación bruta)',
    },
    {
      value:
        'CSA (Mesura consum serveis auxiliars / Medida consumo servicios auxiliares)',
      label: 'CSA (Medida consumo servicios auxiliares)',
    },
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
    { value: 'blanco', label: 'En blanco' },
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
      } as CambiosModificacion,
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
    fechaFirma: {
      presupuestoTotalEurosEnergia: '',
      dia: '',
      mes: '',
      anyo: '',
      lugar: '',
    },
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
          this.tipoMemoriaRuta,
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
        alert('No se pudo cargar la memoria solicitada.');
        this.router.navigate(['/memorias']);
      },
    });
  }

  async generarPDFIDs() {
    if (this.isGenerating) return;
    this.isGenerating = true;

    try {
      const cargarAssetPdf = async (
        urlDocumentoPdf: string,
      ): Promise<ArrayBuffer> => {
        const respuestaFetchPdf = await fetch(urlDocumentoPdf);
        return respuestaFetchPdf.arrayBuffer();
      };

      const rutaPlantillaPdf = '/assets/PLANTILLA MTD AutoConsumo.pdf';
      const bufferOriginalPdf = await cargarAssetPdf(rutaPlantillaPdf);
      const documentoCargadoPdf = await PDFDocument.load(bufferOriginalPdf);
      const formularioInteractivoPdf = documentoCargadoPdf.getForm();
      const camposTotalesPdf = formularioInteractivoPdf.getFields();
      const nombresCamposPdf = camposTotalesPdf.map((campo) => campo.getName());
      const setNombresCamposPdf = new Set(nombresCamposPdf);

      const normalizarNombreCampoPdf = (nombreCampoPdf: string) => {
        // Ya no eliminamos la barra invertida, porque el PDF la tiene.
        return nombreCampoPdf;
      };

      const resolverNombreCampoPdf = (
        nombreCampoPdf: string,
      ): string | null => {
        if (setNombresCamposPdf.has(nombreCampoPdf)) return nombreCampoPdf;

        // Como fallback, probamos a añadir la doble barra invertida si el usuario
        // la pasó como simple, para que coincida con el volcado JSON.
        const conDobleEscape = nombreCampoPdf.replace(/\\\./g, '\\\\.');
        if (setNombresCamposPdf.has(conDobleEscape)) return conDobleEscape;

        return null;
      };

      const corregirMojibake = (texto: string) => {
        const valor = String(texto || '');
        if (!valor) return '';
        try {
          if (typeof TextDecoder === 'undefined') return valor;
          const bytes = Uint8Array.from(valor, (char) => char.charCodeAt(0));
          const decoded = new TextDecoder('utf-8', { fatal: false }).decode(
            bytes,
          );
          return decoded.includes('\uFFFD') ? valor : decoded;
        } catch {
          return valor;
        }
      };

      const normalizarTextoOpcion = (texto: string) =>
        corregirMojibake(texto)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

      const extraerCodigoOpcion = (texto: string) =>
        normalizarTextoOpcion(texto).split(/[\s(]/)[0] || '';

      const seleccionarOpcionDesplegablePdf = (
        nombreCampoPdf: string,
        valorDeseadoCampoPdf: string,
      ): boolean => {
        const nombreReal = resolverNombreCampoPdf(nombreCampoPdf);
        if (!nombreReal) {
          return false;
        }

        const valorTexto = String(valorDeseadoCampoPdf || '').trim();
        if (!valorTexto) return false;

        const valorNormalizado = normalizarTextoOpcion(valorTexto);
        const codigoDeseado = extraerCodigoOpcion(valorTexto);

        const intentarSeleccion = (campo: any): boolean => {
          if (!campo) return false;
          const opciones = (campo as any).getOptions?.();
          if (Array.isArray(opciones) && opciones.length > 0) {
            const opcionExacta = opciones.find(
              (op: string) => normalizarTextoOpcion(op) === valorNormalizado,
            );
            const opcionPorCodigo =
              opcionExacta ||
              (codigoDeseado
                ? opciones.find(
                    (op: string) => extraerCodigoOpcion(op) === codigoDeseado,
                  )
                : undefined);
            const opcionParcial =
              opcionPorCodigo ||
              (valorNormalizado
                ? opciones.find((op: string) =>
                    normalizarTextoOpcion(op).includes(valorNormalizado),
                  )
                : undefined);
            const opcionFinal = opcionParcial || opcionExacta;
            if (opcionFinal) {
              campo.select(opcionFinal);
              return true;
            }
          }

          try {
            campo.select(valorTexto);
            return true;
          } catch {
            return false;
          }
        };

        try {
          const campoDesplegablePdf =
            formularioInteractivoPdf.getDropdown(nombreReal);
          if (intentarSeleccion(campoDesplegablePdf)) return true;
        } catch {}

        try {
          const campoListaOpcionesPdf =
            formularioInteractivoPdf.getOptionList(nombreReal);
          if (intentarSeleccion(campoListaOpcionesPdf)) return true;
        } catch {}

        return false;
      };

      const obtenerPaginaPorNombreCampo = (nombreCampoPdf: string) => {
        const match = nombreCampoPdf.match(/Pagina(\d+)/i);
        if (!match) return null;
        const indice = Number.parseInt(match[1], 10) - 1;
        const paginas = documentoCargadoPdf.getPages();
        return paginas[indice] || null;
      };

      const obtenerRectCampoPdf = (nombreCampoPdf: string) => {
        const nombreReal = resolverNombreCampoPdf(nombreCampoPdf);
        if (!nombreReal) return null;
        try {
          const campo: any = formularioInteractivoPdf.getField(nombreReal);
          const widgets = campo?.acroField?.getWidgets?.() || [];
          const rect = widgets[0]?.getRectangle?.();
          if (!rect) return null;
          return { rect, nombreReal };
        } catch {
          return null;
        }
      };

      const dataUrlToUint8 = (dataUrl: string): Uint8Array | null => {
        const contenido = String(dataUrl || '');
        if (!contenido) return null;
        const parts = contenido.split(',');
        if (parts.length < 2) return null;
        try {
          const binary = atob(parts[1]);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes;
        } catch {
          return null;
        }
      };

      const cargarBytesDesdeUrl = async (
        url: string,
      ): Promise<Uint8Array | null> => {
        if (!url) return null;
        try {
          const respuesta = await fetch(url);
          if (!respuesta.ok) return null;
          const buffer = await respuesta.arrayBuffer();
          return new Uint8Array(buffer);
        } catch {
          return null;
        }
      };

      const embedImageBytes = async (bytes: Uint8Array) => {
        try {
          return await documentoCargadoPdf.embedPng(bytes);
        } catch {
          return await documentoCargadoPdf.embedJpg(bytes);
        }
      };

      const cargarImagen = async (fuente: string) => {
        const valor = String(fuente || '').trim();
        if (!valor) return null;
        if (valor.startsWith('data:')) {
          const bytes = dataUrlToUint8(valor);
          if (!bytes) return null;
          return embedImageBytes(bytes);
        }
        const bytes = await cargarBytesDesdeUrl(valor);
        if (!bytes) return null;
        return embedImageBytes(bytes);
      };

      const dibujarImagenEnRect = (
        pagina: any,
        imagen: any,
        rect: { x: number; y: number; width: number; height: number },
      ) => {
        if (!pagina || !imagen) return;
        const dims = imagen.scaleToFit(rect.width, rect.height);
        const x = rect.x + (rect.width - dims.width) / 2;
        const y = rect.y + (rect.height - dims.height) / 2;
        pagina.drawImage(imagen, {
          x,
          y,
          width: dims.width,
          height: dims.height,
        });
      };

      const fuenteCroquis = await documentoCargadoPdf.embedFont(
        StandardFonts.Helvetica,
      );

      const setField = (nombreCampoPdf: string, valorCampoPdf: string) => {
        try {
          const nombreReal = resolverNombreCampoPdf(nombreCampoPdf);
          if (!nombreReal) {
            return;
          }
          const campoTextoEditablePdf =
            formularioInteractivoPdf.getTextField(nombreReal);
          if (campoTextoEditablePdf) {
            campoTextoEditablePdf.setText(
              valorCampoPdf?.toString().toUpperCase() || '',
            );
          }
        } catch (errorSetFieldPdf) {}
      };

      const setCheckFormularioPdf = (
        nombreCampoPdf: string,
        estadoCheckPdf: boolean,
      ) => {
        try {
          const nombreReal = resolverNombreCampoPdf(nombreCampoPdf);
          if (!nombreReal) {
            return;
          }
          const campoCheckboxPdf =
            formularioInteractivoPdf.getCheckBox(nombreReal);
          if (campoCheckboxPdf) {
            estadoCheckPdf
              ? campoCheckboxPdf.check()
              : campoCheckboxPdf.uncheck();
          }
        } catch (errorSetCheckPdf) {}
      };

      const obtenerOpcionesRadioPdf = (nombreCampoRadioPdf: string) => {
        try {
          const nombreReal = resolverNombreCampoPdf(nombreCampoRadioPdf);
          if (!nombreReal) {
            return;
          }
          const campoRadioGrupoPdf =
            formularioInteractivoPdf.getRadioGroup(nombreReal);
          const opcionesDisponiblesRadioPdf = campoRadioGrupoPdf.getOptions();
          void opcionesDisponiblesRadioPdf;
        } catch (errorRadioPdf) {}
      };

      const seleccionarOpcionRadioPdf = (
        nombreCampoRadioPdf: string,
        valorElegidoRadioPdf: string,
      ) => {
        try {
          const nombreReal = resolverNombreCampoPdf(nombreCampoRadioPdf);
          if (!nombreReal) {
            return;
          }
          const campoRadioGrupoPdf =
            formularioInteractivoPdf.getRadioGroup(nombreReal);
          campoRadioGrupoPdf.select(valorElegidoRadioPdf);
        } catch (errorRadioSeleccionPdf) {}
      };

      // Debug de campos eliminado.

      //Inicio

      let valorElegidoModalidadPdf =
        this.datos.caracteristicas.modalidadAutoconsumo === 'conExcedentes'
          ? '1'
          : '2';
      obtenerOpcionesRadioPdf('form1[0].Pagina1[0].cabecera[0].tipo[0]');
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina1[0].cabecera[0].tipo[0]',
        valorElegidoModalidadPdf,
      );

      valorElegidoModalidadPdf =
        this.datos.caracteristicas.modalidadAutoconsumo === 'conExcedentes'
          ? '2'
          : '1';
      obtenerOpcionesRadioPdf('form1[0].Pagina1[0].seccion\\.c[0].C_11[0]');
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina1[0].seccion\\.c[0].C_11[0]',
        valorElegidoModalidadPdf,
      );

      const camposTipoContadorPdf = [
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_1[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_2[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_3[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_4[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_5[0]',
      ];

      camposTipoContadorPdf.forEach((campoPdf, index) => {
        const tipoContador = String(
          this.datos.contadores[index]?.tipo || '',
        ).trim();
        if (!tipoContador) return;
        seleccionarOpcionDesplegablePdf(campoPdf, tipoContador);
      });

      if (
        !seleccionarOpcionDesplegablePdf(
          'form1[0].Pagina2[0].seccion\\.e1[0].E_1[0]',
          this.datos.configuracionMedida,
        )
      ) {
        setField(
          'form1[0].Pagina2[0].seccion\\.e1[0].E_1[0]',
          this.datos.configuracionMedida,
        );
      }

      if (
        this.datos.caracteristicas.tipoInstalacionAutoconsumo === 'redInterior'
      )
        valorElegidoModalidadPdf = '1';
      if (
        this.datos.caracteristicas.tipoInstalacionAutoconsumo ===
        'redInteriorDiversosConsumidores'
      )
        valorElegidoModalidadPdf = '2';
      if (
        this.datos.caracteristicas.tipoInstalacionAutoconsumo ===
        'proximaApartirDeRed'
      )
        valorElegidoModalidadPdf = '3';
      obtenerOpcionesRadioPdf('form1[0].Pagina1[0].seccion\\.c[0].C10[0]');
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina1[0].seccion\\.c[0].C10[0]',
        valorElegidoModalidadPdf,
      );

      if (this.datos.caracteristicas.tipoConexionAutoconsumo === 'redInterior')
        valorElegidoModalidadPdf = '1';
      if (
        this.datos.caracteristicas.tipoConexionAutoconsumo ===
        'redInteriorVariosConsumidores'
      )
        valorElegidoModalidadPdf = '2';
      if (
        this.datos.caracteristicas.tipoConexionAutoconsumo ===
        'proximaATravesDeRed'
      )
        valorElegidoModalidadPdf = '3';
      obtenerOpcionesRadioPdf('form1[0].Pagina1[0].seccion\\.c[0].C_12[0]');
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina1[0].seccion\\.c[0].C_12[0]',
        valorElegidoModalidadPdf,
      );

      valorElegidoModalidadPdf =
        this.datos.caracteristicas.colectiva === 'no' ? '1' : '2';
      obtenerOpcionesRadioPdf('form1[0].Pagina1[0].seccion\\.c[0].C_13[0]');
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina1[0].seccion\\.c[0].C_13[0]',
        valorElegidoModalidadPdf,
      );

      valorElegidoModalidadPdf =
        this.datos.memoriaDescriptiva.tipoActuacion === 'nuevaInstalacion'
          ? '1'
          : '2';
      obtenerOpcionesRadioPdf('form1[0].Pagina1[0].seccion\\.d[0].D_1[0]');
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_1[0]',
        valorElegidoModalidadPdf,
      );

      const cambiosModificacion = this.datos.memoriaDescriptiva.cambios;
      setCheckFormularioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_3[0]',
        Boolean(cambiosModificacion.deConExcedentesASinExcedentes),
      );
      setCheckFormularioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_4[0]',
        Boolean(cambiosModificacion.deSinExcedentesAConExcedentes),
      );
      setCheckFormularioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_5[0]',
        Boolean(cambiosModificacion.deProduccionTodoTodoASinExcedentes),
      );
      setCheckFormularioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_6[0]',
        Boolean(cambiosModificacion.deProduccionTodoTodoAConExcedentes),
      );
      setCheckFormularioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_7[0]',
        Boolean(cambiosModificacion.conVariacionPotencia),
      );
      setCheckFormularioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_8[0]',
        Boolean(cambiosModificacion.sustitucionEquipos),
      );
      setCheckFormularioPdf(
        'form1[0].Pagina1[0].seccion\\.d[0].D_9[0]',
        Boolean(cambiosModificacion.otros),
      );

      if (this.datos.placas[0].agrupacionPlacas === 'blanco')
        valorElegidoModalidadPdf = '0';
      if (this.datos.placas[0].agrupacionPlacas === 'si')
        valorElegidoModalidadPdf = '1';
      if (this.datos.placas[0].agrupacionPlacas === 'no')
        valorElegidoModalidadPdf = '2';
      obtenerOpcionesRadioPdf(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila10[0].D12_F1_C1[0].D12_F1_C1[0]',
      );
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila10[0].D12_F1_C1[0].D12_F1_C1[0]',
        valorElegidoModalidadPdf,
      );

      if (this.datos.placas.length > 1) {
        if (this.datos.placas[1].agrupacionPlacas === 'blanco')
          valorElegidoModalidadPdf = '0';
        if (this.datos.placas[1].agrupacionPlacas === 'si')
          valorElegidoModalidadPdf = '1';
        if (this.datos.placas[1].agrupacionPlacas === 'no')
          valorElegidoModalidadPdf = '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina2[0].Tabla_D12[0].Fila10[0].D12_F1_C2[0].D12_F1_C2[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina2[0].Tabla_D12[0].Fila10[0].D12_F1_C2[0].D12_F1_C2[0]',
          valorElegidoModalidadPdf,
        );
      }

      if (this.datos.placas.length > 2) {
        if (this.datos.placas[2].agrupacionPlacas === 'blanco')
          valorElegidoModalidadPdf = '0';
        if (this.datos.placas[2].agrupacionPlacas === 'si')
          valorElegidoModalidadPdf = '1';
        if (this.datos.placas[2].agrupacionPlacas === 'no')
          valorElegidoModalidadPdf = '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina2[0].Tabla_D12[0].Fila10[0].D12_F1_C3[0].D12_F1_C3[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina2[0].Tabla_D12[0].Fila10[0].D12_F1_C3[0].D12_F1_C3[0]',
          valorElegidoModalidadPdf,
        );
      }

      valorElegidoModalidadPdf =
        this.datos.inversores[0].proteccionVacBajaInversor === 'SI' ? '1' : '2';
      obtenerOpcionesRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C2[0].SI_NO[0]',
      );
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C2[0].SI_NO[0]',
        valorElegidoModalidadPdf,
      );
      valorElegidoModalidadPdf =
        this.datos.inversores[0].proteccionVacAltaInversor === 'SI' ? '1' : '2';
      obtenerOpcionesRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C2[0].SI_NO[0]',
      );
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C2[0].SI_NO[0]',
        valorElegidoModalidadPdf,
      );
      valorElegidoModalidadPdf =
        this.datos.inversores[0].proteccionFrecuenciaBajaInversor === 'SI'
          ? '1'
          : '2';
      obtenerOpcionesRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C2[0].SI_NO[0]',
      );
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C2[0].SI_NO[0]',
        valorElegidoModalidadPdf,
      );

      valorElegidoModalidadPdf =
        this.datos.inversores[0].proteccionFrecuenciaAltaInversor === 'SI'
          ? '1'
          : '2';
      obtenerOpcionesRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C2[0].SI_NO[0]',
      );
      seleccionarOpcionRadioPdf(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C2[0].SI_NO[0]',
        valorElegidoModalidadPdf,
      );

      if (this.datos.inversores.length > 1) {
        valorElegidoModalidadPdf =
          this.datos.inversores[1].proteccionVacBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C3[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C3[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[1].proteccionVacAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C3[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C3[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[1].proteccionFrecuenciaBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C6[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C6[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );

        valorElegidoModalidadPdf =
          this.datos.inversores[1].proteccionFrecuenciaAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C3[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C3[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
      }

      if (this.datos.inversores.length > 2) {
        valorElegidoModalidadPdf =
          this.datos.inversores[2].proteccionVacBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C4[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C4[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[2].proteccionVacAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C4[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C4[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[2].proteccionFrecuenciaBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C3[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C3[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );

        valorElegidoModalidadPdf =
          this.datos.inversores[2].proteccionFrecuenciaAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C4[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C4[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
      }

      if (this.datos.inversores.length > 3) {
        valorElegidoModalidadPdf =
          this.datos.inversores[3].proteccionVacBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C5[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C5[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[3].proteccionVacAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C5[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C5[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[3].proteccionFrecuenciaBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C4[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C4[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );

        valorElegidoModalidadPdf =
          this.datos.inversores[3].proteccionFrecuenciaAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C5[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C5[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
      }

      if (this.datos.inversores.length > 4) {
        valorElegidoModalidadPdf =
          this.datos.inversores[4].proteccionVacBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C6[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila8[0].TC111_F8_C6[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[4].proteccionVacAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C6[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila10[0].TC111_F10_C6[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[4].proteccionFrecuenciaBajaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C6[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila12[0].TC111_F12_C6[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
        valorElegidoModalidadPdf =
          this.datos.inversores[4].proteccionFrecuenciaAltaInversor === 'SI'
            ? '1'
            : '2';
        obtenerOpcionesRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C6[0].SI_NO[0]',
        );
        seleccionarOpcionRadioPdf(
          'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila14[0].TC111_F14_C6[0].SI_NO[0]',
          valorElegidoModalidadPdf,
        );
      }

      setField(
        'form1[0].Pagina1[0].cabecera[0].CAU[0]',
        this.datos.emplazamiento.cups + '1FA000',
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_1[0]',
        this.datos.titular.nombre + ' ' + this.datos.titular.apellidos,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_2[0]',
        this.datos.titular.nif,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_3[0]',
        this.datos.titular.domicilio,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_4[0]',
        this.datos.titular.cp,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_5[0]',
        this.datos.titular.localidad,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_6[0]',
        this.datos.titular.poblacion,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_7[0]',
        this.datos.titular.provincia,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_8[0]',
        this.datos.titular.telefono,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_10[0]',
        this.datos.titular.correo,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_1[0]',
        this.datos.emplazamiento.direccion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_2[0]',
        this.datos.emplazamiento.cp,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_3[0]',
        this.datos.emplazamiento.localidad,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_4[0]',
        this.datos.emplazamiento.poblacion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_5[0]',
        this.datos.emplazamiento.provincia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_6[0]',
        this.datos.emplazamiento.refCatastral,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_7[0]',
        this.datos.emplazamiento.cups,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_8[0]',
        this.datos.emplazamiento.telefono,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_10[0]',
        this.datos.emplazamiento.correo,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_1[0]',
        this.datos.emplazamiento.direccion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_2[0]',
        this.datos.titular.telefono,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_3[0]',
        this.datos.emplazamiento.localidad,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_4[0]',
        this.datos.emplazamiento.poblacion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_5[0]',
        this.datos.emplazamiento.provincia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_6[0]',
        this.datos.emplazamiento.cp,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_7[0]',
        this.datos.caracteristicas.potenciaInstalada,
      );
      if (
        !seleccionarOpcionDesplegablePdf(
          'form1[0].Pagina1[0].seccion\\.c[0].C_8[0]',
          this.datos.emplazamiento.tension,
        )
      ) {
        setField(
          'form1[0].Pagina1[0].seccion\\.c[0].C_8[0]',
          this.datos.emplazamiento.tension,
        );
      }
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_9[0]',
        this.datos.emplazamiento.empresaDistribuidora,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_14[0]',
        this.datos.caracteristicas.numeroConsumidores,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.d[0].D_2[0]',
        this.datos.memoriaDescriptiva.numeroRegAutoconsumo,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.d[0].D_10[0]',
        this.datos.memoriaDescriptiva.descripcionOtros,
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila2[0].E_3_1[0]',
        this.datos.contadores[0]?.ubicacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila2[0].E_3_2[0]',
        this.datos.contadores[1]?.ubicacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila2[0].E_3_3[0]',
        this.datos.contadores[2]?.ubicacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila2[0].E_3_4[0]',
        this.datos.contadores[3]?.ubicacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila2[0].E_3_5[0]',
        this.datos.contadores[4]?.ubicacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila3[0].E_4_1[0]',
        this.datos.contadores[0]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila3[0].E_4_2[0]',
        this.datos.contadores[1]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila3[0].E_4_3[0]',
        this.datos.contadores[2]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila3[0].E_4_4[0]',
        this.datos.contadores[3]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila3[0].E_4_5[0]',
        this.datos.contadores[4]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila4[0].E_5_1[0]',
        this.datos.contadores[0]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila4[0].E_5_3[0]',
        this.datos.contadores[1]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila4[0].E_5_4[0]',
        this.datos.contadores[2]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila4[0].E_5_5[0]',
        this.datos.contadores[3]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila4[0].E_5_6[0]',
        this.datos.contadores[4]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila5[0].E_6_1[0]',
        this.datos.contadores[0]?.numFabricacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila5[0].E_6_2[0]',
        this.datos.contadores[1]?.numFabricacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila5[0].E_6_3[0]',
        this.datos.contadores[2]?.numFabricacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila5[0].E_6_4[0]',
        this.datos.contadores[3]?.numFabricacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila5[0].E_6_5[0]',
        this.datos.contadores[4]?.numFabricacion || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila6[0].E_7_1[0]',
        this.datos.contadores[0]?.relacionIntensidad || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila6[0].E_7_2[0]',
        this.datos.contadores[1]?.relacionIntensidad || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila6[0].E_7_3[0]',
        this.datos.contadores[2]?.relacionIntensidad || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila6[0].E_7_4[0]',
        this.datos.contadores[3]?.relacionIntensidad || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila6[0].E_7_5[0]',
        this.datos.contadores[4]?.relacionIntensidad || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila7[0].E_8_1[0]',
        this.datos.contadores[0]?.tension || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila7[0].E_8_2[0]',
        this.datos.contadores[1]?.tension || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila7[0].E_8_3[0]',
        this.datos.contadores[2]?.tension || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila7[0].E_8_4[0]',
        this.datos.contadores[3]?.tension || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila7[0].E_8_5[0]',
        this.datos.contadores[4]?.tension || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila8[0].E_9_1[0]',
        this.datos.contadores[0]?.constanteLectura || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila8[0].E_9_2[0]',
        this.datos.contadores[1]?.constanteLectura || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila8[0].E_9_3[0]',
        this.datos.contadores[2]?.constanteLectura || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila8[0].E_9_4[0]',
        this.datos.contadores[3]?.constanteLectura || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila8[0].E_9_5[0]',
        this.datos.contadores[4]?.constanteLectura || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila9[0].E_10_1[0]',
        this.datos.contadores[0]?.clase || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila9[0].E_10_2[0]',
        this.datos.contadores[1]?.clase || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila9[0].E_10_3[0]',
        this.datos.contadores[2]?.clase || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila9[0].E_10_4[0]',
        this.datos.contadores[3]?.clase || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila9[0].E_10_5[0]',
        this.datos.contadores[4]?.clase || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila10[0].E_11_1[0]',
        this.datos.contadores[0]?.elementoCorte || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila10[0].E_11_2[0]',
        this.datos.contadores[1]?.elementoCorte || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila10[0].E_11_3[0]',
        this.datos.contadores[2]?.elementoCorte || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila10[0].E_11_4[0]',
        this.datos.contadores[3]?.elementoCorte || '',
      );
      setField(
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila10[0].E_11_5[0]',
        this.datos.contadores[4]?.elementoCorte || '',
      );

      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila1[0].D12_F1_C1[0]',
        this.datos.placas[0]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila1[0].D12_F1_C2[0]',
        this.datos.placas[1]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila1[0].D12_F1_C3[0]',
        this.datos.placas[2]?.fabricante || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila2[0].D12_F2_C1[0]',
        this.datos.placas[0]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila2[0].D12_F2_C2[0]',
        this.datos.placas[1]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila2[0].D12_F2_C3[0]',
        this.datos.placas[2]?.modelo || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila3[0].D12_F3_C1[0]',
        this.datos.placas[0]?.numPlacas || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila3[0].D12_F3_C2[0]',
        this.datos.placas[1]?.numPlacas || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila3[0].D12_F3_C3[0]',
        this.datos.placas[2]?.numPlacas || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila4[0].D12_F4_C1[0]',
        this.datos.placas[0]?.potMaxUnit || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila4[0].D12_F4_C2[0]',
        this.datos.placas[1]?.potMaxUnit || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila4[0].D12_F4_C3[0]',
        this.datos.placas[2]?.potMaxUnit || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila5[0].D12_F5_C1[0]',
        this.datos.placas[0]?.corrienteMaxPotencia || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila5[0].D12_F5_C2[0]',
        this.datos.placas[1]?.corrienteMaxPotencia || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila5[0].D12_F5_C3[0]',
        this.datos.placas[2]?.corrienteMaxPotencia || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila6[0].D12_F6_C1[0]',
        this.datos.placas[0]?.tensionCircuitoAbierto || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila6[0].D12_F6_C2[0]',
        this.datos.placas[1]?.tensionCircuitoAbierto || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila6[0].D12_F6_C3[0]',
        this.datos.placas[2]?.tensionCircuitoAbierto || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila7[0].D12_F7_C1[0]',
        this.datos.placas[0]?.icc || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila7[0].D12_F7_C2[0]',
        this.datos.placas[1]?.icc || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila7[0].D12_F7_C3[0]',
        this.datos.placas[2]?.icc || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila8[0].D12_F8_C1[0]',
        this.datos.placas[0]?.tensionMaxPotencia || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila8[0].D12_F8_C2[0]',
        this.datos.placas[1]?.tensionMaxPotencia || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila8[0].D12_F8_C3[0]',
        this.datos.placas[2]?.tensionMaxPotencia || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila9[0].D12_F9_C1[0]',
        this.datos.placas[0]?.superficieTotal || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila9[0].D12_F9_C2[0]',
        this.datos.placas[1]?.superficieTotal || '',
      );
      setField(
        'form1[0].Pagina2[0].Tabla_D12[0].Fila9[0].D12_F9_C3[0]',
        this.datos.placas[2]?.superficieTotal || '',
      );

      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila0[0].TC2A_F0_C1[0]',
        this.datos.inversores[0]?.numUnidadesInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila0[0].TC2A_F0_C2[0]',
        this.datos.inversores[1]?.numUnidadesInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila0[0].TC2A_F0_C3[0]',
        this.datos.inversores[2]?.numUnidadesInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila0[0].TC2A_F0_C4[0]',
        this.datos.inversores[3]?.numUnidadesInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila0[0].TC2A_F0_C5[0]',
        this.datos.inversores[4]?.numUnidadesInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila1[0].TC2A_F1_C1[0]',
        this.datos.inversores[0]?.fabricanteInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila1[0].TC2A_F1_C2[0]',
        this.datos.inversores[1]?.fabricanteInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila1[0].TC2A_F1_C3[0]',
        this.datos.inversores[2]?.fabricanteInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila1[0].TC2A_F1_C4[0]',
        this.datos.inversores[3]?.fabricanteInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila1[0].TC2A_F1_C5[0]',
        this.datos.inversores[4]?.fabricanteInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila2[0].TC2A_F2_C1[0]',
        this.datos.inversores[0]?.modeloInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila2[0].TC2A_F2_C2[0]',
        this.datos.inversores[1]?.modeloInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila2[0].TC2A_F2_C3[0]',
        this.datos.inversores[2]?.modeloInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila2[0].TC2A_F2_C4[0]',
        this.datos.inversores[3]?.modeloInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila2[0].TC2A_F2_C5[0]',
        this.datos.inversores[4]?.modeloInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila3[0].TC2A_F3_C1[0]',
        this.datos.inversores[0]?.tensionNominalAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila3[0].TC2A_F3_C2[0]',
        this.datos.inversores[1]?.tensionNominalAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila3[0].TC2A_F3_C3[0]',
        this.datos.inversores[2]?.tensionNominalAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila3[0].TC2A_F3_C4[0]',
        this.datos.inversores[3]?.tensionNominalAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila3[0].TC2A_F3_C5[0]',
        this.datos.inversores[4]?.tensionNominalAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila4[0].TC2A_F4_C1[0]',
        this.datos.inversores[0]?.potenciaAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila4[0].TC2A_F4_C2[0]',
        this.datos.inversores[1]?.potenciaAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila4[0].TC2A_F4_C3[0]',
        this.datos.inversores[2]?.potenciaAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila4[0].TC2A_F4_C4[0]',
        this.datos.inversores[3]?.potenciaAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila4[0].TC2A_F4_C5[0]',
        this.datos.inversores[4]?.potenciaAcInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila5[0].TC111_F5_C1[0]',
        this.datos.inversores[0]?.vccMaximaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila5[0].TC111_F5_C2[0]',
        this.datos.inversores[1]?.vccMaximaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila5[0].TC111_F5_C3[0]',
        this.datos.inversores[2]?.vccMaximaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila5[0].TC111_F5_C4[0]',
        this.datos.inversores[3]?.vccMaximaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila5[0].TC111_F5_C5[0]',
        this.datos.inversores[4]?.vccMaximaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila6[0].TC111_F6_C2[0]',
        this.datos.inversores[0]?.vccMinimaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila6[0].TC111_F6_C3[0]',
        this.datos.inversores[1]?.vccMinimaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila6[0].TC111_F6_C4[0]',
        this.datos.inversores[2]?.vccMinimaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila6[0].TC111_F6_C5[0]',
        this.datos.inversores[3]?.vccMinimaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila6[0].TC111_F6_C6[0]',
        this.datos.inversores[4]?.vccMinimaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila7[0].TC111_F7_C2[0]',
        this.datos.inversores[0]?.conexionInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila7[0].TC111_F7_C3[0]',
        this.datos.inversores[1]?.conexionInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila7[0].TC111_F7_C4[0]',
        this.datos.inversores[2]?.conexionInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila7[0].TC111_F7_C5[0]',
        this.datos.inversores[3]?.conexionInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila7[0].TC111_F7_C6[0]',
        this.datos.inversores[4]?.conexionInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila9[0].TC111_F9_C2[0]',
        this.datos.inversores[0]?.tensionActuacionVacBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila9[0].TC111_F9_C3[0]',
        this.datos.inversores[1]?.tensionActuacionVacBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila9[0].TC111_F9_C4[0]',
        this.datos.inversores[2]?.tensionActuacionVacBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila9[0].TC111_F9_C5[0]',
        this.datos.inversores[3]?.tensionActuacionVacBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila9[0].TC111_F9_C6[0]',
        this.datos.inversores[4]?.tensionActuacionVacBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila11[0].TC111_F11_C2[0]',
        this.datos.inversores[0]?.tensionActuacionVacAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila11[0].TC111_F11_C3[0]',
        this.datos.inversores[1]?.tensionActuacionVacAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila11[0].TC111_F11_C4[0]',
        this.datos.inversores[2]?.tensionActuacionVacAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila11[0].TC111_F11_C5[0]',
        this.datos.inversores[3]?.tensionActuacionVacAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila11[0].TC111_F11_C6[0]',
        this.datos.inversores[4]?.tensionActuacionVacAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila13[0].TC111_F13_C2[0]',
        this.datos.inversores[0]?.frecuenciaActuacionBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila13[0].TC111_F13_C3[0]',
        this.datos.inversores[1]?.frecuenciaActuacionBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila13[0].TC111_F13_C4[0]',
        this.datos.inversores[2]?.frecuenciaActuacionBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila13[0].TC111_F13_C5[0]',
        this.datos.inversores[3]?.frecuenciaActuacionBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila13[0].TC111_F13_C6[0]',
        this.datos.inversores[4]?.frecuenciaActuacionBajaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila15[0].TC111_F15_C2[0]',
        this.datos.inversores[0]?.frecuenciaActuacionAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila15[0].TC111_F15_C3[0]',
        this.datos.inversores[1]?.frecuenciaActuacionAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila15[0].TC111_F15_C4[0]',
        this.datos.inversores[2]?.frecuenciaActuacionAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila15[0].TC111_F15_C5[0]',
        this.datos.inversores[3]?.frecuenciaActuacionAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila15[0].TC111_F15_C6[0]',
        this.datos.inversores[4]?.frecuenciaActuacionAltaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila16[0].TC111_F16_C1[0]',
        this.datos.inversores[0]?.proteccionIslaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila16[0].TC111_F16_C2[0]',
        this.datos.inversores[1]?.proteccionIslaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila16[0].TC111_F16_C3[0]',
        this.datos.inversores[2]?.proteccionIslaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila16[0].TC111_F16_C4[0]',
        this.datos.inversores[3]?.proteccionIslaInversor || '',
      );
      setField(
        'form1[0].Pagina3[0].sUBF1[0].TabC2A[0].Fila16[0].TC111_F16_C5[0]',
        this.datos.inversores[4]?.proteccionIslaInversor || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.d3[0].D11_2[0]',
        this.datos.energia.energiaGeneradaAnualEstimadaKwhEnergia,
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.d3[0].D11_1[0]',
        this.datos.energia.energiaConsumidaAnualKwhEnergia,
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.d3[0].D11_3[0]',
        this.datos.energia.energiaAbocadaAnualEstimadaKwhEnergia,
      );

      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila1[0].TE2_F1_C1[0]',
        this.datos.lineas[0]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila1[0].TE2_F1_C2[0]',
        this.datos.lineas[0]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila1[0].TE2_F1_C3[0]',
        this.datos.lineas[0]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila1[0].TE2_F1_C4[0]',
        this.datos.lineas[0]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila1[0].TE2_F1_C5[0]',
        this.datos.lineas[0]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila1[0].TE2_F1_C6[0]',
        this.datos.lineas[0]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila1[0].TE2_F1_C7[0]',
        this.datos.lineas[0]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila2[0].TE2_F2_C1[0]',
        this.datos.lineas[1]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila2[0].TE2_F2_C2[0]',
        this.datos.lineas[1]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila2[0].TE2_F2_C3[0]',
        this.datos.lineas[1]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila2[0].TE2_F2_C4[0]',
        this.datos.lineas[1]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila2[0].TE2_F2_C5[0]',
        this.datos.lineas[1]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila2[0].TE2_F2_C6[0]',
        this.datos.lineas[1]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila2[0].TE2_F2_C7[0]',
        this.datos.lineas[1]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila3[0].TE2_F3_C1[0]',
        this.datos.lineas[2]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila3[0].TE2_F3_C2[0]',
        this.datos.lineas[2]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila3[0].TE2_F3_C3[0]',
        this.datos.lineas[2]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila3[0].TE2_F3_C4[0]',
        this.datos.lineas[2]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila3[0].TE2_F3_C5[0]',
        this.datos.lineas[2]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila3[0].TE2_F3_C6[0]',
        this.datos.lineas[2]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila3[0].TE2_F3_C7[0]',
        this.datos.lineas[2]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila4[0].TE2_F4_C1[0]',
        this.datos.lineas[3]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila4[0].TE2_F4_C2[0]',
        this.datos.lineas[3]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila4[0].TE2_F4_C3[0]',
        this.datos.lineas[3]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila4[0].TE2_F4_C4[0]',
        this.datos.lineas[3]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila4[0].TE2_F4_C5[0]',
        this.datos.lineas[3]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila4[0].TE2_F4_C6[0]',
        this.datos.lineas[3]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila4[0].TE2_F4_C7[0]',
        this.datos.lineas[3]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila5[0].TE2_F5_C1[0]',
        this.datos.lineas[4]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila5[0].TE2_F5_C2[0]',
        this.datos.lineas[4]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila5[0].TE2_F5_C3[0]',
        this.datos.lineas[4]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila5[0].TE2_F5_C4[0]',
        this.datos.lineas[4]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila5[0].TE2_F5_C5[0]',
        this.datos.lineas[4]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila5[0].TE2_F5_C6[0]',
        this.datos.lineas[4]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila5[0].TE2_F5_C7[0]',
        this.datos.lineas[4]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila6[0].TE2_F6_C1[0]',
        this.datos.lineas[5]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila6[0].TE2_F6_C2[0]',
        this.datos.lineas[5]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila6[0].TE2_F6_C3[0]',
        this.datos.lineas[5]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila6[0].TE2_F6_C4[0]',
        this.datos.lineas[5]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila6[0].TE2_F6_C5[0]',
        this.datos.lineas[5]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila6[0].TE2_F6_C6[0]',
        this.datos.lineas[5]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila6[0].TE2_F6_C7[0]',
        this.datos.lineas[5]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila7[0].TE2_F7_C1[0]',
        this.datos.lineas[6]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila7[0].TE2_F7_C2[0]',
        this.datos.lineas[6]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila7[0].TE2_F7_C3[0]',
        this.datos.lineas[6]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila7[0].TE2_F7_C4[0]',
        this.datos.lineas[6]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila7[0].TE2_F7_C5[0]',
        this.datos.lineas[6]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila7[0].TE2_F7_C6[0]',
        this.datos.lineas[6]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila7[0].TE2_F7_C7[0]',
        this.datos.lineas[6]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila8[0].TE2_F8_C1[0]',
        this.datos.lineas[7]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila8[0].TE2_F8_C2[0]',
        this.datos.lineas[7]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila8[0].TE2_F8_C3[0]',
        this.datos.lineas[7]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila8[0].TE2_F8_C4[0]',
        this.datos.lineas[7]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila8[0].TE2_F8_C5[0]',
        this.datos.lineas[7]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila8[0].TE2_F8_C6[0]',
        this.datos.lineas[7]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila8[0].TE2_F8_C7[0]',
        this.datos.lineas[7]?.caidaTensionAuPorcentajeLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila9[0].TE2_F9_C1[0]',
        this.datos.lineas[8]?.denominacionLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila9[0].TE2_F9_C2[0]',
        this.datos.lineas[8]?.potenciaPrevistaKwLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila9[0].TE2_F9_C3[0]',
        this.datos.lineas[8]?.longitudMLinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila9[0].TE2_F9_C4[0]',
        this.datos.lineas[8]?.dispositivoProteccionInALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila9[0].TE2_F9_C5[0]',
        this.datos.lineas[8]?.materialConductorSeccionMm2Linea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila9[0].TE2_F9_C6[0]',
        this.datos.lineas[8]?.intensidadAdmisibleIzALinea || '',
      );
      setField(
        'form1[0].Pagina4[0].seccion\\.e[0].TablaE2[0].Fila9[0].TE2_F9_C7[0]',
        this.datos.lineas[8]?.caidaTensionAuPorcentajeLinea || '',
      );

      setField(
        'form1[0].Pagina7[0].seccion\\.j[0].j_CT1[0]',
        this.datos.fechaFirma.presupuestoTotalEurosEnergia || '',
      );
      setField(
        'form1[0].Pagina7[0].seccion\\.k[0].FI_LLOC2[0]',
        this.datos.fechaFirma.lugar || '',
      );
      setField(
        'form1[0].Pagina7[0].seccion\\.k[0].FI_DIA2[0]',
        this.datos.fechaFirma.dia || '',
      );
      setField(
        'form1[0].Pagina7[0].seccion\\.k[0].FI_MES2[0]',
        this.datos.fechaFirma.mes || '',
      );
      setField(
        'form1[0].Pagina7[0].seccion\\.k[0].FI_ANY2[0]',
        this.datos.fechaFirma.anyo || '',
      );
      setField(
        'form1[0].Pagina7[0].seccion\\.k[0].J_FIRMAINS[0]',
        this.datos.instalador.empresaInstaladoraOInstalador || '',
      );
      setField(
        'form1[0].Pagina7[0].seccion\\.k[0].J_DNIINS[0]',
        this.datos.instalador.cifODni || '',
      );

      const planoRect = obtenerRectCampoPdf(
        'form1[0].Pagina4[0].seccion\\.i[0].I_CT1[0]',
      );
      const paginaPlano = obtenerPaginaPorNombreCampo(
        'form1[0].Pagina4[0].seccion\\.i[0].I_CT1[0]',
      );
      if (planoRect && paginaPlano) {
        const imagenMapa = await cargarImagen(
          this.datos.imagenes.planoMapsImagen || '',
        );
        const imagenCatastro = await cargarImagen(
          this.datos.imagenes.planoCatastroImagen || '',
        );
        const separacion = 8;
        const inset = 4;
        const anchoMedio = Math.max(0, (planoRect.rect.width - separacion) / 2);
        const rectIzq = {
          x: planoRect.rect.x,
          y: planoRect.rect.y,
          width: anchoMedio,
          height: planoRect.rect.height,
        };
        const rectDer = {
          x: planoRect.rect.x + anchoMedio + separacion,
          y: planoRect.rect.y,
          width: anchoMedio,
          height: planoRect.rect.height,
        };
        const rectIzqInset = {
          x: rectIzq.x + inset,
          y: rectIzq.y + inset,
          width: Math.max(0, rectIzq.width - inset * 2),
          height: Math.max(0, rectIzq.height - inset * 2),
        };
        const rectDerInset = {
          x: rectDer.x + inset,
          y: rectDer.y + inset,
          width: Math.max(0, rectDer.width - inset * 2),
          height: Math.max(0, rectDer.height - inset * 2),
        };
        if (imagenMapa)
          dibujarImagenEnRect(paginaPlano, imagenMapa, rectIzqInset);
        if (imagenCatastro)
          dibujarImagenEnRect(paginaPlano, imagenCatastro, rectDerInset);
      }

      const unifilarRect = obtenerRectCampoPdf(
        'form1[0].Pagina5[0].seccion\\.g[0].G_1[0]',
      );
      const paginaUnifilar = obtenerPaginaPorNombreCampo(
        'form1[0].Pagina5[0].seccion\\.g[0].G_1[0]',
      );
      if (unifilarRect && paginaUnifilar) {
        const usarAutomatico =
          this.datos.imagenes.tipoEsquemaUnifilarImagen !== 'aportado';
        const fuenteEsquema = usarAutomatico
          ? '/assets/unifilar.jpeg'
          : this.datos.imagenes.esquemaUnifilarImagen || '';
        const imagenEsquema = await cargarImagen(fuenteEsquema);
        if (imagenEsquema) {
          const inset = 4;
          const rectInset = {
            x: unifilarRect.rect.x + inset,
            y: unifilarRect.rect.y + inset,
            width: Math.max(0, unifilarRect.rect.width - inset * 2),
            height: Math.max(0, unifilarRect.rect.height - inset * 2),
          };
          dibujarImagenEnRect(paginaUnifilar, imagenEsquema, rectInset);
        }
      }

      const croquisRect = obtenerRectCampoPdf(
        'form1[0].Pagina6[0].seccion\\.h[0].H_CT1[0]',
      );
      const paginaCroquis = obtenerPaginaPorNombreCampo(
        'form1[0].Pagina6[0].seccion\\.h[0].H_CT1[0]',
      );
      if (croquisRect && paginaCroquis) {
        const padding = 6;
        const interlineado = 1.2;
        let fontSize = 11;
        const textoCroquis = String(
          this.datos.imagenes.descripcionCroquisImagen || '',
        );
        const textoCroquisNormalizado = textoCroquis.trim();

        const ajustarLineas = (texto: string, maxWidth: number) => {
          const resultado: string[] = [];
          const lineas = texto.replace(/\r\n/g, '\n').split('\n');
          lineas.forEach((linea) => {
            const limpio = linea.replace(/\s+/g, ' ').trim();
            if (!limpio) {
              resultado.push('');
              return;
            }
            const palabras = limpio.split(' ');
            let actual = '';
            palabras.forEach((palabra) => {
              const candidato = actual ? `${actual} ${palabra}` : palabra;
              const ancho = fuenteCroquis.widthOfTextAtSize(
                candidato,
                fontSize,
              );
              if (ancho <= maxWidth) {
                actual = candidato;
              } else {
                if (actual) resultado.push(actual);
                actual = palabra;
              }
            });
            if (actual) resultado.push(actual);
          });
          return resultado;
        };

        const anchoTextoMax = Math.max(0, croquisRect.rect.width - padding * 2);
        let lineasTexto = textoCroquisNormalizado
          ? ajustarLineas(textoCroquis, anchoTextoMax)
          : [];
        let altoTexto = lineasTexto.length * fontSize * interlineado;

        const espacioEntre = lineasTexto.length > 0 ? 6 : 0;
        const altoDisponibleParaTexto =
          croquisRect.rect.height - padding * 2 - espacioEntre;
        if (altoTexto > altoDisponibleParaTexto && lineasTexto.length > 0) {
          fontSize = Math.max(
            8,
            Math.floor((altoDisponibleParaTexto / lineasTexto.length) * 0.95),
          );
          lineasTexto = ajustarLineas(textoCroquis, anchoTextoMax);
          altoTexto = lineasTexto.length * fontSize * interlineado;
        }

        if (lineasTexto.length > 0) {
          let yTexto =
            croquisRect.rect.y + croquisRect.rect.height - padding - fontSize;
          lineasTexto.forEach((linea) => {
            paginaCroquis.drawText(linea, {
              x: croquisRect.rect.x + padding,
              y: yTexto,
              size: fontSize,
              font: fuenteCroquis,
              color: rgb(0, 0, 0),
            });
            yTexto -= fontSize * interlineado;
          });
        }

        const altoImagen =
          croquisRect.rect.height - altoTexto - padding * 2 - espacioEntre;
        if (altoImagen > 4) {
          const imagenCroquis = await cargarImagen(
            this.datos.imagenes.croquisTrazadoImagen || '',
          );
          if (imagenCroquis) {
            const rectImagen = {
              x: croquisRect.rect.x + padding,
              y: croquisRect.rect.y + padding,
              width: croquisRect.rect.width - padding * 2,
              height: altoImagen,
            };
            dibujarImagenEnRect(paginaCroquis, imagenCroquis, rectImagen);
          }
        }
      }

      //Final

      const documentoFinalBytesPdf = await documentoCargadoPdf.save();
      const blobDocumentoPdf = new Blob([documentoFinalBytesPdf as any], {
        type: 'application/pdf',
      });
      saveAs(blobDocumentoPdf, 'MAPEO_CAMPOS_MTDAC.pdf');
    } catch (errorGeneracionPdf) {
      alert('Error al generar el documento.');
    } finally {
      this.isGenerating = false;
    }
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
      this.tipoMemoriaRuta,
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
      const nombresCamposPdf = form.getFields().map((campo) => campo.getName());
      const setNombresCamposPdf = new Set(nombresCamposPdf);

      const normalizarNombreCampoPdf = (nombreCampoPdf: string) =>
        nombreCampoPdf.replace(/\\\./g, '.');

      const resolverNombreCampoPdf = (
        nombreCampoPdf: string,
      ): string | null => {
        if (setNombresCamposPdf.has(nombreCampoPdf)) return nombreCampoPdf;
        const sinEscape = normalizarNombreCampoPdf(nombreCampoPdf);
        if (setNombresCamposPdf.has(sinEscape)) return sinEscape;
        if (!nombreCampoPdf.includes('\\.') && nombreCampoPdf.includes('.')) {
          const conEscape = nombreCampoPdf.replace(/\./g, '\\.');
          if (setNombresCamposPdf.has(conEscape)) return conEscape;
        }
        return null;
      };

      const normalizarTextoOpcion = (texto: string) =>
        String(texto || '')
          .replace(/\s+/g, ' ')
          .trim()
          .toUpperCase();

      const extraerCodigoOpcion = (texto: string) =>
        normalizarTextoOpcion(texto).split(/[\s(]/)[0] || '';

      // Helpers Campos
      const setField = (name: string, value: string) => {
        try {
          const nombreReal = resolverNombreCampoPdf(name);
          if (!nombreReal) {
            return;
          }
          const f = form.getTextField(nombreReal);
          if (f) f.setText(value?.toString().toUpperCase() || '');
        } catch (e) {}
      };
      const setCheck = (name: string, c: boolean) => {
        try {
          const nombreReal = resolverNombreCampoPdf(name);
          if (!nombreReal) {
            return;
          }
          const f = form.getCheckBox(nombreReal);
          if (f) c ? f.check() : f.uncheck();
        } catch (e) {}
      };
      const setRadio = (name: string, value: string) => {
        try {
          const nombreReal = resolverNombreCampoPdf(name);
          if (!nombreReal) {
            return;
          }
          const f = form.getRadioGroup(nombreReal);
          if (f) f.select(value);
        } catch (e) {}
      };
      const setSelect = (
        nombreOriginalCampoPdf: string,
        valorDeseadoCampoPdf: string,
      ): boolean => {
        const nombreRealCampoPdf = resolverNombreCampoPdf(
          nombreOriginalCampoPdf,
        );

        if (!nombreRealCampoPdf) {
          return false;
        }

        try {
          const campoDesplegablePdf = form.getDropdown(nombreRealCampoPdf);
          campoDesplegablePdf.select(valorDeseadoCampoPdf);
          return true;
        } catch {}

        try {
          const campoListaOpcionesPdf = form.getOptionList(nombreRealCampoPdf);
          campoListaOpcionesPdf.select(valorDeseadoCampoPdf);
          return true;
        } catch {}

        try {
          const campoTextoPdf = form.getTextField(nombreRealCampoPdf);
          campoTextoPdf.setText(
            valorDeseadoCampoPdf?.toString().toUpperCase() || '',
          );
          return true;
        } catch {
          return false;
        }
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

      const cambiosModificacion = this.datos.memoriaDescriptiva.cambios;
      setCheck(
        'form1[0].Pagina1[0].seccion\\.d[0].D_3[0]',
        Boolean(cambiosModificacion.deConExcedentesASinExcedentes),
      );
      setCheck(
        'form1[0].Pagina1[0].seccion\\.d[0].D_4[0]',
        Boolean(cambiosModificacion.deSinExcedentesAConExcedentes),
      );
      setCheck(
        'form1[0].Pagina1[0].seccion\\.d[0].D_5[0]',
        Boolean(cambiosModificacion.deProduccionTodoTodoASinExcedentes),
      );
      setCheck(
        'form1[0].Pagina1[0].seccion\\.d[0].D_6[0]',
        Boolean(cambiosModificacion.deProduccionTodoTodoAConExcedentes),
      );
      setCheck(
        'form1[0].Pagina1[0].seccion\\.d[0].D_7[0]',
        Boolean(cambiosModificacion.conVariacionPotencia),
      );
      setCheck(
        'form1[0].Pagina1[0].seccion\\.d[0].D_8[0]',
        Boolean(cambiosModificacion.sustitucionEquipos),
      );
      setCheck(
        'form1[0].Pagina1[0].seccion\\.d[0].D_9[0]',
        Boolean(cambiosModificacion.otros),
      );

      const camposTipoContadorPdf = [
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_1[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_2[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_3[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_4[0]',
        'form1[0].Pagina2[0].seccion\\.e1[0].Tabla_C1[0].Fila1[0].E_2_5[0]',
      ];

      const pendientesTipoContador: { index: number; tipo: string }[] = [];
      this.datos.contadores.forEach((contador, index) => {
        if (index >= camposTipoContadorPdf.length) return;
        const tipoContador = String(contador?.tipo || '').trim();
        if (!tipoContador) return;
        const aplicado = setSelect(camposTipoContadorPdf[index], tipoContador);
        if (!aplicado) {
          pendientesTipoContador.push({ index, tipo: tipoContador });
        }
      });
      if (pendientesTipoContador.length > 0) {
        const candidatosTipoContador = form
          .getFields()
          .map((campo) => {
            const opciones = (campo as any).getOptions?.();
            if (!Array.isArray(opciones) || opciones.length < 5) return null;
            const codigos = opciones
              .map((op: string) => extraerCodigoOpcion(op))
              .filter(Boolean);
            const codigosSet = new Set(codigos);
            const requeridos = ['PF', 'GN', 'CT', 'GB', 'CSA'];
            const coincide = requeridos.every((codigo) =>
              codigosSet.has(codigo),
            );
            return coincide ? campo.getName() : null;
          })
          .filter((nombre): nombre is string => Boolean(nombre))
          .sort((a, b) => a.localeCompare(b));

        pendientesTipoContador.forEach((pendiente) => {
          const nombre = candidatosTipoContador[pendiente.index];
          if (!nombre) {
            return;
          }
          setSelect(nombre, pendiente.tipo);
        });
      }

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

      form.updateFieldAppearances(fontHand);
      form.flatten();
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      saveAs(blob, `MTD_${titularNombreDocumento || 'Documento'}.pdf`);
      try {
        await this.generarManualUsoMantenimiento(titularNombreDocumento);
      } catch (manualError) {
        alert(
          'La memoria tecnica se ha generado, pero no se pudo generar el manual de uso y mantenimiento.',
        );
      }
    } catch (error) {
      alert('Error al generar el PDF.');
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

  esCambioModificacionActivo(campo: CambioModificacionKey): boolean {
    return Boolean(this.datos.memoriaDescriptiva.cambios[campo]);
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
