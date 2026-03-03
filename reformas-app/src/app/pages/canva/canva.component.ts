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
    kitElevacion: 'Kit de elevaciÃ³n',
  };

  private readonly LUCES_LABELS: Record<string, string> = {
    luzGrupoOptico: 'Grupo Ã³ptico delantero',
    intermitenteDelantero: 'Intermitente delantero',
    intermitenteTrasero: 'Intermitente trasero',
    catadioptrico: 'CatadiÃ³ptrico',
    luzMatricula: 'Luz de matrÃ­cula',
    luzAntinieblas: 'Luz antinieblas',
    luzFreno: 'Luz de freno',
  };

  /**
   * Modificaciones que no deben mostrarse en el canva (tabla y numeracion).
   * Para ampliar en el futuro, anade nombres o reglas en CANVAS_HIDDEN_MOD_RULES.
   */
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

  private isCasuisticaSuspension(nombre: string | undefined): boolean {
    return (
      (nombre || '').trim().toUpperCase() ===
      'TODA LA CASUÃSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR'
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
      'http://192.168.1.41:3000/imgs/firma-generada.png';

    const tipoActual = (this.datosEntrada?.tipoVehiculo || '')
      .toString()
      .trim()
      .toLowerCase();

    const ingeniero = this.datosEntrada?.ingeniero || {};

    this.nombreIngeniero = ingeniero.nombre;
    this.numColegiado = 'Col nÂº ' + ingeniero.numero + ' ' + ingeniero.colegio;
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
      if (mod?.seleccionado && this.shouldHideModInCanvas(mod)) {
        continue;
      }

      if (mod?.seleccionado && mod?.nombre === 'MOBILIARIO INTERIOR VEHÃCULO') {
        mod.mueblesBajo?.forEach((m: any) =>
          nuevasLabels.push(`Mueble bajo (${m?.medidas || 'sin medidas'})`),
        );
        mod.mueblesAlto?.forEach((m: any) =>
          nuevasLabels.push(`Mueble alto (${m?.medidas || 'sin medidas'})`),
        );
        mod.mueblesAseo?.forEach((m: any) =>
          nuevasLabels.push(`Aseo (${m?.medidas || 'sin medidas'})`),
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

      if (mod?.seleccionado && mod?.nombre === 'INSTALACIÃ“N ELÃ‰CTRICA') {
        const sublabels = this.expandInstalacionElectrica(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado && mod?.nombre === 'LUCES') {
        const sublabels = this.expandLuces(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado) {
        nuevasLabels.push(mod.nombre);
      }
    }

    if (this.markers.length > 0) {
      this.markers = this.markers
        .map((m) => {
          const newIndex = nuevasLabels.indexOf(m.etiqueta);
          if (newIndex !== -1) {
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
        url = 'http://192.168.1.41:3000/imgs/camper2.png';
        break;
      case 'moto':
        url = 'http://192.168.1.41:3000/imgs/moto.png';
        break;
      default:
        url = 'http://192.168.1.41:3000/imgs/coche.png';
    }
    this.cargarImagenComoBase64(url).then((base64) => (this.imageSrc = base64));

    this.emitAutosave();
  }

  private expandInstalacionElectrica(mod: any): string[] {
    const out: string[] = [];

    if (Array.isArray(mod.placasSolares)) {
      mod.placasSolares.forEach((placa: any, i: number) => {
        out.push(
          `Placa solar ${i + 1} (${placa.marcaPlacaSolar || ''} ${
            placa.modeloPlacaSolar || ''
          })`,
        );
      });
    }

    if (mod.cantidadBaterias && mod.potenciaBaterias) {
      out.push(`BaterÃ­a ${mod.potenciaBaterias}V`);
    }

    if (mod.marcaInversor || mod.potenciaInversor) {
      out.push(`Inversor ${mod.marcaInversor || ''}`);
    }

    if (mod.marcaControlador || mod.modeloControlador) {
      out.push(`Controlador ${mod.modeloControlador || ''}`);
    }

    if (mod.instalacionesSecundarias) {
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
        .post('http://192.168.1.41:3000/guardar-imagen-plano', {
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
        .post('http://192.168.1.41:3000/guardar-firma', {
          imagenBase64,
          nombreArchivo: 'firma-generada.png',
        })
        .subscribe(() => console.log('Firma guardada'));
    });
  }
}

