import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DatosReformaService {
  private datos: any = {};

  setCampo(clave: string, valor: any) {
    this.datos[clave] = valor;
  }

  getDatos() {
    return this.datos;
  }

  reset() {
    this.datos = {};
  }
}
