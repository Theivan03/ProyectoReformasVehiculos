import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import loadImage from 'blueimp-load-image';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imagenes',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './imagenes.component.html',
  styleUrl: './imagenes.component.css',
})
export class ImagenesComponent implements OnInit {
  @Input() datosEntrada: any;

  /** Emitimos para volver al paso anterior */
  @Output() volver = new EventEmitter<void>();

  /** Emitimos al terminar el paso 2 */
  @Output() continuar = new EventEmitter<any>();

  step = 1;
  prevImages: Blob[] = [];
  postImages: Blob[] = [];
  prevPreviews: string[] = [];
  postPreviews: string[] = [];

  ngOnInit(): void {
    // Restaurar paso si venimos del siguiente componente
    if (this.datosEntrada?.step) {
      this.step = this.datosEntrada.step;
    }

    // Si ya había imágenes previas en datosEntrada, recupéralas
    if (Array.isArray(this.datosEntrada?.prevImages)) {
      this.prevImages = this.datosEntrada.prevImages;
      this.prevPreviews = this.prevImages.map((f) => URL.createObjectURL(f));
    }

    // Igual con las posteriores
    if (Array.isArray(this.datosEntrada?.postImages)) {
      this.postImages = this.datosEntrada.postImages;
      this.postPreviews = this.postImages.map((f) => URL.createObjectURL(f));
    }
  }

  async onPrevSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);

    if (files.length > 4) {
      alert('Solo puedes seleccionar hasta 4 imágenes previas');
      input.value = '';
      return;
    }

    // Normalizamos cada File y construimos previews
    const blobs = await Promise.all(
      files.map((f) => this.normalizeOrientation(f))
    );
    this.prevImages = blobs;
    this.prevPreviews = blobs.map((b) => URL.createObjectURL(b));
  }

  async onPostSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);

    if (files.length > 30) {
      alert('Solo puedes seleccionar hasta 30 imágenes posteriores');
      input.value = '';
      return;
    }

    const blobs = await Promise.all(
      files.map((f) => this.normalizeOrientation(f))
    );
    this.postImages = blobs;
    this.postPreviews = blobs.map((b) => URL.createObjectURL(b));
  }

  private normalizeOrientation(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      loadImage(
        file,
        (canvasElement) => {
          if (!(canvasElement instanceof HTMLCanvasElement)) {
            return reject('No se pudo procesar la imagen');
          }
          canvasElement.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject('Error creando Blob desde canvas');
          }, file.type);
        },
        {
          canvas: true,
          orientation: true,
        }
      );
    });
  }

  next() {
    if (this.step === 1) {
      this.step = 2;
    }
  }

  back() {
    if (this.step === 2) {
      this.step = 1;
    } else {
      this.datosEntrada.step = this.step;
      this.datosEntrada.prevImages = this.prevImages;
      this.datosEntrada.postImages = this.postImages;
      this.volver.emit(this.datosEntrada);
    }
  }

  onSave() {
    // Guardamos el estado en datosEntrada para recuperarlo al volver
    this.datosEntrada.step = this.step;
    this.datosEntrada.prevImages = this.prevImages;
    this.datosEntrada.postImages = this.postImages;
    this.continuar.emit(this.datosEntrada);
  }

  movePrev(i: number) {
    if (i === 0) return;
    [this.prevPreviews[i - 1], this.prevPreviews[i]] = [
      this.prevPreviews[i],
      this.prevPreviews[i - 1],
    ];
    [this.prevImages[i - 1], this.prevImages[i]] = [
      this.prevImages[i],
      this.prevImages[i - 1],
    ];
  }

  moveNext(i: number) {
    if (i === this.prevPreviews.length - 1) return;
    [this.prevPreviews[i + 1], this.prevPreviews[i]] = [
      this.prevPreviews[i],
      this.prevPreviews[i + 1],
    ];
    [this.prevImages[i + 1], this.prevImages[i]] = [
      this.prevImages[i],
      this.prevImages[i + 1],
    ];
  }

  // lo mismo para postImages/postPreviews:
  movePrevPost(i: number) {
    if (i === 0) return;
    [this.postPreviews[i - 1], this.postPreviews[i]] = [
      this.postPreviews[i],
      this.postPreviews[i - 1],
    ];
    [this.postImages[i - 1], this.postImages[i]] = [
      this.postImages[i],
      this.postImages[i - 1],
    ];
  }
  moveNextPost(i: number) {
    if (i === this.postPreviews.length - 1) return;
    [this.postPreviews[i + 1], this.postPreviews[i]] = [
      this.postPreviews[i],
      this.postPreviews[i + 1],
    ];
    [this.postImages[i + 1], this.postImages[i]] = [
      this.postImages[i],
      this.postImages[i + 1],
    ];
  }
}
