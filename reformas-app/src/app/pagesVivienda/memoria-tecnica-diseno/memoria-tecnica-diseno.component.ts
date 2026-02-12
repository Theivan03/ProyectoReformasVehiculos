import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http'; // 🔥 IMPORTANTE
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import {
  LucideAngularModule,
  FileText,
  User,
  MapPin,
  Zap,
  CheckSquare,
  Download,
  ChevronLeft,
  ChevronRight,
  Save,
  Home,
  Building,
  Box,
  Image as ImageIcon,
  CloudUpload,
  ArrowLeft, // Icono para guardar
} from 'lucide-angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-memoria-tecnica-diseno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    HttpClientModule,
    RouterModule,
  ],
  templateUrl: './memoria-tecnica-diseno.component.html',
  styles: [],
})
export class MemoriaTecnicaDisenoComponent {
  pasoActual = 1;
  totalPasos = 4;
  isGenerating = false;
  isSaving = false;
  isLoadingData = false;

  icons = {
    FileText,
    User,
    MapPin,
    Zap,
    CheckSquare,
    Download,
    ChevronLeft,
    ChevronRight,
    Save,
    Home,
    Building,
    Box,
    ImageIcon,
    CloudUpload,
    ArrowLeft,
  };

  datos = {
    id: null,
    // NUEVO: Control de dirección
    mismaDireccion: false, // Por defecto false (pide las dos)

    titular: {
      nombre: '',
      nif: '',
      domicilio: '',
      cp: '',
      poblacion: '',
      provincia: '',
      telefono: '618622012',
      correo: 'hablamos@projectes.es',
    },
    emplazamiento: {
      direccion: '',
      poblacion: '',
      provincia: '',
      cp: '',
      refCatastral: '',
      uso: '',
      superficie: '',
      planoImagen: null as string | null,
    },
    caracteristicas: {
      potenciaInstalada: '',
    },
    fechaFirma: { dia: '', mes: '', anyo: '', lugar: '' },
  };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatosDelServidor(id);
    }
  }

  cargarDatosDelServidor(id: string) {
    this.isLoadingData = true;
    this.http.get(`http://localhost:3000/api/memorias/${id}`).subscribe({
      next: (data: any) => {
        // Mezclamos los datos recibidos con la estructura base para no perder campos
        this.datos = { ...this.datos, ...data };
        this.isLoadingData = false;
      },
      error: (err) => {
        console.error('Error cargando memoria:', err);
        alert('No se pudo cargar la memoria solicitada.');
        this.router.navigate(['/memorias']);
      },
    });
  }

  // 🔥 LÓGICA DE NAVEGACIÓN MODIFICADA
  avanzarPaso() {
    // Si estamos en Paso 1 y es la misma dirección, saltamos el Paso 2 (Emplazamiento)
    if (this.pasoActual === 1 && this.datos.mismaDireccion) {
      this.pasoActual = 3;
    } else if (this.pasoActual < this.totalPasos) {
      this.pasoActual++;
    }
  }

  retrocederPaso() {
    // Si estamos en Paso 3 y es la misma dirección, volvemos al Paso 1
    if (this.pasoActual === 3 && this.datos.mismaDireccion) {
      this.pasoActual = 1;
    } else if (this.pasoActual > 1) {
      this.pasoActual--;
    }
  }

  volver() {
    this.router.navigate(['/memorias']);
  }

  private extraerSoloCalle(direccionCompleta: string): string {
    if (!direccionCompleta) return '';
    const trimmed = direccionCompleta.trim();
    const commaSplit = trimmed.split(',');
    if (commaSplit.length > 1) return commaSplit[0].trim();
    const match = trimmed.match(
      /^(.*?)\s+(?:\d+|s\/n|n(?:\u00BA|\u00B0|o)?\s*\d+)\b/i,
    );
    return match && match[1] ? match[1].trim() : trimmed;
  }

  private extraerNumeroEdificio(direccionCompleta: string): string {
    if (!direccionCompleta) return '';
    const upper = direccionCompleta.toUpperCase();

    if (/\bS\s*\/\s*N\b/.test(upper)) return 'S/N';

    const parts = direccionCompleta
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const numMatch = parts[1].match(/\d+/);
      if (numMatch) return numMatch[0];
    }

    const marcado = upper.match(/\bN[\u00BA\u00B0O]?\s*\.?\s*(\d+)\b/);
    if (marcado && marcado[1]) return marcado[1];

    let base = upper.split(',')[0];
    base = base.split(
      /\b(PISO|PTA|PUERTA|PLANTA|ESC|ESCALERA|BLOQUE|BAJO)\b/i,
    )[0];

    const ordinalIndex = base.search(/\d+\s*[\u00BA\u00AA]/);
    if (ordinalIndex !== -1) {
      base = base.slice(0, ordinalIndex);
    }

    const nums = base.match(/\d+/g);
    if (!nums || nums.length === 0) return '';
    return nums[nums.length - 1];
  }

  guardarEnServidor() {
    this.isSaving = true;

    // URL de tu servidor (ajusta el puerto si es diferente)
    const url = 'http://localhost:3000/api/memorias';

    this.http.post(url, this.datos).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.id) {
          this.datos.id = response.id; // Guardamos el ID por si le da a guardar otra vez (para editar)
          alert('✅ Datos guardados correctamente en el servidor.');
        }
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al guardar:', error);
        alert(
          '❌ Error al conectar con el servidor. Revisa que esté encendido.',
        );
      },
    });
  }

  async generarPDF() {
    this.isGenerating = true;
    try {
      // 1. CARGA DE RECURSOS
      const urlPdf = '/assets/MEMORIA TECNICA DE DISEÑO.pdf';
      const urlEsquemaF = '/assets/PLANTILLA PER A VIVIENDES.png';
      const urlCuadroH = '/assets/cuadro.jpg';
      const urlPlanoI = '/assets/plano emplazamiento.png'; // 🔥 IMAGEN SECCIÓN I

      const [existingPdfBytes, esquemaFBytes, cuadroHBytes, planoIBytes] =
        await Promise.all([
          fetch(urlPdf).then((res) => res.arrayBuffer()),
          fetch(urlEsquemaF).then((res) => res.arrayBuffer()),
          fetch(urlCuadroH).then((res) => res.arrayBuffer()),
          fetch(urlPlanoI).then((res) => res.arrayBuffer()),
        ]);

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Fuente Estándar (Estilo técnico/máquina)
      const fontHand = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);

      // Incrustar imágenes
      const esquemaImageF = await pdfDoc.embedPng(esquemaFBytes);
      const cuadroImageH = await pdfDoc.embedJpg(cuadroHBytes);
      const planoImageI = await pdfDoc.embedPng(planoIBytes);

      const colorBoli = rgb(0, 0, 0.7);

      // Helpers Campos
      const setField = (name: string, value: string) => {
        try {
          const f = form.getTextField(name);
          if (f) f.setText(value?.toString().toUpperCase() || '');
        } catch (e) {}
      };
      const setCheck = (name: string, c: boolean) => {
        try {
          const f = form.getCheckBox(name);
          if (f) c ? f.check() : f.uncheck();
        } catch (e) {}
      };

      // --- RELLENADO DE DATOS ---
      if (this.datos.mismaDireccion) {
        this.datos.emplazamiento.direccion = this.datos.titular.domicilio;
        this.datos.emplazamiento.poblacion = this.datos.titular.poblacion;
        this.datos.emplazamiento.provincia = this.datos.titular.provincia;
        this.datos.emplazamiento.cp = this.datos.titular.cp;
      }

      // ... (Resto de asignaciones de campos A, B, C igual que antes) ...
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_NOM[0]',
        this.datos.titular.nombre,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_DNI[0]',
        this.datos.titular.nif,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_DOM[0]',
        this.datos.titular.domicilio,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_CP[0]',
        this.datos.titular.cp,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_LOC[0]',
        this.datos.titular.poblacion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_PRO[0]',
        this.datos.titular.provincia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_TEL[0]',
        this.datos.titular.telefono,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_CORREO[0]',
        this.datos.titular.correo,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_EMPL[0]',
        this.datos.emplazamiento.direccion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_LOC[0]',
        this.datos.emplazamiento.poblacion,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_PROV[0]',
        this.datos.emplazamiento.provincia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_CP[0]',
        this.datos.emplazamiento.cp,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_REFCAD[0]',
        this.datos.emplazamiento.refCatastral,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Uso[0]',
        this.datos.emplazamiento.uso,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Superficie[0]',
        this.datos.emplazamiento.superficie,
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_P_Instalada[0]',
        this.datos.caracteristicas.potenciaInstalada,
      );

      const nombreCalleSolo = this.extraerSoloCalle(
        this.datos.emplazamiento.direccion,
      );

      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_DIA[0]',
        this.datos.fechaFirma.dia,
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Superficie[0]',
        this.datos.emplazamiento.superficie,
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_MES[0]',
        this.datos.fechaFirma.mes,
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_ANY[0]',
        this.datos.fechaFirma.anyo,
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_LLOC[0]',
        this.datos.fechaFirma.lugar,
      );

      const pages = pdfDoc.getPages();
      const page5 = pages[4];
      const { width, height } = page5.getSize();

      // 1. ESQUEMA UNIFILAR (Sección F)
      const esquemaDims = esquemaImageF.scaleToFit(520, 150);
      page5.drawImage(esquemaImageF, {
        x: width / 2 - esquemaDims.width / 2,
        y: height - 310,
        width: esquemaDims.width,
        height: esquemaDims.height,
      });

      // 2. CROQUIS TRAZADO (Sección H - Imagen JPG)
      const cuadroDims = cuadroImageH.scaleToFit(480, 110);
      page5.drawImage(cuadroImageH, {
        x: width / 2 - cuadroDims.width / 2,
        y: 260,
        width: cuadroDims.width,
        height: cuadroDims.height,
      });

      // 3. PLANO EMPLAZAMIENTO (Sección I - Imagen PNG + Texto Superpuesto)
      const planoDims = planoImageI.scaleToFit(350, 150);
      const iX = width / 2 - planoDims.width / 2;
      const iY = 75;

      // Dibujamos la imagen de fondo
      page5.drawImage(planoImageI, {
        x: iX,
        y: iY,
        width: planoDims.width,
        height: planoDims.height,
      });

      // N?mero de la casa (edificio)
      let numeroCasa =
        this.extraerNumeroEdificio(this.datos.emplazamiento.direccion) || '7';

      page5.drawText(numeroCasa, {
        x: iX + planoDims.width / 2 - 25,
        y: iY + planoDims.height / 2,
        size: 14,
        font: fontHand,
        color: colorBoli,
      });

      // Nombre de la calle
      const textCalle = `${nombreCalleSolo.toUpperCase()}`;
      const textWidth = fontHand.widthOfTextAtSize(textCalle, 18);

      page5.drawText(textCalle, {
        x: width / 2 - textWidth / 2,
        y: iY + 50,
        size: 18,
        font: fontHand,
        color: colorBoli,
        rotate: degrees(1.5),
      });

      form.flatten();
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      saveAs(blob, `MTD_${this.datos.titular.nombre || 'Documento'}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Revisa la consola.');
    } finally {
      this.isGenerating = false;
    }
  }
}
