import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
} from 'lucide-angular';

@Component({
  selector: 'app-memoria-tecnica-diseno',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './memoria-tecnica-diseno.component.html',
  styles: [
    `
      :host {
        display: block;
        background-color: #f1f5f9;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          'Helvetica Neue', Arial, sans-serif;
      }
      .main-container {
        padding: 2rem 1rem;
      }
      .app-card {
        border: none;
        border-radius: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        background-color: white;
        max-width: 1000px;
        margin: 0 auto;
      }
      .app-header {
        background-color: #0f172a;
        padding: 1.5rem 2rem;
        color: white;
      }
      .step-badge {
        background-color: #1e293b;
        color: #e2e8f0;
        font-family: monospace;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
      }
      .progress-container {
        height: 6px;
        background-color: #e2e8f0;
        width: 100%;
      }
      .progress-bar-custom {
        height: 100%;
        background-color: #2563eb;
        transition: width 0.3s ease;
      }
      .content-area {
        padding: 2rem;
        min-height: 400px;
      }
      .footer-area {
        padding: 1.5rem 2rem;
        background-color: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      .section-title {
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 0.5rem;
      }
      .section-subtitle {
        color: #64748b;
        margin-bottom: 1.5rem;
      }
      .form-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #64748b;
      }
      .form-control,
      .form-select {
        padding: 0.625rem;
        border-radius: 0.375rem;
        border-color: #cbd5e1;
      }
      .form-control:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.15);
      }
      .btn-next {
        background-color: #2563eb;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        border-radius: 0.5rem;
      }
      .btn-prev {
        background-color: white;
        border: 1px solid #cbd5e1;
        color: #475569;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        border-radius: 0.5rem;
      }
      .animation-slide-in-down {
        animation: slideInDown 0.4s ease-out forwards;
      }
      .type-selector {
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid #e2e8f0;
      }
      .type-selector:hover {
        border-color: #94a3b8;
      }
      .type-selector.active {
        border-color: #2563eb;
        background-color: #eff6ff;
        color: #1e40af;
      }
      @keyframes slideInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class MemoriaTecnicaDisenoComponent {
  pasoActual = 1;
  totalPasos = 4;
  isGenerating = false;

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
  };

  datos = {
    // NUEVO: Control de dirección
    mismaDireccion: false, // Por defecto false (pide las dos)
    tipoVivienda: 'piso', // 'piso' | 'chalet'

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
      tension: '',
      potenciaInstalada: '',
      potenciaInversor: '',
      numModulos: '',
      derivacionIndividual: {
        type: '',
        seccion: '',
        longitud: '',
        caidaTension: '',
      },
      protecciones: { interruptorGeneral: '', diferencial: '' },
      cgp: { esquema: '', intensidad: '', fusibles: '' },
      contadores: {
        numCentralizaciones: '',
        totalContadores: '',
        intensidadNominal: '',
      },
    },
    fechaFirma: { dia: '', mes: '', anyo: '', lugar: '' },
  };

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

  private extraerSoloCalle(direccionCompleta: string): string {
    if (!direccionCompleta) return '';
    const match = direccionCompleta.match(/^(.*?)\s+(\d+|s\/n|nº\d+)/i);
    return match && match[1] ? match[1].trim() : direccionCompleta;
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
        this.datos.titular.nombre
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_DNI[0]',
        this.datos.titular.nif
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_DOM[0]',
        this.datos.titular.domicilio
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_CP[0]',
        this.datos.titular.cp
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_LOC[0]',
        this.datos.titular.poblacion
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_PRO[0]',
        this.datos.titular.provincia
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_TEL[0]',
        this.datos.titular.telefono
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.a[0].A_TIT_CORREO[0]',
        this.datos.titular.correo
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_EMPL[0]',
        this.datos.emplazamiento.direccion
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_LOC[0]',
        this.datos.emplazamiento.poblacion
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_PROV[0]',
        this.datos.emplazamiento.provincia
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_CP[0]',
        this.datos.emplazamiento.cp
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_REFCAD[0]',
        this.datos.emplazamiento.refCatastral
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Uso[0]',
        this.datos.emplazamiento.uso
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_Superficie[0]',
        this.datos.emplazamiento.superficie
      );

      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_P_Instalada[0]',
        this.datos.caracteristicas.potenciaInstalada
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_P_Inversor[0]',
        this.datos.caracteristicas.potenciaInversor
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.b[0].B_N_Modulos[0]',
        this.datos.caracteristicas.numModulos
      );

      const nombreCalleSolo = this.extraerSoloCalle(
        this.datos.emplazamiento.direccion
      );
      setField('form1[0].Pagina1[0].seccion\\.c[0].C_EMPL[0]', nombreCalleSolo);

      setCheck('form1[0].Pagina1[0].seccion\\.c[0].C1_CV2[0]', true);
      setCheck('form1[0].Pagina1[0].seccion\\.c[0].C1_CV4[0]', true);
      setCheck('form1[0].Pagina1[0].seccion\\.c[0].C1_CV1[0]', false);
      setCheck('form1[0].Pagina1[0].seccion\\.c[0].C1_CV3[0]', false);
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_ENT[0]',
        `ESQUEMA ${this.datos.caracteristicas.cgp.esquema}`
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_INOM[0]',
        this.datos.caracteristicas.cgp.intensidad
      );
      setField(
        'form1[0].Pagina1[0].seccion\\.c[0].C_INFUS[0]',
        this.datos.caracteristicas.cgp.fusibles
      );

      if (this.datos.tipoVivienda === 'chalet') {
        setCheck('form1[0].Pagina1[0].seccion\\.c[0].C3_CV1[0]', true);
        setCheck('form1[0].Pagina1[0].seccion\\.c[0].C3_CV2[0]', true);
        setField('form1[0].Pagina1[0].seccion\\.c[0].C_NCC[0]', '');
        setField('form1[0].Pagina1[0].seccion\\.c[0].C_NTC[0]', '');
        setField('form1[0].Pagina1[0].seccion\\.c[0].C_INNOM[0]', '');
      } else {
        setCheck('form1[0].Pagina1[0].seccion\\.c[0].C3_CV3[0]', true);
        setCheck('form1[0].Pagina1[0].seccion\\.c[0].C3_CV5[0]', true);
        setCheck('form1[0].Pagina1[0].seccion\\.c[0].C3_CV6[0]', true);
        setField(
          'form1[0].Pagina1[0].seccion\\.c[0].C_NCC[0]',
          this.datos.caracteristicas.contadores.numCentralizaciones
        );
        setField(
          'form1[0].Pagina1[0].seccion\\.c[0].C_NTC[0]',
          this.datos.caracteristicas.contadores.totalContadores
        );
        setField(
          'form1[0].Pagina1[0].seccion\\.c[0].C_INNOM[0]',
          this.datos.caracteristicas.contadores.intensidadNominal
        );
      }

      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_DIA[0]',
        this.datos.fechaFirma.dia
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_MES[0]',
        this.datos.fechaFirma.mes
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_ANY[0]',
        this.datos.fechaFirma.anyo
      );
      setField(
        'form1[0].Pagina6[0].seccion\\.K[0].FI_LLOC[0]',
        this.datos.fechaFirma.lugar
      );

      // ===========================================================================
      // 🔥 PÁGINA 5: DIBUJOS
      // ===========================================================================

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
      const iY = 75; // Posición base de la imagen (más alta para que no choque con el pie)

      // Dibujamos la imagen de fondo
      page5.drawImage(planoImageI, {
        x: iX,
        y: iY,
        width: planoDims.width,
        height: planoDims.height,
      });

      // --- TEXTOS SOBRE LA IMAGEN ---

      // Número de la casa
      let numeroCasa = '7';
      const matchNum = this.datos.emplazamiento.direccion.match(/\d+$/);
      if (matchNum) numeroCasa = matchNum[0];

      page5.drawText(numeroCasa, {
        x: iX + planoDims.width / 2 - 25, // 🔥 Más a la izquierda (-35)
        y: iY + planoDims.height / 2, // 🔥 Más abajo (-10 desde el centro)
        size: 14,
        font: fontHand,
        color: colorBoli,
      });

      // Nombre de la calle
      const textCalle = `C/ ${nombreCalleSolo.toUpperCase()}`;
      const textWidth = fontHand.widthOfTextAtSize(textCalle, 18);

      page5.drawText(textCalle, {
        x: width / 2 - textWidth / 2,
        y: iY + 50, // 🔥 Más arriba (+50, pegado a la línea de la imagen)
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
