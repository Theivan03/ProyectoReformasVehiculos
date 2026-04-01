import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  REFORMA_CAMPOS_COMPARTIDOS,
  ReformaCampoCompartidoDefinicion,
  ReformaCampoCompartidoGrupo,
} from '../interfaces/modificacion';

type EstadoCamposCompartidos = Partial<
  Record<ReformaCampoCompartidoGrupo, Record<string, any>>
>;

@Injectable({ providedIn: 'root' })
export class DatosReformaService {
  private datos: any = {};
  private readonly definiciones = new Map<
    ReformaCampoCompartidoGrupo,
    ReformaCampoCompartidoDefinicion
  >(REFORMA_CAMPOS_COMPARTIDOS.map((def) => [def.grupo, def]));
  private readonly estadoCompartidoSubject =
    new BehaviorSubject<EstadoCamposCompartidos>({});
  readonly estadoCompartido$ = this.estadoCompartidoSubject.asObservable();

  setCampo(clave: string, valor: any) {
    this.datos[clave] = valor;
  }

  getDatos() {
    return this.datos;
  }

  getCamposCompartidos(grupo: ReformaCampoCompartidoGrupo): readonly string[] {
    return this.definiciones.get(grupo)?.campos ?? [];
  }

  esCampoCompartido(
    grupo: ReformaCampoCompartidoGrupo,
    campo: string,
  ): boolean {
    return this.getCamposCompartidos(grupo).includes(campo);
  }

  getGrupoCompartido(grupo: ReformaCampoCompartidoGrupo): Record<string, any> {
    return this.estadoCompartidoSubject.value[grupo] ?? {};
  }

  getEstadoCompartido(): EstadoCamposCompartidos {
    return this.estadoCompartidoSubject.value;
  }

  capturarEntidadCompartida(
    grupo: ReformaCampoCompartidoGrupo,
    entidad: Record<string, any>,
    sobrescribir = true,
  ): void {
    if (!entidad || typeof entidad !== 'object') return;

    const estadoActual = this.estadoCompartidoSubject.value;
    const grupoActual = { ...(estadoActual[grupo] ?? {}) };
    let cambiado = false;

    for (const campo of this.getCamposCompartidos(grupo)) {
      if (!(campo in entidad)) continue;

      const valor = entidad[campo];
      if (this.estaVacio(valor)) continue;

      if (!sobrescribir && !this.estaVacio(grupoActual[campo])) {
        continue;
      }

      if (this.sonIguales(grupoActual[campo], valor)) {
        continue;
      }

      grupoActual[campo] = this.clonarValor(valor);
      cambiado = true;
    }

    if (!cambiado) return;

    this.estadoCompartidoSubject.next({
      ...estadoActual,
      [grupo]: grupoActual,
    });
  }

  resetEstadoCompartido(): void {
    this.estadoCompartidoSubject.next({});
  }

  reset() {
    this.datos = {};
    this.resetEstadoCompartido();
  }

  private estaVacio(valor: unknown): boolean {
    if (valor === null || valor === undefined) return true;
    if (typeof valor === 'string') return valor.trim().length === 0;
    return false;
  }

  private sonIguales(actual: unknown, siguiente: unknown): boolean {
    return JSON.stringify(actual) === JSON.stringify(siguiente);
  }

  private clonarValor(valor: any): any {
    if (Array.isArray(valor)) return [...valor];
    if (valor && typeof valor === 'object') return { ...valor };
    return valor;
  }
}
