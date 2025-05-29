import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { generarDocumentoProyecto } from '../generadores/proyecto-word';
import { generarDocumentoFinalObra } from '../generadores/certificado-final-obra';
import { generarDocumentoTaller } from '../generadores/certificado-taller';
import { generarDocumentoResponsable } from '../generadores/declaracion-responsable';
import { Router } from '@angular/router';

@Component({
  selector: 'app-generador-documentos',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './generador-documentos.component.html',
  styleUrl: './generador-documentos.component.css',
})
export class GeneradorDocumentosComponent implements OnInit {
  constructor(private router: Router) {}

  @Input() reformaData: any;
  @Output() volverAlFormulario = new EventEmitter<void>();

  ngOnInit(): void {
    console.log('Datos de reforma recibidos:', this.reformaData);
  }

  generar(tipo: string): void {
    switch (tipo) {
      case 'proyecto':
        generarDocumentoProyecto(this.reformaData);
        break;
      case 'certificado-obra':
        generarDocumentoFinalObra(this.reformaData);
        break;
      case 'certificado-taller':
        generarDocumentoTaller(this.reformaData);
        break;
      case 'declaracion-responsable':
        generarDocumentoResponsable(this.reformaData);
        break;
    }
  }

  volver(): void {
    this.volverAlFormulario.emit(this.reformaData);
  }
}
