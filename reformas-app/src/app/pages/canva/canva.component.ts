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
    this.fechaFirma = this.datosEntrada?.fechaFirma || this.calcularFechaHoy();
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
      if (!mod?.seleccionado) continue;

      if (mod.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
        mod.mueblesBajo?.forEach((m: any) =>
          nuevasLabels.push(`Mueble bajo (${m?.medidas || 'sin medidas'})`)
        );
        mod.mueblesAlto?.forEach((m: any) =>
          nuevasLabels.push(`Mueble alto (${m?.medidas || 'sin medidas'})`)
        );
        mod.mueblesAseo?.forEach((m: any) =>
          nuevasLabels.push(`Aseo (${m?.medidas || 'sin medidas'})`)
        );
      } else {
        nuevasLabels.push(mod.nombre);
      }
    }

    // Reasignar números de marcadores segun su etiqueta
    if (this.markers.length > 0) {
      this.markers = this.markers
        .map((m) => {
          const newIndex = nuevasLabels.indexOf(m.etiqueta);
          if (newIndex !== -1) {
            return { ...m, label: (newIndex + 1).toString() };
          }
          // si la etiqueta ya no existe, descartamos ese marcador
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

  calcularFechaHoy() {
    const hoy = new Date();
    return `Teulada, ${hoy.toLocaleDateString('es-ES', {
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
      etiqueta: this.labels[this.selectedIndex], // ← aquí lo importante
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
    this.volver.emit(this.snapshot()); // devuelve todo por si el padre quiere usarlo
  }

  onContinue(): void {
    this.datosEntrada.marcadores = this.markers;
    this.datosEntrada.fechaFirma = this.fechaFirma;
    this.datosEntrada.firmaUrl = this.firmaUrl;

    // Guardamos imágenes (side-effects) y autosave antes de continuar
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

  guardarFirma() {
    const el = this.firmaRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const scale = dpr * 16;
    html2canvas(el, {
      scale: scale,
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
