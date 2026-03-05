import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener, // <--- 1. IMPORTAR ESTO
} from '@angular/core';
import loadImage from 'blueimp-load-image';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imagenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imagenes.component.html',
  styleUrls: ['./imagenes.component.css'],
})
export class ImagenesComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() datosEntrada: any;
  @Output() volver = new EventEmitter<any>();
  @Output() continuar = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<any>();
  @Input() origen: 'anterior' | 'siguiente' = 'anterior';

  @ViewChild('postDropzone') postDropzone:
    | ElementRef<HTMLDivElement>
    | undefined;

  step = 1;
  procesando = false;

  prevImages: Blob[] = [];
  postImages: Blob[] = [];
  prevPreviews: string[] = [];
  postPreviews: string[] = [];

  private prevImagesB64: string[] = [];
  private postImagesB64: string[] = [];

  errorPrevImagesCount = false;
  errorPostImagesCount = false;

  // --------------------------------------------------
  //  LISTENER GLOBAL PARA PEGAR (LA SOLUCIÓN)
  // --------------------------------------------------
  @HostListener('window:paste', ['$event'])
  async onGlobalPaste(event: ClipboardEvent): Promise<void> {
    // Solo actuamos si estamos en el paso 2
    if (this.step !== 2) return;

    // Si hay modales abiertos o inputs de texto activos, quizás quieras evitarlo,
    // pero para esta pantalla suele estar bien así.

    event.preventDefault(); // Evitar duplicados si el foco estaba en el div
    if (this.procesando) return;

    const files = this.getFilesFromClipboard(event);
    if (files.length > 0) {
      await this.procesarArchivosPost(files);
    }
  }

  // --------------------------------------------------
  //  MANEJADORES PARA PASO 1 (ANTERIORES)
  // --------------------------------------------------

  async onPrevPaste(event: ClipboardEvent, index: number): Promise<void> {
    event.preventDefault();
    // Evitamos que el listener global salte si estamos pegando en un input específico del paso 1
    event.stopPropagation();

    if (this.procesando) return;

    const file = this.getFileFromClipboard(event);
    if (file) {
      await this.procesarArchivoPrev(file, index);
    }
  }

  async onPrevDrop(event: DragEvent, index: number): Promise<void> {
    event.preventDefault();
    if (this.procesando) return;

    if (event.dataTransfer?.files) {
      const file = event.dataTransfer.files[0];
      await this.procesarArchivoPrev(file, index);
    }
  }

  async onPrevSelected(ev: Event, index: number) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    await this.procesarArchivoPrev(file, index);
    input.value = '';
  }

  private async procesarArchivoPrev(file: File, index: number): Promise<void> {
    if (!file || !file.type.startsWith('image/')) {
      console.warn('Elemento no válido o no es una imagen.');
      return;
    }
    if (index < 0 || index >= 4) return;

    this.procesando = true;
    try {
      const blob = await this.normalizeAndCompress(file);
      const preview = await this.blobToDataUrl(blob);

      this.prevImages[index] = blob;
      this.prevPreviews[index] = preview;
      this.prevImagesB64[index] = preview;

      this.emitAutosave();
    } catch (err) {
      console.error(`Error procesando imagen previa [${index}]:`, err);
    } finally {
      this.procesando = false;
    }
  }

  // --------------------------------------------------
  //  MANEJADORES PARA PASO 2 (POSTERIORES)
  // --------------------------------------------------

  // NOTA: Este método se mantiene por si el foco está explícitamente en el div,
  // pero el @HostListener de arriba hará el trabajo pesado.
  async onPostPaste(event: ClipboardEvent): Promise<void> {
    // Ya lo maneja el global, pero por seguridad:
    // event.preventDefault();
    // ... lógica redundante si usas window:paste
  }

  async onPostDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    if (this.procesando) return;

    if (!event.dataTransfer?.files) return;
    await this.procesarArchivosPost(event.dataTransfer.files);
  }

  async onPostSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    await this.procesarArchivosPost(input.files);
    input.value = '';
  }

  private async procesarArchivosPost(files: FileList | File[]): Promise<void> {
    if (this.procesando) return;

    const fileList = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (fileList.length === 0) return;

    if (this.postImages.length + fileList.length > 30) {
      this.errorPostImagesCount = true;
      return;
    }
    this.errorPostImagesCount = false;

    this.procesando = true;
    try {
      const blobs = await Promise.all(
        fileList.map((f) => this.normalizeAndCompress(f))
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
    }
  }

  // --------------------------------------------------
  //  MANEJADORES DE PORTAPAPELES (SIN CAMBIOS)
  // --------------------------------------------------
  private getFileFromClipboard(event: ClipboardEvent): File | null {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return null;
    if (clipboardData.files && clipboardData.files.length > 0) {
      if (clipboardData.files[0].type.startsWith('image/'))
        return clipboardData.files[0];
    }
    if (clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) return file;
        }
      }
    }
    return null;
  }

  private getFilesFromClipboard(event: ClipboardEvent): File[] {
    const clipboardData = event.clipboardData;
    const files: File[] = [];
    if (!clipboardData) return files;
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        if (clipboardData.files[i].type.startsWith('image/')) {
          files.push(clipboardData.files[i]);
        }
      }
      if (files.length > 0) return files;
    }
    if (clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    }
    return files;
  }

  // --------------------------------------------------
  //  CICLO DE VIDA Y RESTO (SIN CAMBIOS IMPORTANTES)
  // --------------------------------------------------
  async ngOnInit(): Promise<void> {
    this.step = this.origen === 'siguiente' ? 2 : 1;
    // ... carga de datos igual que tenías ...
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

    while (this.prevPreviews.length < 4) {
      this.prevPreviews.push('');
      this.prevImages.push(new Blob());
      this.prevImagesB64.push('');
    }
    this.emitAutosave();
  }

  ngAfterViewInit(): void {
    this.focusPostDropzone();
  }

  ngOnDestroy(): void {}

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
      prevImagesB64: this.prevImagesB64.filter((p) => p),
      postImagesB64: this.postImagesB64,
      prevImages: this.prevImages.filter((p) => p.size > 0),
      postImages: this.postImages,
    };
  }

  private emitAutosave() {
    this.autosave.emit(this.snapshot());
  }

  private normalizeAndCompress(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      loadImage(
        file,
        (canvasElement) => {
          if (!(canvasElement instanceof HTMLCanvasElement)) {
            return reject('No se pudo procesar la imagen');
          }
          const mimeType = 'image/jpeg';
          canvasElement.toBlob(
            (blob) => {
              blob ? resolve(blob) : reject('Error creando Blob comprimido');
            },
            mimeType,
            0.7
          );
        },
        { canvas: true, orientation: true, maxWidth: 1600, maxHeight: 1600 }
      );
    });
  }

  // ... funciones movePrev, moveNext, movePrevPost, moveNextPost ...
  movePrev(i: number) {
    if (i === 0) return;
    this.swapPrev(i, i - 1);
  }
  moveNext(i: number) {
    if (i === this.prevPreviews.length - 1) return;
    this.swapPrev(i, i + 1);
  }
  private swapPrev(i: number, j: number) {
    [this.prevPreviews[j], this.prevPreviews[i]] = [
      this.prevPreviews[i],
      this.prevPreviews[j],
    ];
    [this.prevImagesB64[j], this.prevImagesB64[i]] = [
      this.prevImagesB64[i],
      this.prevImagesB64[j],
    ];
    [this.prevImages[j], this.prevImages[i]] = [
      this.prevImages[i],
      this.prevImages[j],
    ];
    this.emitAutosave();
  }

  movePrevPost(i: number) {
    if (i === 0) return;
    this.swapPost(i, i - 1);
  }
  moveNextPost(i: number) {
    if (i === this.postPreviews.length - 1) return;
    this.swapPost(i, i + 1);
  }
  private swapPost(i: number, j: number) {
    [this.postPreviews[j], this.postPreviews[i]] = [
      this.postPreviews[i],
      this.postPreviews[j],
    ];
    [this.postImagesB64[j], this.postImagesB64[i]] = [
      this.postImagesB64[i],
      this.postImagesB64[j],
    ];
    [this.postImages[j], this.postImages[i]] = [
      this.postImages[i],
      this.postImages[j],
    ];
    this.emitAutosave();
  }

  next() {
    if (this.step === 1) {
      this.step = 2;
      this.emitAutosave();
      this.focusPostDropzone();
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

  deletePostImage(index: number): void {
    if (index < 0 || index >= this.postPreviews.length) return;
    this.postPreviews.splice(index, 1);
    this.postImages.splice(index, 1);
    this.postImagesB64.splice(index, 1);
    if (this.postImages.length <= 30) {
      this.errorPostImagesCount = false;
    }
    this.emitAutosave();
  }

  private focusPostDropzone(): void {
    // Aunque con el HostListener ya no es crítico, mantener el foco ayuda a la accesibilidad
    setTimeout(() => {
      if (this.step === 2 && this.postDropzone) {
        this.postDropzone.nativeElement.focus();
      }
    }, 0);
  }
}
