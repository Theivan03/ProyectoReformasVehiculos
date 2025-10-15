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

  private tipoVehiculoAnterior = '';
  private etiquetasAnteriores: string[] = [];

  constructor(private http: HttpClient) {}

  // ---------- Helpers para casuística de suspensión ----------
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

  private isCasuisticaSuspension(nombre: string | undefined): boolean {
    return (
      (nombre || '').trim().toUpperCase() ===
      'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR'
    );
  }

  /** Convierte detallesMuelles (true/false) en etiquetas planas para la lista principal */
  private expandSuspensionToLabels(det: DetallesMuelles | undefined): string[] {
    if (!det) return [];
    const out: string[] = [];
    (Object.keys(this.SUSP_LABELS) as Array<keyof DetallesMuelles>).forEach(
      (k) => {
        if (det[k]) out.push(this.SUSP_LABELS[k]); // prefijo para reconocer subapartados
      }
    );
    return out;
  }
  // -----------------------------------------------------------

  private snapshot(): any {
    return {
      ...(this.datosEntrada || {}),
      marcadores: this.markers,
      fechaFirma: this.fechaFirma,
      firmaUrl: this.firmaUrl,
    };
  }
  private emitAutosave() {
    this.autosave.emit(this.snapshot());
  }

  ngOnInit(): void {
    // ====== FECHA / FIRMA inicial ======
    this.fechaFirma = this.calcularFechaHoy();
    this.firmaUrl =
      this.datosEntrada?.firmaUrl ||
      'http://192.168.1.41:3000/imgs/firma-generada.png';

    // ====== Tipo / reset marcadores si cambió el tipo ======
    const tipoActual = (this.datosEntrada?.tipoVehiculo || '')
      .toString()
      .trim()
      .toLowerCase();

    if (this.tipoVehiculoAnterior && tipoActual !== this.tipoVehiculoAnterior) {
      this.markers = [];
    }
    this.tipoVehiculoAnterior = tipoActual;

    // ====== Restaurar marcadores si vienen del padre ======
    if (Array.isArray(this.datosEntrada?.marcadores)) {
      this.markers = [...this.datosEntrada.marcadores];
    }

    // ====== Construir labels a partir de las modificaciones ======
    const nuevasLabels: string[] = [];
    const mods = Array.isArray(this.datosEntrada?.modificaciones)
      ? this.datosEntrada.modificaciones
      : [];

    for (const mod of mods) {
      // 1) MOBILIARIO (como lo tenías)
      if (mod?.seleccionado && mod?.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
        mod.mueblesBajo?.forEach((m: any) =>
          nuevasLabels.push(`Mueble bajo (${m?.medidas || 'sin medidas'})`)
        );
        mod.mueblesAlto?.forEach((m: any) =>
          nuevasLabels.push(`Mueble alto (${m?.medidas || 'sin medidas'})`)
        );
        mod.mueblesAseo?.forEach((m: any) =>
          nuevasLabels.push(`Aseo (${m?.medidas || 'sin medidas'})`)
        );
        continue;
      }

      // 2) CASUÍSTICA SUSPENSIÓN → sustituimos el ítem por sus subapartados (solo los true)
      if (this.isCasuisticaSuspension(mod?.nombre)) {
        const sublabels = this.expandSuspensionToLabels(mod?.detallesMuelles);
        if (sublabels.length > 0 /* || mod?.seleccionado */) {
          nuevasLabels.push(...sublabels);
        }
        // No añadimos el nombre "TODA LA CASUÍSTICA..." para que la lista tenga *solo* subapartados.
        continue;
      }

      // 3) INSTALACIÓN ELÉCTRICA
      if (mod?.seleccionado && mod?.nombre === 'INSTALACIÓN ELÉCTRICA') {
        const sublabels = this.expandInstalacionElectrica(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      // 4) Resto (solo si están seleccionadas)
      if (mod?.seleccionado) {
        nuevasLabels.push(mod.nombre);
      }
    }

    // Reasignar números de marcadores según su etiqueta
    if (this.markers.length > 0) {
      this.markers = this.markers
        .map((m) => {
          // Si venimos de una sesión anterior, puede que el marcador apunte al nombre "TODA LA CASUÍSTICA..."
          // En ese caso, ya no existirá en nuevasLabels y lo descartamos.
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

    // ====== Imagen de fondo por tipo ======
    let url = '';
    switch (tipoActual) {
      case 'camper':
        url = 'http://192.168.1.41:3000/imgs/camper.png';
        break;
      case 'moto':
        url = 'http://192.168.1.41:3000/imgs/moto.png';
        break;
      default:
        url = 'http://192.168.1.41:3000/imgs/coche.png';
    }
    this.cargarImagenComoBase64(url).then((base64) => (this.imageSrc = base64));

    // Primer autosave al entrar (estado restaurado o en blanco)
    this.emitAutosave();
  }

  // ---------- Helpers para instalación eléctrica ----------
  private expandInstalacionElectrica(mod: any): string[] {
    const out: string[] = [];

    // Placas solares
    if (Array.isArray(mod.placasSolares)) {
      mod.placasSolares.forEach((placa: any, i: number) => {
        out.push(
          `Placa solar ${i + 1} (${placa.marcaPlacaSolar || ''} ${
            placa.modeloPlacaSolar || ''
          })`
        );
      });
    }

    // Baterías
    if (mod.cantidadBaterias && mod.potenciaBaterias) {
      out.push(`Batería ${mod.potenciaBaterias}V`);
    }

    // Inversor
    if (mod.marcaInversor || mod.potenciaInversor) {
      out.push(`Inversor ${mod.marcaInversor || ''}`);
    }

    // Controlador
    if (mod.marcaControlador || mod.modeloControlador) {
      out.push(`Controlador ${mod.modeloControlador || ''}`);
    }

    // Instalaciones secundarias (si vienen en texto)
    if (mod.instalacionesSecundarias) {
      out.push(`Instalaciones secundarias`);
    }

    return out;
  }

  calcularFechaHoy(): string {
    if (!this.datosEntrada?.fechaProyecto) {
      return '';
    }

    // Descomponemos el string "YYYY-MM-DD"
    const [year, month, day] = this.datosEntrada.fechaProyecto
      .split('-')
      .map(Number);

    // Creamos un objeto Date en la zona local (mes empieza en 0)
    const fecha = new Date(year, month - 1, day);

    // Formateamos en español
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
      etiqueta: this.labels[this.selectedIndex], // etiqueta visible en la tabla
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
      scale: 2, // 👈 ajusta aquí el zoom (2 suele bastar)
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
