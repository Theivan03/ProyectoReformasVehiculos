import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import html2canvas from 'html2canvas';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Marker {
  x: number;
  y: number;
  label: string;
  etiqueta: string;
  labelIndex?: number;
}

interface DetallesMuelles {
  muelleDelanteroConRef?: boolean;
  muelleDelanteroSinRef?: boolean;
  ballestaDelantera?: boolean;
  amortiguadorDelantero?: boolean;
  muelleTraseroConRef?: boolean;
  muelleTraseroSinRef?: boolean;
  ballestaTrasera?: boolean;
  amortiguadorTrasero?: boolean;
  tacosDeGoma?: boolean;
  kitElevacion?: boolean;
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
  @Output() autosave = new EventEmitter<any>();

  @ViewChild('canvasContainer') canvasContainer!: ElementRef;
  @ViewChild('canvasImg', { static: true })
  imgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('firmaCompleta') firmaRef!: ElementRef;

  labels: string[] = [];
  selectedIndex: number | null = null;
  markers: Marker[] = [];
  imageSrc = '';

  firmaUrl = '';
  fechaFirma = '';
  nombreIngeniero: string = '';
  numColegiado: string = '';
  tituloIngeniero: string = '';

  private tipoVehiculoAnterior = '';
  private etiquetasAnteriores: string[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  private readonly SUSP_LABELS: Record<keyof DetallesMuelles, string> = {
    muelleDelanteroConRef: 'Muelle delantero (con referencia)',
    muelleDelanteroSinRef: 'Muelle delantero (sin referencia)',
    ballestaDelantera: 'Ballesta delantera',
    amortiguadorDelantero: 'Amortiguador delantero',
    muelleTraseroConRef: 'Muelle trasero (con referencia)',
    muelleTraseroSinRef: 'Muelle trasero (sin referencia)',
    ballestaTrasera: 'Ballesta trasera',
    amortiguadorTrasero: 'Amortiguador trasero',
    tacosDeGoma: 'Tacos de goma / suplementos',
    kitElevacion: 'Kit de elevación',
  };

  private readonly LUCES_LABELS: Record<string, string> = {
    luzGrupoOptico: 'Grupo óptico delantero',
    intermitenteDelantero: 'Intermitente delantero',
    intermitenteTrasero: 'Intermitente trasero',
    catadioptrico: 'Catadióptrico',
    luzMatricula: 'Luz de matrí­cula',
    luzAntinieblas: 'Luz antinieblas',
    luzFreno: 'Luz de freno',
  };

  private readonly CANVAS_HIDDEN_MOD_NAMES = [
    'AUMENTO DE PLAZAS',
    'REDUCCION DE PLAZAS',
    'REDUCCION DE MMA',
    'REDUCCION DE MMTA',
  ];

  private readonly CANVAS_HIDDEN_MOD_NAMES_NORMALIZED = new Set<string>(
    this.CANVAS_HIDDEN_MOD_NAMES.map((name) => this.normalizeText(name)),
  );
  private readonly CANVAS_HIDDEN_MOD_RULES: Array<(mod: any) => boolean> = [
    (mod) =>
      this.CANVAS_HIDDEN_MOD_NAMES_NORMALIZED.has(
        this.normalizeText(mod?.nombre),
      ),
    (mod) =>
      this.normalizeText(mod?.nombre) === 'AUMENTO O DISMINUCION DE PLAZAS' &&
      (mod?.tipoCambio || '').toString().trim().toLowerCase() === 'aumento',
  ];

  private normalizeText(value: unknown): string {
    return (value ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private shouldHideModInCanvas(mod: any): boolean {
    return this.CANVAS_HIDDEN_MOD_RULES.some((rule) => rule(mod));
  }

  private hasValue(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  }

  private isMobiliarioInteriorMod(mod: any, normalizedName: string): boolean {
    return (
      normalizedName.includes('MOBILIARIO INTERIOR') ||
      mod?.opcionesMueble != null ||
      Array.isArray(mod?.mueblesBajo) ||
      Array.isArray(mod?.mueblesAlto) ||
      Array.isArray(mod?.mueblesAseo)
    );
  }

  private isInstalacionElectricaMod(mod: any, normalizedName: string): boolean {
    return (
      (normalizedName.includes('INSTALACI') &&
        normalizedName.includes('CTRICA')) ||
      Array.isArray(mod?.placasSolares) ||
      this.hasValue(mod?.cantidadBaterias) ||
      this.hasValue(mod?.potenciaBaterias) ||
      this.hasValue(mod?.ubicacionBaterias) ||
      this.hasValue(mod?.potenciaInversor) ||
      this.hasValue(mod?.marcaInversor) ||
      this.hasValue(mod?.homologacionInversor) ||
      this.hasValue(mod?.ubicacionInversor) ||
      this.hasValue(mod?.modeloControlador) ||
      this.hasValue(mod?.marcaControlador) ||
      this.hasValue(mod?.homologacionControlador) ||
      this.hasValue(mod?.ubicacionControlador)
    );
  }

  private buildLabelWithModel(
    prefix: 'Ventana' | 'Claraboya',
    model: any,
  ): string {
    const modelText = (model ?? '').toString().trim();
    return modelText ? `${prefix} ${modelText}` : prefix;
  }

  private toPositiveInt(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed);
  }

  private clamp01(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(1, parsed));
  }

  private parseMarkerIndex(marker: any): number {
    const explicitIndex = Number(marker?.labelIndex);
    if (Number.isInteger(explicitIndex) && explicitIndex >= 0) {
      return explicitIndex;
    }

    const parsedLabel = Number(marker?.label);
    if (Number.isInteger(parsedLabel) && parsedLabel > 0) {
      return parsedLabel - 1;
    }

    return -1;
  }

  private normalizarMarcadoresGuardados(
    source: any[],
    labels: string[],
  ): Marker[] {
    const indexesByLabel = new Map<string, number[]>();
    labels.forEach((label, idx) => {
      const indexes = indexesByLabel.get(label) ?? [];
      indexes.push(idx);
      indexesByLabel.set(label, indexes);
    });

    const consumedByLabel = new Map<string, number>();

    const normalized: Marker[] = [];

    source.forEach((marker) => {
        if (!marker) return;

        const etiquetaGuardada = (marker?.etiqueta ?? '').toString();
        let resolvedIndex = this.parseMarkerIndex(marker);

        if (resolvedIndex < 0 || resolvedIndex >= labels.length) {
          const indexes = indexesByLabel.get(etiquetaGuardada) ?? [];
          const consumed = consumedByLabel.get(etiquetaGuardada) ?? 0;
          if (consumed < indexes.length) {
            resolvedIndex = indexes[consumed];
            consumedByLabel.set(etiquetaGuardada, consumed + 1);
          }
        }

        if (resolvedIndex < 0 || resolvedIndex >= labels.length) {
          return;
        }

        normalized.push({
          x: this.clamp01(marker?.x),
          y: this.clamp01(marker?.y),
          label: String(resolvedIndex + 1),
          etiqueta: labels[resolvedIndex] ?? etiquetaGuardada,
          labelIndex: resolvedIndex,
        });
      });

    return normalized;
  }

  private expandClaraboyas(mod: any): string[] {
    const out: string[] = [];

    if (Array.isArray(mod?.claraboyas) && mod.claraboyas.length > 0) {
      mod.claraboyas.forEach((item: any) => {
        out.push(this.buildLabelWithModel('Claraboya', item?.modelo));
      });
      return out;
    }

    const legacyExists =
      mod?.modeloClaraboya ||
      mod?.marcaClaraboya ||
      mod?.homologacionClaraboya ||
      mod?.descripcionClaraboya ||
      mod?.cantidadClaraboya;

    if (!legacyExists) return out;

    const qty = this.toPositiveInt(mod?.cantidadClaraboya);
    const count = qty > 0 ? qty : 1;
    for (let i = 0; i < count; i++) {
      out.push(this.buildLabelWithModel('Claraboya', mod?.modeloClaraboya));
    }

    return out;
  }

  private expandVentanas(mod: any): string[] {
    const out: string[] = [];

    if (Array.isArray(mod?.ventanas) && mod.ventanas.length > 0) {
      mod.ventanas.forEach((item: any) => {
        out.push(this.buildLabelWithModel('Ventana', item?.modelo));
      });
      return out;
    }

    const legacyExists =
      mod?.modeloVentana ||
      mod?.marcaVentana ||
      mod?.homologacionVentana ||
      mod?.descripcionVentana ||
      mod?.dimensionesVentana ||
      mod?.cantidadVentanas;

    if (!legacyExists) return out;

    const qty = this.toPositiveInt(mod?.cantidadVentanas);
    const count = qty > 0 ? qty : 1;
    for (let i = 0; i < count; i++) {
      out.push(this.buildLabelWithModel('Ventana', mod?.modeloVentana));
    }

    return out;
  }

  private expandReformasAdicionalesLabels(mod: any): string[] {
    const out: string[] = [];
    const items = Array.isArray(mod?.reformasAdicionalesItems)
      ? mod.reformasAdicionalesItems
      : [];

    items.forEach((item: any, index: number) => {
      const titulo = (item?.titulo ?? '').toString().trim();
      if (titulo) {
        out.push(titulo);
        return;
      }

      const descripcion = (item?.descripcion ?? '').toString().trim();
      if (descripcion) {
        out.push(`Reforma adicional ${index + 1}`);
      }
    });

    return out;
  }

  private isCasuisticaSuspension(nombre: string | undefined): boolean {
    return (
      (nombre || '').trim().toUpperCase() ===
      'TODA LA CASUÍSTICA DE MUELLES, BALLESTAS Y AMORTIGUADORES QUE SE PUEDEN DAR'
    );
  }

  private expandSuspensionToLabels(det: DetallesMuelles | undefined): string[] {
    if (!det) return [];
    const out: string[] = [];
    (Object.keys(this.SUSP_LABELS) as Array<keyof DetallesMuelles>).forEach(
      (k) => {
        if (det[k]) out.push(this.SUSP_LABELS[k]);
      },
    );
    return out;
  }

  private snapshot(): any {
    return {
      ...(this.datosEntrada || {}),
      marcadores: this.markers.map((marker) => ({ ...marker })),
      fechaFirma: this.fechaFirma,
      firmaUrl: this.firmaUrl,
    };
  }
  private emitAutosave() {
    const data = this.snapshot();
    if (!data.tipoVehiculo) data.tipoVehiculo = this.datosEntrada?.tipoVehiculo;
    this.autosave.emit(data);
  }

  ngOnInit(): void {
    console.log('CanvaComponent ngOnInit - datosEntrada:', this.datosEntrada);
    this.fechaFirma = this.calcularFechaHoy();
    this.firmaUrl =
      this.datosEntrada?.firmaUrl ||
      '/imgs/firma-generada.png';

    const tipoActual = (this.datosEntrada?.tipoVehiculo || '')
      .toString()
      .trim()
      .toLowerCase();

    const ingeniero = this.datosEntrada?.ingeniero || {};

    this.nombreIngeniero = ingeniero.nombre;
    this.numColegiado = 'Col nº ' + ingeniero.numero + ' ' + ingeniero.colegio;
    this.tituloIngeniero = 'EL ' + ingeniero.titulacion;

    if (this.tipoVehiculoAnterior && tipoActual !== this.tipoVehiculoAnterior) {
      this.markers = [];
    }
    this.tipoVehiculoAnterior = tipoActual;

    if (Array.isArray(this.datosEntrada?.marcadores)) {
      this.markers = this.datosEntrada.marcadores.map((marker: any) => ({
        ...marker,
      }));
    }

    const nuevasLabels: string[] = [];
    const mods = Array.isArray(this.datosEntrada?.modificaciones)
      ? this.datosEntrada.modificaciones
      : [];

    for (const mod of mods) {
      const normalizedName = this.normalizeText(mod?.nombre);

      if (mod?.seleccionado && this.shouldHideModInCanvas(mod)) {
        continue;
      }

      if (
        mod?.seleccionado &&
        this.isMobiliarioInteriorMod(mod, normalizedName)
      ) {
        mod.mueblesBajo?.forEach((_: any, idx: number) =>
          nuevasLabels.push(`Mueble bajo ${idx + 1}`),
        );
        mod.mueblesAlto?.forEach((_: any, idx: number) =>
          nuevasLabels.push(`Mueble alto ${idx + 1}`),
        );
        mod.mueblesAseo?.forEach((_: any, idx: number) =>
          nuevasLabels.push(`Aseo ${idx + 1}`),
        );
        continue;
      }

      if (this.isCasuisticaSuspension(mod?.nombre)) {
        const sublabels = this.expandSuspensionToLabels(mod?.detallesMuelles);
        if (sublabels.length > 0) {
          nuevasLabels.push(...sublabels);
        }
        continue;
      }

      if (
        mod?.seleccionado &&
        this.isInstalacionElectricaMod(mod, normalizedName)
      ) {
        const sublabels = this.expandInstalacionElectrica(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado && mod?.nombre === 'LUCES') {
        const sublabels = this.expandLuces(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado && normalizedName === 'CLARABOYA') {
        const sublabels = this.expandClaraboyas(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (mod?.seleccionado && normalizedName === 'VENTANA') {
        const sublabels = this.expandVentanas(mod);
        if (sublabels.length > 0) nuevasLabels.push(...sublabels);
        continue;
      }

      if (
        mod?.seleccionado &&
        normalizedName === 'CAMPO LIBRE SOBRE REFORMAS NO EXISTENTES'
      ) {
        const sublabels = this.expandReformasAdicionalesLabels(mod);
        if (sublabels.length > 0) {
          nuevasLabels.push(...sublabels);
        } else {
          nuevasLabels.push(mod.nombre);
        }
        continue;
      }

      if (mod?.seleccionado) {
        nuevasLabels.push(mod.nombre);
      }
    }

    this.labels = nuevasLabels;
    this.etiquetasAnteriores = [...nuevasLabels];
    this.markers = this.normalizarMarcadoresGuardados(
      this.markers,
      this.labels,
    );

    let url = '';
    switch (tipoActual) {
      case 'camper':
        url = '/imgs/camper2.png';
        break;
      case 'moto':
        url = '/imgs/moto.png';
        break;
      default:
        url = '/imgs/coche.png';
    }
    this.cargarImagenComoBase64(url).then((base64) => (this.imageSrc = base64));

    this.emitAutosave();
  }

  private expandInstalacionElectrica(mod: any): string[] {
    const hasValue = (value: unknown): boolean => {
      if (value === undefined || value === null) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return Number.isFinite(value);
      if (Array.isArray(value)) return value.some((item) => hasValue(item));
      if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some((item) =>
          hasValue(item),
        );
      }
      return Boolean(value);
    };

    const out: string[] = [];

    if (Array.isArray(mod.placasSolares)) {
      mod.placasSolares.forEach((placa: any, i: number) => {
        const marca = (placa?.marcaPlacaSolar ?? placa?.marca ?? '')
          .toString()
          .trim();
        const modelo = (placa?.modeloPlacaSolar ?? placa?.modelo ?? '')
          .toString()
          .trim();
        const potencia = (placa?.potencia ?? '').toString().trim();
        const dimensiones = (placa?.dimensiones ?? '').toString().trim();
        const ubicacion = (placa?.ubicacion ?? '').toString().trim();

        if (!hasValue(placa) && !marca && !modelo && !potencia && !dimensiones && !ubicacion) {
          return;
        }

        const detalle = [marca, modelo].filter(Boolean).join(' ');
        const cantidad =
          placa?.agruparIguales && Number(placa?.cantidad) > 1
            ? Math.trunc(Number(placa.cantidad))
            : 1;
        out.push(
          cantidad > 1
            ? detalle
              ? `${cantidad} placas solares (${detalle})`
              : `${cantidad} placas solares`
            : detalle
              ? `Placa solar ${i + 1} (${detalle})`
              : `Placa solar ${i + 1}`,
        );
      });
    }

    const hasBateriaData = hasValue(mod.cantidadBaterias) || hasValue(mod.potenciaBaterias) || hasValue(mod.ubicacionBaterias);
    const hasInversorData = hasValue(mod.potenciaInversor) || hasValue(mod.marcaInversor) || hasValue(mod.homologacionInversor) || hasValue(mod.ubicacionInversor);
    const hasControladorData = hasValue(mod.modeloControlador) || hasValue(mod.marcaControlador) || hasValue(mod.homologacionControlador) || hasValue(mod.ubicacionControlador);

    if (hasBateriaData) {
      out.push('Batería');
    }

    if (hasInversorData) {
      out.push('Inversor');
    }

    if (hasControladorData) {
      out.push('Controlador');
    }

    if (hasValue(mod.instalacionesSecundarias)) {
      out.push('Instalaciones secundarias');
    }

    return out;
  }

  private expandLuces(mod: any): string[] {
    const det = mod?.descripcionLuces;
    if (!det) return [];

    const out: string[] = [];
    (
      Object.keys(this.LUCES_LABELS) as Array<keyof typeof this.LUCES_LABELS>
    ).forEach((k) => {
      if (det[k]) {
        out.push(this.LUCES_LABELS[k]);
      }
    });
    return out;
  }

  calcularFechaHoy(): string {
    if (!this.datosEntrada?.fechaProyecto) {
      return '';
    }

    const [year, month, day] = this.datosEntrada.fechaProyecto
      .split('-')
      .map(Number);

    const fecha = new Date(year, month - 1, day);

    return `Teulada, ${fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`;
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
    this.emitAutosave();
  }

  onImageClick(event: MouseEvent): void {
    const imgEl = this.imgRef.nativeElement;
    if (this.selectedIndex === null || event.target !== imgEl) return;

    const rect = imgEl.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    this.markers.push({
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      label: (this.selectedIndex + 1).toString(),
      etiqueta: this.labels[this.selectedIndex],
      labelIndex: this.selectedIndex,
    });

    this.emitAutosave();
  }

  undoMarker(): void {
    this.markers.pop();
    this.emitAutosave();
  }

  onBack(): void {
    this.datosEntrada.marcadores = this.markers;
    this.datosEntrada.fechaFirma = this.fechaFirma;
    this.datosEntrada.firmaUrl = this.firmaUrl;
    this.emitAutosave();
    this.volver.emit(this.snapshot());
  }

  async onContinue(): Promise<void> {
    this.datosEntrada.marcadores = this.markers;
    this.datosEntrada.fechaFirma = this.fechaFirma;
    this.datosEntrada.firmaUrl = this.firmaUrl;

    this.emitAutosave();
    try {
      await Promise.all([this.guardarImagen(), this.guardarFirma()]);
    } catch (error) {
      console.error('Error guardando recursos del plano:', error);
      alert(
        'No se pudo guardar correctamente el plano o la firma. Inténtalo de nuevo.',
      );
      return;
    }

    this.continuar.emit(this.snapshot());
  }

  private async esperarRepintado(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  private async esperarImagenLista(): Promise<HTMLImageElement> {
    const imgEl = this.imgRef.nativeElement;
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      return imgEl;
    }

    await new Promise<void>((resolve, reject) => {
      const onLoad = () => {
        imgEl.removeEventListener('load', onLoad);
        imgEl.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        imgEl.removeEventListener('load', onLoad);
        imgEl.removeEventListener('error', onError);
        reject(new Error('No se pudo cargar la imagen base del plano.'));
      };

      imgEl.addEventListener('load', onLoad);
      imgEl.addEventListener('error', onError);
    });

    return imgEl;
  }

  private async renderizarPlanoConMarcadores(): Promise<string> {
    this.cdr.detectChanges();
    await this.esperarRepintado();

    const imgEl = await this.esperarImagenLista();
    const width = imgEl.naturalWidth || imgEl.width;
    const height = imgEl.naturalHeight || imgEl.height;

    if (!width || !height) {
      throw new Error('La imagen base del plano no tiene dimensiones válidas.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D para el plano.');
    }

    ctx.drawImage(imgEl, 0, 0, width, height);

    const markerDiameter = Math.max(18, Math.round(Math.min(width, height) * 0.04));
    const markerRadius = markerDiameter / 2;
    const fontSize = Math.max(12, Math.round(markerDiameter * 0.62));

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${fontSize}px Arial`;

    this.markers.forEach((marker) => {
      const x = Math.max(markerRadius, Math.min(width - markerRadius, marker.x * width));
      const y = Math.max(markerRadius, Math.min(height - markerRadius, marker.y * height));

      ctx.beginPath();
      ctx.fillStyle = '#212529';
      ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(String(marker.label || ''), x, y);
    });

    return canvas.toDataURL('image/png');
  }

  private async guardarImagen(): Promise<void> {
    const imagenBase64 = await this.renderizarPlanoConMarcadores();

    await firstValueFrom(
      this.http.post('/guardar-imagen-plano', {
        imagenBase64,
        nombreArchivo: `plano-generado-proyecto${this.datosEntrada.numeroProyecto}.png`,
      }),
    );
  }

  private async guardarFirma(): Promise<void> {
    const el = this.firmaRef.nativeElement;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    const imagenBase64 = canvas.toDataURL('image/png');

    await firstValueFrom(
      this.http.post('/guardar-firma', {
        imagenBase64,
        nombreArchivo: 'firma-generada.png',
      }),
    );
  }
}
