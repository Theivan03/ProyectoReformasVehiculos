import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import loadImage from 'blueimp-load-image';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imagenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imagenes.component.html',
  styleUrls: ['./imagenes.component.css'],
})
export class ImagenesComponent implements OnInit {
  @Input() datosEntrada: any;
  @Output() volver = new EventEmitter<any>();
  @Output() continuar = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<any>();
  @Input() origen: 'anterior' | 'siguiente' = 'anterior';

  step = 1;
  procesando = false; // 👈 indicador visual

  prevImages: Blob[] = [];
  postImages: Blob[] = [];
  prevPreviews: string[] = [];
  postPreviews: string[] = [];

  private prevImagesB64: string[] = [];
  private postImagesB64: string[] = [];

  errorPrevImagesCount = false;
  errorPostImagesCount = false;

  async ngOnInit(): Promise<void> {
    this.step = this.origen === 'siguiente' ? 2 : 1;

    if (Array.isArray(this.datosEntrada?.prevImagesB64)) {
      this.prevImagesB64 = [...this.datosEntrada.prevImagesB64];
      this.prevPreviews = [...this.prevImagesB64];
      this.prevImages = await Promise.all(
        this.prevImagesB64.map((b64) => this.dataUrlToBlob(b64))
      );
    } else if (Array.isArray(this.datosEntrada?.prevImages)) {
      this.prevImages = this.datosEntrada.prevImages;
      this.prevPreviews = await Promise.all(
        this.prevImages.map((b) => this.blobToDataUrl(b))
      );
      this.prevImagesB64 = [...this.prevPreviews];
    }

    if (Array.isArray(this.datosEntrada?.postImagesB64)) {
      this.postImagesB64 = [...this.datosEntrada.postImagesB64];
      this.postPreviews = [...this.postImagesB64];
      this.postImages = await Promise.all(
        this.postImagesB64.map((b64) => this.dataUrlToBlob(b64))
      );
    } else if (Array.isArray(this.datosEntrada?.postImages)) {
      this.postImages = this.datosEntrada.postImages;
      this.postPreviews = await Promise.all(
        this.postImages.map((b) => this.blobToDataUrl(b))
      );
      this.postImagesB64 = [...this.postPreviews];
    }

    this.emitAutosave();
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  private snapshot() {
    return {
      ...(this.datosEntrada || {}),
      step: this.step,
      prevImagesB64: this.prevImagesB64,
      postImagesB64: this.postImagesB64,
      prevImages: this.prevImages,
      postImages: this.postImages,
    };
  }

  private emitAutosave() {
    this.autosave.emit(this.snapshot());
  }

  // ========= PROCESAR Y COMPRIMIR =========
  private normalizeAndCompress(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.procesando = true;

      loadImage(
        file,
        (canvasElement) => {
          if (!(canvasElement instanceof HTMLCanvasElement)) {
            this.procesando = false;
            return reject('No se pudo procesar la imagen');
          }

          // 🔹 Redimensionar a máximo 1600 px y comprimir
          const mimeType = 'image/jpeg'; // forzamos JPEG por compatibilidad DOCX
          canvasElement.toBlob(
            (blob) => {
              this.procesando = false;
              if (blob) resolve(blob);
              else reject('Error creando Blob comprimido');
            },
            mimeType,
            0.7 // calidad (0.6–0.8 → excelente equilibrio)
          );
        },
        {
          canvas: true,
          orientation: true,
          maxWidth: 1600,
          maxHeight: 1600,
          downsamplingRatio: 0.7, // mejora velocidad de reducción
        }
      );
    });
  }

  // ========= Carga previa =========
  async onPrevSelected(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    try {
      const blob = await this.normalizeAndCompress(file);
      const preview = await this.blobToDataUrl(blob);

      this.prevImages[index] = blob;
      this.prevPreviews[index] = preview;
      this.prevImagesB64[index] = preview;

      this.emitAutosave();
    } catch (err) {
      console.error('Error procesando imagen previa:', err);
    } finally {
      input.value = '';
    }
  }

  // ========= Carga posteriores =========
  async onPostSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    if (this.postImages.length + files.length > 30) {
      this.errorPostImagesCount = true;
      input.value = '';
      return;
    }
    this.errorPostImagesCount = false;

    try {
      this.procesando = true;
      const blobs = await Promise.all(
        files.map((f) => this.normalizeAndCompress(f))
      );
      const previews = await Promise.all(
        blobs.map((b) => this.blobToDataUrl(b))
      );

      this.postImages.push(...blobs);
      this.postPreviews.push(...previews);
      this.postImagesB64.push(...previews);

      this.emitAutosave();
    } catch (err) {
      console.error('Error procesando imágenes posteriores:', err);
    } finally {
      this.procesando = false;
      input.value = '';
    }
  }

  // ========= Reordenar =========
  movePrev(i: number) {
    if (i === 0) return;
    [this.prevPreviews[i - 1], this.prevPreviews[i]] = [
      this.prevPreviews[i],
      this.prevPreviews[i - 1],
    ];
    [this.prevImagesB64[i - 1], this.prevImagesB64[i]] = [
      this.prevImagesB64[i],
      this.prevImagesB64[i - 1],
    ];
    [this.prevImages[i - 1], this.prevImages[i]] = [
      this.prevImages[i],
      this.prevImages[i - 1],
    ];
    this.emitAutosave();
  }

  moveNext(i: number) {
    if (i === this.prevPreviews.length - 1) return;
    [this.prevPreviews[i + 1], this.prevPreviews[i]] = [
      this.prevPreviews[i],
      this.prevPreviews[i + 1],
    ];
    [this.prevImagesB64[i + 1], this.prevImagesB64[i]] = [
      this.prevImagesB64[i],
      this.prevImagesB64[i + 1],
    ];
    [this.prevImages[i + 1], this.prevImages[i]] = [
      this.prevImages[i],
      this.prevImages[i + 1],
    ];
    this.emitAutosave();
  }

  movePrevPost(i: number) {
    if (i === 0) return;
    [this.postPreviews[i - 1], this.postPreviews[i]] = [
      this.postPreviews[i],
      this.postPreviews[i - 1],
    ];
    [this.postImagesB64[i - 1], this.postImagesB64[i]] = [
      this.postImagesB64[i],
      this.postImagesB64[i - 1],
    ];
    [this.postImages[i - 1], this.postImages[i]] = [
      this.postImages[i],
      this.postImages[i - 1],
    ];
    this.emitAutosave();
  }

  moveNextPost(i: number) {
    if (i === this.postPreviews.length - 1) return;
    [this.postPreviews[i + 1], this.postPreviews[i]] = [
      this.postPreviews[i],
      this.postPreviews[i + 1],
    ];
    [this.postImagesB64[i + 1], this.postImagesB64[i]] = [
      this.postImagesB64[i],
      this.postImagesB64[i + 1],
    ];
    [this.postImages[i + 1], this.postImages[i]] = [
      this.postImages[i],
      this.postImages[i + 1],
    ];
    this.emitAutosave();
  }

  // ========= Navegación =========
  next() {
    if (this.step === 1) {
      this.step = 2;
      this.emitAutosave();
    }
  }

  back() {
    if (this.step === 2) {
      this.step = 1;
      this.emitAutosave();
    } else {
      this.volver.emit(this.snapshot());
    }
  }

  onSave() {
    this.continuar.emit(this.snapshot());
  }

  isValidPreview(previews: string[]): number {
    return previews.filter((p) => !!p).length;
  }
}
