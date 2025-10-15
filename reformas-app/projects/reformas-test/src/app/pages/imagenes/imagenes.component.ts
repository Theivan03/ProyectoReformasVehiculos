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

  /** ← atrás */
  @Output() volver = new EventEmitter<any>();
  /** → continuar */
  @Output() continuar = new EventEmitter<any>();
  /** autosave continuo al padre */
  @Output() autosave = new EventEmitter<any>();
  @Input() origen: 'anterior' | 'siguiente' = 'anterior';

  step = 1;

  // En memoria (runtime)
  prevImages: Blob[] = [];
  postImages: Blob[] = [];
  prevPreviews: string[] = []; // dataURL
  postPreviews: string[] = []; // dataURL

  // Persistibles (para localStorage via el padre)
  private prevImagesB64: string[] = [];
  private postImagesB64: string[] = [];

  errorPrevImagesCount = false;
  errorPostImagesCount = false;

  async ngOnInit(): Promise<void> {
    // Determinar en qué paso arrancar
    if (this.origen === 'anterior') {
      this.step = 1;
    } else if (this.origen === 'siguiente') {
      this.step = 2;
    }

    // Restaurar previas
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

    this.emitAutosave(); // snapshot inicial
  }

  // ========= Helpers (Blob <-> dataURL) =========
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
      // opcional: mantén también en RAM por si el padre quiere pasarlas de vuelta
      prevImages: this.prevImages,
      postImages: this.postImages,
    };
  }

  private emitAutosave() {
    this.autosave.emit(this.snapshot());
  }

  // ========= Carga y normalización =========
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
        { canvas: true, orientation: true }
      );
    });
  }

  async onPrevSelected(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const blob = await this.normalizeOrientation(file);
    const preview = await this.blobToDataUrl(blob);

    this.prevImages[index] = blob;
    this.prevPreviews[index] = preview;
    this.prevImagesB64[index] = preview;

    this.emitAutosave();
  }

  async onPostSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);

    // 🔹 límite global de 30 imágenes (las que ya hay + las nuevas)
    if (this.postImages.length + files.length > 30) {
      this.errorPostImagesCount = true;
      input.value = '';
      return;
    }
    this.errorPostImagesCount = false;

    const blobs = await Promise.all(
      files.map((f) => this.normalizeOrientation(f))
    );
    const previews = await Promise.all(blobs.map((b) => this.blobToDataUrl(b)));

    // 🔹 en vez de reemplazar, concatenamos
    this.postImages = [...this.postImages, ...blobs];
    this.postPreviews = [...this.postPreviews, ...previews];
    this.postImagesB64 = [...this.postImagesB64, ...previews];

    this.emitAutosave();

    // limpiar input para permitir volver a elegir mismas imágenes si se quiere
    input.value = '';
  }

  isValidPreview(previews: string[]): number {
    return previews.filter((p) => !!p).length;
  }

  // ========= Reordenar (prev) =========
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

  // ========= Reordenar (post) =========
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
      // paso 1 → volver al padre
      const snap = this.snapshot();
      this.volver.emit(snap);
    }
  }

  onSave() {
    const snap = this.snapshot();
    this.continuar.emit(snap);
  }
}
