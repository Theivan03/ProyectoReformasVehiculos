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

  step = 1;

  // ========= En memoria (runtime) =========
  prevImages: Blob[] = [];
  prevPreviews: string[] = []; // dataURL

  postImages: Blob[] = [];
  postPreviews: string[] = [];

  // ========= Arrays planos persistibles =========
  prevImagesB64: string[] = [];
  postImagesB64: string[] = [];

  // ========= Errores =========
  errorPrevImagesCount = false;
  errorPostImagesCount = false;

  // ========= Vista por modificación (step 2) =========
  modsSeleccionadas: any[] = [];
  perModPreviews: { [modNombre: string]: string[] } = {};
  perModBlobs: { [modNombre: string]: Blob[] } = {};

  // ========= NUEVO: Documentación (step 3) =========
  docsPreviews: { [tipo: string]: string[] } = {};
  docsBlobs: { [tipo: string]: Blob[] } = {};
  docsImagesB64: { [tipo: string]: string[] } = {};

  async ngOnInit(): Promise<void> {
    // Paso guardado
    if (this.datosEntrada?.step) this.step = this.datosEntrada.step;

    // Restaurar previas desde base64
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

    // Restaurar post desde base64
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

    // Construir mods seleccionadas (para STEP 2)
    const allMods = Array.isArray(this.datosEntrada?.modificaciones)
      ? this.datosEntrada.modificaciones
      : [];
    this.modsSeleccionadas = allMods.filter((m: any) => m?.seleccionado);

    // Repartir imágenes planas en perMod (máx. 1 por mod en step 2)
    await this.hydratePerModFromFlat();

    // 🔹 Restaurar documentación (step 3)
    if (this.datosEntrada?.docsImagesB64) {
      this.docsImagesB64 = { ...this.datosEntrada.docsImagesB64 };
      for (const [tipo, arrB64] of Object.entries(this.docsImagesB64)) {
        this.docsPreviews[tipo] = [...(arrB64 || [])];
        this.docsBlobs[tipo] = await Promise.all(
          (arrB64 as string[]).map((b64) => this.dataUrlToBlob(b64))
        );
      }
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
      ...(this.prevImagesB64.length
        ? { prevImagesB64: this.prevImagesB64 }
        : {}),
      ...(this.postImagesB64.length
        ? { postImagesB64: this.postImagesB64 }
        : {}),
      ...(Object.keys(this.docsImagesB64).length
        ? { docsImagesB64: this.docsImagesB64 }
        : {}),
      prevImages: this.prevImages,
      postImages: this.postImages,
    };
  }

  private emitAutosave() {
    this.autosave.emit(this.snapshot());
  }

  // ========= Normalización orientación =========
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

  // ========= Previas (step 1) =========
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

  isValidPreview(previews: string[]): number {
    return previews.filter((p) => !!p).length;
  }

  // ========= Distribuir imágenes planas en perMod =========
  private async hydratePerModFromFlat(): Promise<void> {
    this.perModPreviews = {};
    this.perModBlobs = {};

    if (!this.postImagesB64?.length || !this.modsSeleccionadas?.length) return;

    let idx = 0;
    for (const mod of this.modsSeleccionadas) {
      const nombre = mod.nombre;
      this.perModPreviews[nombre] = [];
      this.perModBlobs[nombre] = [];

      for (let k = 0; k < 1 && idx < this.postImagesB64.length; k++, idx++) {
        const b64 = this.postImagesB64[idx];
        this.perModPreviews[nombre].push(b64);
        const blob = await this.dataUrlToBlob(b64);
        this.perModBlobs[nombre].push(blob);
      }
    }

    this.recomputeFlatFromPerMod();
  }

  // ========= Selección por mod (step 2) =========
  async onPostSelectedForMod(ev: Event, modNombre: string) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files).slice(0, 1); // máx. 1 por mod

    // Validar límite global (30)
    const projected = this.totalWithoutMod(modNombre) + files.length;
    if (projected > 30) {
      this.errorPostImagesCount = true;
      input.value = '';
      return;
    }
    this.errorPostImagesCount = false;

    const blobs = await Promise.all(
      files.map((f) => this.normalizeOrientation(f))
    );
    const previews = await Promise.all(blobs.map((b) => this.blobToDataUrl(b)));

    this.perModBlobs[modNombre] = blobs;
    this.perModPreviews[modNombre] = previews;

    this.recomputeFlatFromPerMod();
    this.emitAutosave();

    input.value = '';
  }

  removePerModImage(modNombre: string, index: number) {
    const arrPrev = this.perModPreviews[modNombre] || [];
    const arrBlob = this.perModBlobs[modNombre] || [];
    if (index < 0 || index >= arrPrev.length) return;

    arrPrev.splice(index, 1);
    arrBlob.splice(index, 1);

    this.perModPreviews[modNombre] = arrPrev;
    this.perModBlobs[modNombre] = arrBlob;

    this.recomputeFlatFromPerMod();
    this.emitAutosave();
  }

  private recomputeFlatFromPerMod() {
    const orderedMods = this.modsSeleccionadas.map((m) => m.nombre);

    const newB64: string[] = [];
    const newPrev: string[] = [];
    const newBlobs: Blob[] = [];

    for (const nombre of orderedMods) {
      const previews = this.perModPreviews[nombre] || [];
      const blobs = this.perModBlobs[nombre] || [];

      const slicePrev = previews.slice(0, 1);
      const sliceBlob = blobs.slice(0, 1);

      newB64.push(...slicePrev);
      newPrev.push(...slicePrev);
      newBlobs.push(...sliceBlob);
    }

    if (newB64.length > 30) {
      this.errorPostImagesCount = true;
      newB64.length = 30;
      newPrev.length = 30;
      newBlobs.length = 30;
    } else {
      this.errorPostImagesCount = false;
    }

    this.postImagesB64 = newB64;
    this.postPreviews = newPrev;
    this.postImages = newBlobs;
  }

  private totalWithoutMod(modNombre: string): number {
    let total = 0;
    for (const [k, arr] of Object.entries(this.perModPreviews)) {
      if (k === modNombre) continue;
      total += arr?.length || 0;
    }
    return total;
  }

  // ========= Selección de imágenes de documentación (step 3) =========
  async onDocSelected(ev: Event, tipo: string) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files).slice(0, 4); // máx. 4 imágenes
    const blobs = await Promise.all(
      files.map((f) => this.normalizeOrientation(f))
    );
    const previews = await Promise.all(blobs.map((b) => this.blobToDataUrl(b)));

    this.docsBlobs[tipo] = blobs;
    this.docsPreviews[tipo] = previews;
    this.docsImagesB64[tipo] = previews;

    this.emitAutosave();
    input.value = '';
  }

  removeDocImage(tipo: string, index: number) {
    const arrPrev = this.docsPreviews[tipo] || [];
    const arrBlob = this.docsBlobs[tipo] || [];
    const arrB64 = this.docsImagesB64[tipo] || [];

    if (index < 0 || index >= arrPrev.length) return;

    arrPrev.splice(index, 1);
    arrBlob.splice(index, 1);
    arrB64.splice(index, 1);

    this.docsPreviews[tipo] = arrPrev;
    this.docsBlobs[tipo] = arrBlob;
    this.docsImagesB64[tipo] = arrB64;

    this.emitAutosave();
  }

  // ========= Navegación =========
  next() {
    if (this.step < 3) {
      this.step++;
      this.emitAutosave();
    }
  }

  back() {
    if (this.step > 1) {
      this.step--;
      this.emitAutosave();
    } else {
      const snap = this.snapshot();
      this.volver.emit(snap);
    }
  }

  onSave() {
    this.emitAutosave();
    const snap = this.snapshot();
    this.continuar.emit(snap);
  }

  // ========= Imagen ejemplo por mod =========
  getImagenEjemplo(modNombre: string): string {
    const mapa: { [k: string]: string } = {
      // Ej: 'NEUMÁTICOS': 'assets/ejemplos/neumaticos.png'
    };
    return mapa[modNombre] || 'assets/cochee.png';
  }
}
