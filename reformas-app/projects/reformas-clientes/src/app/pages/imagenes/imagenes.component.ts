import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import loadImage from 'blueimp-load-image';
import { CommonModule } from '@angular/common';
import { Modal } from 'bootstrap';

type SlotKey = string; // `${mod.nombre}::${subKey}`

@Component({
  selector: 'app-imagenes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imagenes.component.html',
  styleUrls: ['./imagenes.component.css'],
})
export class ImagenesComponent implements OnInit {
  @Input() datosEntrada: any;
  docError: { [tipo: string]: string } = {};

  @Output() volver = new EventEmitter<any>();
  @Output() continuar = new EventEmitter<any>();
  @Output() autosave = new EventEmitter<any>();

  @ViewChildren('galleryInputs') galleryInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('cameraInputs') cameraInputs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('galleryInputsMods') galleryInputsMods!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('cameraInputsMods') cameraInputsMods!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('galleryInputsDocs') galleryInputsDocs!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @ViewChildren('cameraInputsDocs') cameraInputsDocs!: QueryList<
    ElementRef<HTMLInputElement>
  >;

  step = 1;

  prevImages: Blob[] = [];
  prevPreviews: string[] = [];
  postImages: Blob[] = [];
  postPreviews: string[] = [];
  prevImagesB64: string[] = [];
  postImagesB64: string[] = [];

  errorPrevImagesCount = false;
  errorPostImagesCount = false;

  // ---- Paso 2: mods y slots (solo subopciones) ----
  modsSeleccionadas: any[] = [];
  selectedSubopts: { [modNombre: string]: Set<string> } = {};
  perSlotPreviews: { [slot: SlotKey]: string[] } = {};
  perSlotBlobs: { [slot: SlotKey]: Blob[] } = {};

  // ---- Paso 3: docs ----
  docsPreviews: { [tipo: string]: string[] } = {};
  docsBlobs: { [tipo: string]: Blob[] } = {};
  docsImagesB64: { [tipo: string]: string[] } = {};

  // ---- Modal quitar ----
  private modalInstance?: Modal;
  modParaQuitar: any | null = null;
  modalAction: 'mod' | 'sub' = 'mod';
  subParaQuitarKey: string | null = null;

  // ---- Títulos personalizables ----
  titulos: {
    mod?: { [modNombre: string]: string };
    sub?: { [modNombre: string]: { [subKey: string]: string } };
  } = {
    mod: {
      Ruedas: 'Ruedas',
      Suspensión: 'Suspensión',
      Carrocería: 'Carrocería',
      Luces: 'Luces',
      Dirección: 'Dirección',
      Freno: 'Frenos',
      'Unidad motriz': 'Unidad motriz',
      'Enganche de remolque': 'Enganche de remolque',
      'Enganche de remolque (quads)': 'Enganche de remolque (quads)',
      Portabicicletas: 'Portabicicletas',
      'Reducción de plazas de asiento': 'Reducción de plazas de asiento',
      'Modificaciones en el interior del vehículo': 'Interior del vehículo',
      'Instalación eléctrica': 'Instalación eléctrica',
      Toldo: 'Toldo',
      'Chasis y Subchasis': 'Chasis y Subchasis',
    },
    sub: {
      Ruedas: {
        neumaticos: 'Neumáticos y llantas',
        llantasCamper: 'Llantas',
        separadoresDeRueda: 'Separadores de rueda',
        separadoresDeRuedaCamper: 'Separadores de rueda',
        neumaticosMoto: 'Neumáticos (moto)',
        separadoresDeRuedaMoto: 'Separadores (quads)',
        neumaticosCamper: 'Neumáticos (camper)',
      },
      Suspensión: {
        muelleDelantero: 'Muelle delantero',
        muelleTrasero: 'Muelle trasero',
        ballestaDelantera: 'Ballesta delantera',
        ballestaTrasera: 'Ballesta trasera',
        amortiguadorDelantero: 'Amortiguador delantero',
        amortiguadorTrasero: 'Amortiguador trasero',
        suplementoSusDelantero: 'Suplemento suspensión delantero',
        suplementoSusTrasero: 'Suplemento suspensión trasero',
        horquillaDelanteraMoto: 'Horquilla delantera (moto)',
        muelleDelanteroMoto: 'Muelle delantero (moto)',
        muelleTraseroMoto: 'Muelle trasero (moto)',
        amortiguadorDelanteroMoto: 'Amortiguador delantero (moto)',
        amortiguadorTraseroMoto: 'Amortiguador trasero (moto)',
        muelleDelanteroCamper: 'Muelle delantero (camper)',
        muelleTraseroCamper: 'Muelle trasero (camper)',
        ballestasDelanterasCamper: 'Ballestas delanteras',
        ballestasTraserasCamper: 'Ballestas traseras',
        amortiguadorDelanteroCamper: 'Amortiguador delantero (camper)',
        amortiguadorTraseroCamper: 'Amortiguador trasero (camper)',
        suplementoSuspensionDelanteroCamper: 'Suplemento delan. (camper)',
        suplementoSuspensionTraseroCamper: 'Suplemento tras. (camper)',
      },
      Carrocería: {
        paragolpesDelantero: 'Paragolpes delantero',
        paragolpesTrasero: 'Paragolpes trasero',
        aleron: 'Alerón',
        aletinesYSobrealetines: 'Aletines / Sobrealetines',
        snorkel: 'Snorkel',
        peldaños: 'Peldaños',
        talonerasEstribos: 'Taloneras / Estribos',
        matriculaDelanteraPequeña: 'Matrícula delantera pequeña',
        cabrestante: 'Cabrestante',
        barraAntiempotramiento: 'Barra antiempotramiento',
        defensaDelantera: 'Defensa delantera',
        soporteRuedaRepuesto: 'Soporte de rueda de repuesto',
        bodyLift: 'Body Lift',
        paragolpesDelanteroCamper: 'Paragolpes delantero (camper)',
        paragolpesTraseroCamper: 'Paragolpes trasero (camper)',
        aleronCamper: 'Alerón (camper)',
        aletinesYSobrealetinesCamper: 'Aletines / Sobrealetines (camper)',
        snorkelCamper: 'Snorkel (camper)',
        peldañosCamper: 'Peldaños (camper)',
        talonerasEstribosCamper: 'Taloneras / Estribos (camper)',
        cabrestanteCamper: 'Cabrestante (camper)',
        defensaDelanteraCamper: 'Defensa delantera (camper)',
        soporteRuedaRepuestoCamper: 'Soporte rueda repuesto (camper)',
        // Moto
        guardabarrosDelanteroMoto: 'Guardabarros delantero (moto)',
        guardabarrosTraseroMoto: 'Guardabarros trasero (moto)',
        estribosMoto: 'Estribos (moto)',
        cabrestanteMoto: 'Cabrestante (quads)',
        cambioPlacaDeMatriculaMoto: 'Cambio placa matrícula (moto)',
        retrovisoresMoto: 'Retrovisores (moto)',
        carenadoMoto: 'Carenado (moto)',
        depositoDeCombustibleMoto: 'Depósito de combustible (moto)',
        velocimetroMoto: 'Velocímetro (moto)',
        manillarMoto: 'Manillar (moto)',
        sillinMoto: 'Sillín (moto)',
        mandosAdelantadosMoto: 'Mandos adelantados (moto)',
        asiderosParaPasajeroMoto: 'Asideros pasajero (moto)',
      },
      Luces: {
        faroDelantero: 'Faro delantero',
        PilotoTrasero: 'Piloto trasero',
        intermitentesLaterales: 'Intermitentes laterales',
        focosDeTrabajo: 'Focos de trabajo',
        faroDelanteroMoto: 'Faro delantero (moto)',
        PilotoTraseroMoto: 'Piloto trasero (moto)',
        luzDeMatriculaMoto: 'Luz de matrícula (moto)',
        catadriopticoTraseroMoto: 'Catadióptrico (moto)',
        intermitentesMoto: 'Intermitentes (moto)',
      },
      Dirección: {
        volanteYPiña: 'Volante y piña',
        barraDeDireccion: 'Barra de dirección',
        amortiguadorDeDireccion: 'Amortiguador de dirección',
        sustitucionDeEjes: 'Sustitución de ejes',
      },
      Freno: {
        tamborPorDisco: 'Tambor por disco',
        discosPerforadosRayados: 'Discos perforados/rayados',
        latiguillos: 'Latiguillos',
        bomba: 'Bomba',
        tamborPorDiscoMoto: 'Tambor por disco (moto)',
        discosPerforadosRayadosMoto: 'Discos perforados/rayados (moto)',
        latiguillosMoto: 'Latiguillos (moto)',
        bombaMoto: 'Bomba (moto)',
      },
      'Unidad motriz': {
        cambioDeMotor: 'Cambio de motor',
        CambioCajaCambios: 'Cambio caja de cambios',
        cambioEscape: 'Cambio de escape',
        ampliacionNDepositosCombustible: 'Ampliación depósitos combustible',
        cambioDeMotorMoto: 'Cambio de motor (moto)',
        CambioCajaCambiosMoto: 'Caja de cambios (moto)',
        cambioEscapeMoto: 'Cambio de escape (moto)',
        ampliacionNDepositosCombustibleMoto: 'Ampliación depósitos (moto)',
      },
      'Chasis y Subchasis': {
        recorteSubchasisMoto: 'Recorte de subchasis (moto)',
        modificacionDeChasisMoto: 'Modificación de chasis (moto)',
      },
      'Modificaciones en el interior del vehículo': {
        mobiliarioInterior: 'Mobiliario interior',
        fontaneria: 'Fontanería',
        muebleBajo: 'Mueble bajo',
        muebleAlto: 'Mueble alto',
        aseo: 'Aseo',
        cama: 'Cama',
        estanteria: 'Estantería',
        baseGiratoria: 'Bases giratorias',
        banquetaParaAumentarPlazas: 'Banqueta (plazas)',
        ventanas: 'Ventanas',
        claraboyas: 'Claraboyas',
        termo: 'Termo',
        bombaDeAgua: 'Bomba de agua',
        vasoDeExpansion: 'Vaso de expansión',
        depositoAguaLimpia: 'Depósito agua limpia',
        depositoAguaSucia: 'Depósito agua sucia',
        duchaInterior: 'Ducha interior',
        duchaExterior: 'Ducha exterior',
        tomaDeAguaExterior: 'Toma de agua exterior',
        calefaccionDiesel: 'Calefacción diésel',
      },
      'Instalación eléctrica': {
        placaSolar: 'Placa solar',
        inversor: 'Inversor',
        reguladorSolar: 'Regulador solar',
        cargadorDeBateria: 'Cargador de batería',
        bateriaAuxiliar: 'Batería auxiliar',
        iluminacionExterior: 'Iluminación exterior',
        tomaCorrienteexterior: 'Toma de corriente exterior',
        tomaCorrienteInterior: 'Toma de corriente interior',
      },
    },
  };

  get totalSlots(): number {
    // Sólo subselecciones activas
    let total = 0;
    for (const mod of this.modsSeleccionadas) {
      total += this.subopcionesActivas(mod).length;
    }
    return total;
  }

  async ngOnInit(): Promise<void> {
    if (this.datosEntrada?.step) this.step = this.datosEntrada.step;

    // Restaurar previas
    if (Array.isArray(this.datosEntrada?.prevImagesB64)) {
      this.prevImagesB64 = [...this.datosEntrada.prevImagesB64];
      this.prevPreviews = [...this.prevImagesB64];
      this.prevImages = await Promise.all(
        this.prevImagesB64.map((b64) => this.dataUrlToBlob(b64))
      );
    }

    // Restaurar post
    if (Array.isArray(this.datosEntrada?.postImagesB64)) {
      this.postImagesB64 = [...this.datosEntrada.postImagesB64];
      this.postPreviews = [...this.postImagesB64];
      this.postImages = await Promise.all(
        this.postImagesB64.map((b64) => this.dataUrlToBlob(b64))
      );
    }

    // Mods seleccionadas
    const allMods = Array.isArray(this.datosEntrada?.modificaciones)
      ? this.datosEntrada.modificaciones
      : [];
    this.modsSeleccionadas = allMods.filter((m: any) => m?.seleccionado);

    // Subopciones activas desde el detalle
    this.initSelectedSuboptsFromDetalle();

    // Hidratar estructura por-slot (solo subopciones)
    await this.hydratePerSlotsFromFlat();

    // Docs
    if (this.datosEntrada?.docsImagesB64) {
      this.docsImagesB64 = { ...this.datosEntrada.docsImagesB64 };
      for (const [tipo, arrB64] of Object.entries(this.docsImagesB64)) {
        this.docsPreviews[tipo] = [...(arrB64 || [])];
        this.docsBlobs[tipo] = await Promise.all(
          (arrB64 as string[]).map((b64) => this.dataUrlToBlob(b64))
        );
      }
    }

    this.emitAutosave();
  }

  // ---- Helpers Blob <-> DataURL ----
  public blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }

  public async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  public snapshot() {
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

  public emitAutosave() {
    this.autosave.emit(this.snapshot());
  }

  // ---- Normalizar orientación ----
  public normalizeOrientation(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      loadImage(
        file,
        (canvasElement) => {
          if (!(canvasElement instanceof HTMLCanvasElement))
            return reject('No se pudo procesar la imagen');
          canvasElement.toBlob(
            (blob) =>
              blob ? resolve(blob) : reject('Error creando Blob desde canvas'),
            file.type
          );
        },
        { canvas: true, orientation: true }
      );
    });
  }

  // ---- Inputs genéricos (pasos 1 y 3) ----
  openInput(type: 'gallery' | 'camera', step: number, i: number) {
    let input: ElementRef<HTMLInputElement> | undefined;

    if (step === 1) {
      input =
        type === 'gallery'
          ? this.galleryInputs.get(i)
          : this.cameraInputs.get(i);
    } else if (step === 3) {
      input =
        type === 'gallery'
          ? this.galleryInputsDocs.get(i)
          : this.cameraInputsDocs.get(i);
    }

    input?.nativeElement.click();
  }

  // ---- Paso 1 ----
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

  // ---- Paso 2: subopciones/slots ----
  public slotKey(mod: any, subKey: string): SlotKey {
    return `${mod.nombre}::${subKey}`;
  }

  tituloMod(modNombre: string): string {
    return this.titulos.mod?.[modNombre] ?? modNombre;
  }
  tituloSub(modNombre: string, subKey: string): string {
    return this.titulos.sub?.[modNombre]?.[subKey] ?? this.pretty(subKey);
  }

  public pretty(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (s) => s.toUpperCase());
  }

  subopcionesPosibles(mod: any): { key: string; label: string }[] {
    const keys: string[] = [];

    if (mod?.detalle && typeof mod.detalle === 'object') {
      for (const k of Object.keys(mod.detalle)) keys.push(k);
    }
    for (const sub of ['mobiliarioInterior', 'fontaneria', 'focosTrabajo']) {
      if (mod?.[sub] && typeof mod[sub] === 'object') {
        for (const k of Object.keys(mod[sub])) keys.push(k);
      }
    }

    const set = new Set(keys.filter((k) => k));
    return Array.from(set).map((k) => ({
      key: k,
      label: this.tituloSub(mod.nombre, k),
    }));
  }

  public initSelectedSuboptsFromDetalle() {
    this.selectedSubopts = {};
    for (const mod of this.modsSeleccionadas) {
      const set = new Set<string>();

      if (mod?.detalle && typeof mod.detalle === 'object') {
        for (const [k, v] of Object.entries(mod.detalle)) if (v) set.add(k);
      }
      for (const sub of ['mobiliarioInterior', 'fontaneria', 'focosTrabajo']) {
        if (mod?.[sub] && typeof mod[sub] === 'object') {
          for (const [k, v] of Object.entries(mod[sub]))
            if (v) set.add(k as string);
        }
      }

      this.selectedSubopts[mod.nombre] = set;
    }
  }

  subopcionesActivas(mod: any): string[] {
    return Array.from(this.selectedSubopts[mod.nombre] || []);
  }
  isSubopcionActiva(mod: any, subKey: string): boolean {
    return this.selectedSubopts[mod.nombre]?.has(subKey) ?? false;
  }

  toggleSubopcion(mod: any, subKey: string, checked?: boolean) {
    const set = this.selectedSubopts[mod.nombre] || new Set<string>();
    const willBeActive = checked ?? !set.has(subKey);

    if (willBeActive) {
      set.add(subKey);
    } else {
      set.delete(subKey);
      const sk = this.slotKey(mod, subKey);
      delete this.perSlotPreviews[sk];
      delete this.perSlotBlobs[sk];
      this.recomputeFlatFromSlots();
      this.emitAutosave();
    }
    this.selectedSubopts[mod.nombre] = set;
  }

  openInputForSlot(type: 'gallery' | 'camera', mod: any, subKey: string) {
    const input =
      type === 'gallery'
        ? this.galleryInputsMods.get(0)
        : this.cameraInputsMods.get(0);
    input?.nativeElement.setAttribute('data-mod', mod.nombre);
    input?.nativeElement.setAttribute('data-sub', subKey);
    input?.nativeElement.click();
  }

  async onSelectedForSlot(ev: Event, mod: any, subKey: string) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const blob = await this.normalizeOrientation(file);
    const preview = await this.blobToDataUrl(blob);

    const key = this.slotKey(mod, subKey);
    this.perSlotPreviews[key] = [preview];
    this.perSlotBlobs[key] = [blob];

    // Asegura que la subopción está marcada
    this.toggleSubopcion(mod, subKey, true);

    this.recomputeFlatFromSlots();
    this.emitAutosave();

    input.value = '';
  }

  removeSlotImage(mod: any, subKey: string, index: number) {
    const key = this.slotKey(mod, subKey);
    const arrPrev = this.perSlotPreviews[key] || [];
    const arrBlob = this.perSlotBlobs[key] || [];
    if (index < 0 || index >= arrPrev.length) return;

    arrPrev.splice(index, 1);
    arrBlob.splice(index, 1);

    if (arrPrev.length === 0) {
      delete this.perSlotPreviews[key];
      delete this.perSlotBlobs[key];
    } else {
      this.perSlotPreviews[key] = arrPrev;
      this.perSlotBlobs[key] = arrBlob;
    }

    this.recomputeFlatFromSlots();
    this.emitAutosave();
  }

  public async hydratePerSlotsFromFlat(): Promise<void> {
    this.perSlotPreviews = {};
    this.perSlotBlobs = {};
    if (!this.postImagesB64?.length) return;

    const images = [...this.postImagesB64];
    let idx = 0;

    for (const mod of this.modsSeleccionadas) {
      for (const so of this.subopcionesActivas(mod)) {
        if (idx < images.length) {
          const b64 = images[idx++];
          const k = this.slotKey(mod, so);
          this.perSlotPreviews[k] = [b64];
          this.perSlotBlobs[k] = [await this.dataUrlToBlob(b64)];
        }
      }
    }

    this.recomputeFlatFromSlots();
  }

  public recomputeFlatFromSlots() {
    const newB64: string[] = [];
    const newPrev: string[] = [];
    const newBlobs: Blob[] = [];

    for (const mod of this.modsSeleccionadas) {
      for (const so of this.subopcionesActivas(mod)) {
        const k = this.slotKey(mod, so);
        if (this.perSlotPreviews[k]?.length) {
          newB64.push(this.perSlotPreviews[k][0]);
          newPrev.push(this.perSlotPreviews[k][0]);
          newBlobs.push(this.perSlotBlobs[k][0]);
        }
      }
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

  // ---- Docs (paso 3) ----
  async onDocSelected(
    ev: Event,
    tipo: string,
    source: 'camera' | 'gallery' = 'camera'
  ) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const currentCount = this.docsPreviews[tipo]?.length || 0;
    const files = Array.from(input.files);

    if (currentCount >= 4) {
      this.docError[tipo] = 'Solo puedes subir un máximo de 4 imágenes.';
      input.value = '';
      return;
    }

    if (source === 'gallery' && currentCount + files.length > 4) {
      this.docError[tipo] = 'No puedes seleccionar más de 4 imágenes.';
      input.value = '';
      return;
    }

    const allowed = files.slice(0, 4 - currentCount);
    const blobs = await Promise.all(
      allowed.map((f) => this.normalizeOrientation(f))
    );
    const previews = await Promise.all(blobs.map((b) => this.blobToDataUrl(b)));

    this.docsBlobs[tipo] = [...(this.docsBlobs[tipo] || []), ...blobs];
    this.docsPreviews[tipo] = [...(this.docsPreviews[tipo] || []), ...previews];
    this.docsImagesB64[tipo] = [
      ...(this.docsImagesB64[tipo] || []),
      ...previews,
    ];

    this.docError[tipo] = '';
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

  // ---- Navegación ----
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
      this.volver.emit(this.snapshot());
    }
  }

  onSave() {
    this.emitAutosave();
    this.continuar.emit(this.snapshot());
  }

  // ---- Imagen ejemplo por mod ----
  getImagenEjemplo(modNombre: string): string {
    const mapa: { [k: string]: string } = {
      // 'Ruedas': 'assets/ejemplos/ruedas.png',
    };
    return mapa[modNombre] || 'assets/cochee.png';
  }

  // ---- Modal: quitar reforma / quitar subselección ----
  openConfirmRemove(mod: any) {
    this.modParaQuitar = mod;
    this.modalAction = 'mod';
    this.subParaQuitarKey = null;

    const el = document.getElementById('modalQuitarReforma');
    if (el) {
      this.modalInstance = new Modal(el);
      this.modalInstance.show();
    }
  }

  openConfirmRemoveSub(mod: any, subKey: string) {
    this.modParaQuitar = mod;
    this.modalAction = 'sub';
    this.subParaQuitarKey = subKey;

    const el = document.getElementById('modalQuitarReforma');
    if (el) {
      this.modalInstance = new Modal(el);
      this.modalInstance.show();
    }
  }

  confirmRemove() {
    if (!this.modParaQuitar) return;

    if (this.modalAction === 'mod') {
      const nombre = this.modParaQuitar.nombre;

      // Limpia imágenes de todas las subopciones y desmarca
      const posibles = this.subopcionesPosibles(this.modParaQuitar).map(
        (s) => s.key
      );
      for (const key of posibles) {
        const k = this.slotKey(this.modParaQuitar, key);
        delete this.perSlotPreviews[k];
        delete this.perSlotBlobs[k];
      }

      this.selectedSubopts[nombre] = new Set<string>();
      this.modParaQuitar.seleccionado = false;
      this.modsSeleccionadas = this.modsSeleccionadas.filter(
        (m) => m.nombre !== nombre
      );
    } else {
      if (!this.subParaQuitarKey) return;
      const k = this.slotKey(this.modParaQuitar, this.subParaQuitarKey);
      delete this.perSlotPreviews[k];
      delete this.perSlotBlobs[k];

      const set =
        this.selectedSubopts[this.modParaQuitar.nombre] || new Set<string>();
      set.delete(this.subParaQuitarKey);
      this.selectedSubopts[this.modParaQuitar.nombre] = set;
    }

    this.recomputeFlatFromSlots();
    this.emitAutosave();

    // Reset estado modal
    this.modParaQuitar = null;
    this.subParaQuitarKey = null;
    this.modalAction = 'mod';
  }
}
