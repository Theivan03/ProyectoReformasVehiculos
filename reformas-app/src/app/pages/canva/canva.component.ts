import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  HostListener,
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

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  @ViewChild('canvasImg', { static: true })
  imgRef!: ElementRef<HTMLImageElement>;

  labels: string[] = [];

  selectedIndex: number | null = null;

  markers: Marker[] = [];

  imageSrc = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    let url = '';

    if (Array.isArray(this.datosEntrada?.marcadores)) {
      this.markers = [...this.datosEntrada.marcadores];
    }
    if (Array.isArray(this.datosEntrada?.modificaciones)) {
      this.datosEntrada.modificaciones.forEach((mod: any) => {
        if (mod.seleccionado) {
          if (mod.nombre === 'MOBILIARIO INTERIOR VEHÍCULO') {
            mod.mueblesBajo?.forEach((m: any) => {
              this.labels.push(`Mueble bajo (${m.medidas || 'sin medidas'})`);
            });
            mod.mueblesAlto?.forEach((m: any) => {
              this.labels.push(`Mueble alto (${m.medidas || 'sin medidas'})`);
            });
            mod.mueblesAseo?.forEach((m: any) => {
              this.labels.push(`Aseo (${m.medidas || 'sin medidas'})`);
            });
          } else {
            this.labels.push(mod.nombre);
          }
        }
      });
    }

    switch (this.datosEntrada.tipoVehiculo) {
      case 'camper':
        url = 'http://192.168.1.41:3000/imgs/camper.png';
        break;
      case 'moto':
        url = 'http://192.168.1.41:3000/imgs/moto.png';
        break;
      default:
        url = 'http://192.168.1.41:3000/imgs/coche.png';
    }

    this.cargarImagenComoBase64(url).then((base64) => {
      this.imageSrc = base64;
    });
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
  }

  @HostListener('click', ['$event'])
  onImageClick(event: MouseEvent): void {
    event.stopPropagation();
    // only if a row is selected and click was on the image
    const imgEl = this.imgRef.nativeElement;
    if (this.selectedIndex === null || event.target !== imgEl) {
      return;
    }

    const rect = imgEl.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    this.markers.push({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      label: (this.selectedIndex + 1).toString(),
    });
    console.log('Marker removed, current markers:', this.markers);
    console.log('Selected index reset to:', this.selectedIndex);
  }

  undoMarker(): void {
    if (this.markers.length > 0) {
      this.markers.pop();
      console.log('Último marcador borrado:', this.markers);
    }
  }

  onBack(): void {
    this.datosEntrada.marcadores = this.markers;
    this.volver.emit();
  }

  onContinue(): void {
    this.datosEntrada.marcadores = this.markers;
    this.guardarImagen();
    this.continuar.emit(this.datosEntrada);
    this.guardarFirma();
  }

  guardarImagen() {
    const originalClass = this.canvasContainer?.nativeElement.className;

    // Quitar temporalmente el borde
    this.canvasContainer?.nativeElement.classList.remove('border');

    html2canvas(this.canvasContainer!.nativeElement).then((canvas) => {
      // Restaurar clase original
      this.canvasContainer!.nativeElement.className = originalClass;

      const imagenBase64 = canvas.toDataURL('image/png');

      this.http
        .post('http://192.168.1.41:3000/guardar-imagen-plano', {
          imagenBase64,
          nombreArchivo: `plano-generado-proyecto${this.datosEntrada.numeroProyecto}.png`,
        })
        .subscribe((res) => {
          console.log('Imagen guardada:', res);
        });
    });
  }

  @ViewChild('firmaCompleta') firmaRef!: ElementRef;

  guardarFirma() {
    const el = this.firmaRef.nativeElement as HTMLElement;
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
        .subscribe((res) => {
          console.log('Firma guardada con texto encima');
        });
    });
  }
}
