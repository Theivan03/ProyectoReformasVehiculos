import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-imagenes',
  standalone: true,
  imports: [CommonModule],
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
  prevImages: File[] = [];
  postImages: File[] = [];
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

  onPrevSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    // Límite de 4 imágenes previas
    if (files.length > 4) {
      alert('Solo puedes seleccionar hasta 4 imágenes previas');
      input.value = ''; // limpia la selección
      return;
    }

    this.prevImages = files;
    this.prevPreviews = this.prevImages.map((f) => URL.createObjectURL(f));
  }

  onPostSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    // Límite de 30 imágenes posteriores
    if (files.length > 30) {
      alert('Solo puedes seleccionar hasta 30 imágenes de la reforma');
      input.value = ''; // limpia la selección
      return;
    }

    this.postImages = files;
    this.postPreviews = this.postImages.map((f) => URL.createObjectURL(f));
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
}
