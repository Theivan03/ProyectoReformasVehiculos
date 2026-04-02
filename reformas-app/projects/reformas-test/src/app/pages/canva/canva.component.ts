import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Marker {
  x: number;
  y: number;
  label: string;
  etiqueta: string;
}

interface DetallesMuelles {
  muelleDelanteroConRef?: boolean;
  muelleDelanteroSinRef?: boolean;
  ballestaDelantera?: boolean;
  amortiguadorDelantero?: boolean;
  muelleTraseroConRef?: boolean;
  muelleTraseroSinRef?: boolean;
  ballestaTrasera?: boolean;
  amortiguadorTrasero?: boolean;
  tacosDeGoma?: boolean;
  kitElevacion?: boolean;
}

@Component({
  selector: 'app-canva',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './canva.component.html',
  styleUrl: './canva.component.css',
})
export class CanvaComponent implements OnInit {
  @Input() datosEntrada: any;
  @Output() continuar = new EventEmitter<any>();
  @Output() volver = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<any>();

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  @ViewChild('canvasImg', { static: true })
  imgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('firmaCompleta') firmaRef!: ElementRef;

  labels: string[] = [];
  selectedIndex: number | null = null;
  markers: Marker[] = [];
  imageSrc = '';

  firmaUrl = '';
  fechaFirma = '';
  nombreIngeniero: string = '';
  numColegiado: string = '';
  tituloIngeniero: string = '';

  private tipoVehiculoAnterior = '';
  private etiquetasAnteriores: string[] = [];

  constructor(private http: HttpClient) {}

  private readonly SUSP_LABELS: Record<keyof DetallesMuelles, string> = {
    muelleDelanteroConRef: 'Muelle delantero (con referencia)',
    muelleDelanteroSinRef: 'Muelle delantero (sin referencia)',
    ballestaDelantera: 'Ballesta delantera',
    amortiguadorDelantero: 'Amortiguador delantero',
    muelleTraseroConRef: 'Muelle trasero (con referencia)',
    muelleTraseroSinRef: 'Muelle trasero (sin referencia)',
    ballestaTrasera: 'Ballesta trasera',
    amortiguadorTrasero: 'Amortiguador trasero',
    tacosDeGoma: 'Tacos de goma / suplementos',
    kitElevacion: 'Kit de elevación',
  };

  private readonly LUCES_LABELS: Record<string, string> = {
    luzGrupoOptico: 'Grupo óptico delantero',
    intermitenteDelantero: 'Intermitente delantero',
    intermitenteTrasero: 'Intermitente trasero',
    catadioptrico: 'Catadióptrico',
    luzMatricula: 'Luz de matrí­cula',
    luzAntinieblas: 'Luz antinieblas',
    luzFreno: 'Luz de freno',
  };

  private readonly CANVAS_HIDDEN_MOD_NAMES = [
    'AUMENTO DE PLAZAS',
    'REDUCCION DE PLAZAS',
    'REDUCCION DE MMA',
    'REDUCCION DE MMTA',
  ];

  private readonly CANVAS_HIDDEN_MOD_NAMES_NORMALIZED = new Set<string>(
    this.CANVAS_HIDDEN_MOD_NAMES.map((name) => this.normalizeText(name)),
  );
  private readonly CANVAS_HIDDEN_MOD_RULES: Array<(mod: any) => boolean> = [
    (mod) =>
      this.CANVAS_HIDDEN_MOD_NAMES_NORMALIZED.has(
        this.normalizeText(mod?.nombre),
      ),
    (mod) =>
      this.normalizeText(mod?.nombre) === 'AUMENTO O DISMINUCION DE PLAZAS' &&
      (mod?.tipoCambio || '').toString().trim().toLowerCase() === 'aumento',
  ];

  private normalizeText(value: unknown): string {
    return (value ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private shouldHideModInCanvas(mod: any): boolean {
    return this.CANVAS_HIDDEN_MOD_RULES.some((rule) => rule(mod));
  }

  private hasValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  private isMobiliarioInteriorMod(mod: any, normalizedName: string): boolean {
    return (
      normalizedName.includes('MOBILIARIO INTERIOR') ||
      mod?.opcionesMueble != null ||
      Array.isArray(mod?.mueblesBajo) ||
      Array.isArray(mod?.mueblesAlto) ||
      Array.isArray(mod?.mueblesAseo)
    );
  }

  private isInstalacionElectricaMod(mod: any, normalizedName: string): boolean {
    return (
      (normalizedName.includes('INSTALACI') &&
        normalizedName.includes('CTRICA')) ||
      Array.isArray(mod?.placasSolares) ||
      this.hasValue(mod?.cantidadBaterias) ||
      this.hasValue(mod?.potenciaBaterias) ||
      this.hasValue(mod?.ubicacionBaterias) ||
      this.hasValue(mod?.potenciaInversor) ||
      this.hasValue(mod?.marcaInversor) ||
      this.hasValue(mod?.homologacionInversor) ||
      this.hasValue(mod?.ubicacionInversor) ||
      this.hasValue(mod?.modeloControlador) ||
      this.hasValue(mod?.marcaControlador) ||
      this.hasValue(mod?.homologacionControlador) ||
      this.hasValue(mod?.ubicacionControlador)
    );
  }

  private buildLabelWithModel(
    prefix: 'Ventana' | 'Claraboya',
    model: any,
  ): string {
    const modelText = (model ?? '').toString().trim();
    return modelText ? `${prefix} ${modelText}` : prefix;
  }

  private toPositiveInt(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed);
  }

  private expandClaraboyas(mod: any): string[] {
    const out: string[] = [];

    if (Array.isArray(mod?.claraboyas) && mod.claraboyas.length > 0) {
      mod.claraboyas.forEach((item: any) => {
        out.push(this.buildLabelWithModel('Claraboya', item?.modelo));
      });
      return out;
    }

    const legacyExists =
      mod?.modeloClaraboya ||
      mod?.marcaClaraboya ||
      mod?.homologacionClaraboya ||
      mod?.descripcionClaraboya ||
      mod?.cantidadClaraboya;

    if (!legacyExists) return out;

    const qty = this.toPositiveInt(mod?.cantidadClaraboya);
    const count = qty > 0 ? qty : 1;
    for (let i = 0; i < count; i++) {
      out.push(this.buildLabelWithModel('Claraboya', mod?.modeloClaraboya));
    }

    return out;
  }

  private expandVentanas(mod: any): string[] {
    const out: string[] = [];

    if (Array.isArray(mod?.ventanas) && mod.ventanas.length > 0) {
      mod.ventanas.forEach((item: any) => {
        out.push(this.buildLabelWithModel('Ventana', item?.modelo));
      });
      return out;
    }

    const legacyExists =
      mod?.modeloVentana ||
      mod?.marcaVentana ||
      mod?.homologacionVentana ||
      mod?.descripcionVentana ||
      mod?.dimensionesVentana ||
      mod?.cantidadVentanas;

    if (!legacyExists) return out;

    const qty = this.toPositiveInt(mod?.cantidadVentanas);
    const count = qty > 0 ? qty : 1;
    for (let i = 0; i < count; i++) {
      out.push(this.buildLabelWithModel('Ventana', mod?.modeloVentana));
    }

    return out;
  }

  private expandReformasAdicionalesLabels(mod: any): string[] {
    const out: string[] = [];
    const items = Array.isArray(mod?.reformasAdicionalesItems)
      ? mod.reformasAdicionalesItems
      : [];

    items.forEach((item: any, index: number) => {
      const titulo = (item?.titulo ?? '').toString().trim();
      if (titulo) {
        out.push(titulo);
        return;
      }

      const descripcion = (item?.descripcion ?? '').toString().trim();
      if (descripcion) {
        out.push(`Reforma adicional ${index + 1}`);
      }
    });

    return out;
  }

  private isCasuisticaSuspension(nombre: string | undefined): boolean {
    return (
      (nombre || '').trim().toUpperCase() ===
      'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR'
    );
  }

  private expandSuspensionToLabels(det: DetallesMuelles | undefined): string[] {
    if (!det) return [];
    const out: string[] = [];
    (Object.keys(this.SUSP_LABELS) as Array<keyof DetallesMuelles>).forEach(
      (k) => {
        if (det[k]) out.push(this.SUSP_LABELS[k]);
      },
    );
    return out;
  }

  private snapshot(): any {
    return {
      ...(this.datosEntrada || {}),
      marcadores: this.markers,
      fechaFirma: this.fechaFirma,
      firmaUrl: this.firmaUrl,
    };
  }
  private emitAutosave() {
    const data = this.snapshot();
    if (!data.tipoVehiculo) data.tipoVehiculo = this.datosEntrada?.tipoVehiculo;
    this.autosave.emit(data);
  }

  ngOnInit(): void {
    console.log('CanvaComponent ngOnInit - datosEntrada:', this.datosEntrada);
    this.fechaFirma = this.calcularFechaHoy();
    this.firmaUrl =
      this.datosEntrada?.firmaUrl ||
      '/imgs/firma-generada.png';

    const tipoActual = (this.datosEntrada?.tipoVehiculo || '')
      .toString()
      .trim()
      .toLowerCase();

    const ingeniero = this.datosEntrada?.ingeniero || {};

    this.nombreIngeniero = ingeniero.nombre;
    this.numColegiado = 'Col nº ' + ingeniero.numero + ' ' + ingeniero.colegio;
    this.tituloIngeniero = 'EL ' + ingeniero.titulacion;

    if (this.tipoVehiculoAnterior && tipoActual !== this.tipoVehiculoAnterior) {
      this.markers = [];
    }
    this.tipoVehiculoAnterior = tipoActual;

    if (Array.isArray(this.datosEntrada?.marcadores)) {
      this.markers = [...this.datosEntrada.marcadores];
    }

    const nuevasLabels: string[] = [];
    const mods = Array.isArray(this.datosEntrada?.modificaciones)
      ? this.datosEntrada.modificaciones
      : [];

    for (const mod of mods) {
      const normalizedName = this.normalizeText(mod?.nombre);

      if (mod?.seleccionado && this.shouldHideModInCanvas(mod)) {
        continue;
      }

      if (
        mod?.seleccionado &&
        this.isMobiliarioInteriorMod(mod, normalizedName)
      ) {
        mod.mueblesBajo?.forEach((_: any, idx: number) =>
          nuevasLabels.push(`Mueble bajo ${idx + 1}`),
        );
        mod.mueblesAlto?.forEach((_: any, idx: number) =>
          nuevasLabels.push(`Mueble alto ${idx + 1}`),
        );
        mod.mueblesAseo?.forEach((_: any, idx: number) =>
          nuevasLabels.push(`Aseo ${idx + 1}`),
        );
        continue;
      }

      if (this.isCasuisticaSuspension(mod?.nombre)) {
        const sublabels = this.expandSuspensionToLabels(mod?.detallesMuelles);
        if (sublabels.length > 0) {
          nuevasLabels.push(...sublabels);
        }
        continue;
      }

      if (
        mod?.seleccionado &&
        this.isInstalacionElectricaMod(mod, normalizedName)
      ) {
        const sublabels = this.expandInstalacionElectrica(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado && mod?.nombre === 'LUCES') {
        const sublabels = this.expandLuces(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado && normalizedName === 'CLARABOYA') {
        const sublabels = this.expandClaraboyas(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado && normalizedName === 'VENTANA') {
        const sublabels = this.expandVentanas(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (
        mod?.seleccionado &&
        normalizedName === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES'
      ) {
        const sublabels = this.expandReformasAdicionalesLabels(mod);
        if (sublabels.length > 0) {
          nuevasLabels.push(...sublabels);
        } else {
          nuevasLabels.push(mod.nombre);
        }
        continue;
      }

      if (mod?.seleccionado) {
        nuevasLabels.push(mod.nombre);
      }
    }

    if (this.markers.length > 0) {
      const indexesByLabel = new Map<string, number[]>();
      nuevasLabels.forEach((label, idx) => {
        const indexes = indexesByLabel.get(label) ?? [];
        indexes.push(idx);
        indexesByLabel.set(label, indexes);
      });
      const consumedByLabel = new Map<string, number>();

      this.markers = this.markers
        .map((m) => {
          const indexes = indexesByLabel.get(m.etiqueta) ?? [];
          const consumed = consumedByLabel.get(m.etiqueta) ?? 0;
          if (consumed < indexes.length) {
            const newIndex = indexes[consumed];
            consumedByLabel.set(m.etiqueta, consumed + 1);
            return { ...m, label: (newIndex + 1).toString() };
          }
          return null;
        })
        .filter((m) => m !== null) as Marker[];
    }

    this.labels = nuevasLabels;
    this.etiquetasAnteriores = [...nuevasLabels];

    let url = '';
    switch (tipoActual) {
      case 'camper':
        url = '/imgs/camper2.png';
        break;
      case 'moto':
        url = '/imgs/moto.png';
        break;
      default:
        url = '/imgs/coche.png';
    }
    this.cargarImagenComoBase64(url).then((base64) => (this.imageSrc = base64));

    this.emitAutosave();
  }

  private expandInstalacionElectrica(mod: any): string[] {
    const out: string[] = [];

    if (Array.isArray(mod.placasSolares)) {
      mod.placasSolares.forEach((placa: any, i: number) => {
        const marca = (placa?.marcaPlacaSolar ?? placa?.marca ?? '')
          .toString()
          .trim();
        const modelo = (placa?.modeloPlacaSolar ?? placa?.modelo ?? '')
          .toString()
          .trim();
        const detalle = [marca, modelo].filter(Boolean).join(' ');
        const cantidad =
          placa?.agruparIguales && Number(placa?.cantidad) > 1
            ? Math.trunc(Number(placa.cantidad))
            : 1;
        out.push(
          cantidad > 1
            ? detalle
              ? `${cantidad} placas solares (${detalle})`
              : `${cantidad} placas solares`
            : detalle
              ? `Placa solar ${i + 1} (${detalle})`
              : `Placa solar ${i + 1}`,
        );
      });
    }

    // En canva siempre se posicionan por separado en instalación eléctrica.
    out.push('Batería');
    out.push('Inversor');
    out.push('Controlador');

    if (this.hasValue(mod.instalacionesSecundarias)) {
      out.push(`Instalaciones secundarias`);
    }

    return out;
  }

  private expandLuces(mod: any): string[] {
    const det = mod?.descripcionLuces;
    if (!det) return [];

    const out: string[] = [];
    (
      Object.keys(this.LUCES_LABELS) as Array<keyof typeof this.LUCES_LABELS>
    ).forEach((k) => {
      if (det[k]) {
        out.push(this.LUCES_LABELS[k]);
      }
    });
    return out;
  }

  calcularFechaHoy(): string {
    if (!this.datosEntrada?.fechaProyecto) {
      return '';
    }

    const [year, month, day] = this.datosEntrada.fechaProyecto
      .split('-')
      .map(Number);

    const fecha = new Date(year, month - 1, day);

    return `Teulada, ${fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
  }

  cargarImagenComoBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  selectRow(idx: number): void {
    this.selectedIndex = idx;
    this.emitAutosave();
  }

  onImageClick(event: MouseEvent): void {
    const imgEl = this.imgRef.nativeElement;
    if (this.selectedIndex === null || event.target !== imgEl) return;

    const rect = imgEl.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    this.markers.push({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      label: (this.selectedIndex + 1).toString(),
      etiqueta: this.labels[this.selectedIndex],
    });

    this.emitAutosave();
  }

  undoMarker(): void {
    this.markers.pop();
    this.emitAutosave();
  }

  onBack(): void {
    this.datosEntrada.marcadores = this.markers;
    this.datosEntrada.fechaFirma = this.fechaFirma;
    this.datosEntrada.firmaUrl = this.firmaUrl;
    this.emitAutosave();
    this.volver.emit(this.snapshot());
  }

  onContinue(): void {
    this.datosEntrada.marcadores = this.markers;
    this.datosEntrada.fechaFirma = this.fechaFirma;
    this.datosEntrada.firmaUrl = this.firmaUrl;

    this.emitAutosave();
    this.guardarImagen();
    this.guardarFirma();

    this.continuar.emit(this.snapshot());
  }

  private guardarImagen() {
    const originalClass = this.canvasContainer?.nativeElement.className;
    this.canvasContainer?.nativeElement.classList.remove('border');

    html2canvas(this.canvasContainer!.nativeElement).then((canvas) => {
      this.canvasContainer!.nativeElement.className = originalClass;
      const imagenBase64 = canvas.toDataURL('image/png');

      this.http
        .post('/guardar-imagen-plano', {
          imagenBase64,
          nombreArchivo: `plano-generado-proyecto${this.datosEntrada.numeroProyecto}.png`,
        })
        .subscribe((res) => console.log('Imagen guardada:', res));
    });
  }

  private guardarFirma() {
    const el = this.firmaRef.nativeElement;

    html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    }).then((canvas) => {
      const imagenBase64 = canvas.toDataURL('image/png');

      this.http
        .post('/guardar-firma', {
          imagenBase64,
          nombreArchivo: 'firma-generada.png',
        })
        .subscribe(() => console.log('Firma guardada'));
    });
  }
}
