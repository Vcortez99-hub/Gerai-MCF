/**
 * CanvaPPTXService - Geração de apresentações PPTX estilo Canva
 */

const pptxgen = require('pptxgenjs');
const OpenAIService = require('./OpenAIService');
const ExcelProcessor = require('./ExcelProcessor');

class CanvaPPTXService {
  constructor() {
    this.openai = new OpenAIService();
  }

  /**
   * Gera apresentação PPTX estilo Canva
   */
  async generateCanvaPPTX(briefing, config) {
    const slideCount = parseInt(config.slideCount) || 6;
    const company = config.company || 'Empresa';
    const audience = config.audience || 'Executivos';

    // Processar anexos
    let excelDataSection = '';
    if (config.attachments && config.attachments.length > 0) {
      const processedData = await ExcelProcessor.processAttachments(config.attachments);
      if (processedData.hasData) {
        excelDataSection = '\n\n' + processedData.summary;
      }
    }

    // Gerar conteúdo estruturado com OpenAI
    const content = await this.generateSlideContent(briefing, slideCount, company, audience, excelDataSection);

    // Criar PPTX
    const pptx = new pptxgen();

    // Configurações estilo Canva
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Darede';
    pptx.company = company;
    pptx.title = content.title || 'Apresentação';

    // Cores Darede (estilo Canva)
    const colors = {
      primary: '1E5C3F',
      accent: 'FF9500',
      white: 'FFFFFF',
      dark: '1A1A1A',
      lightGray: 'F5F5F5'
    };

    // Slide 1: CAPA profissional com camadas
    const slide1 = pptx.addSlide();
    slide1.background = { color: colors.primary };
    slide1.transition = { type: 'fade', duration: 0.8 };

    // Background orgânico com círculos gigantes
    slide1.addShape(pptx.ShapeType.ellipse, {
      x: -2, y: -1, w: 5, h: 5,
      fill: { color: colors.accent, transparency: 90 },
      line: { type: 'none' }
    });

    slide1.addShape(pptx.ShapeType.ellipse, {
      x: 7, y: 3, w: 4, h: 4,
      fill: { color: colors.accent, transparency: 85 },
      line: { type: 'none' }
    });

    // Formas geométricas decorativas
    slide1.addShape(pptx.ShapeType.roundRect, {
      x: 8.5, y: 0.5, w: 1.5, h: 1.5,
      fill: { color: colors.white, transparency: 95 },
      line: { type: 'none' },
      rotate: 15
    });

    // Card central com sombra
    slide1.addShape(pptx.ShapeType.roundRect, {
      x: 1.3, y: 1.8, w: 7.5, h: 2.8,
      fill: { color: colors.white, transparency: 10 },
      line: { type: 'none' },
      shadow: { type: 'outer', blur: 20, opacity: 0.3, angle: 90, offset: 6 }
    });

    // Logo com background
    slide1.addShape(pptx.ShapeType.roundRect, {
      x: 3.8, y: 0.8, w: 2.4, h: 1,
      fill: { color: colors.white, transparency: 15 },
      line: { type: 'none' }
    });

    try {
      slide1.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 4, y: 1, w: 2, h: 0.8
      });
    } catch (e) {
      slide1.addText('DAREDE', {
        x: 4, y: 1.05, w: 2, h: 0.7,
        fontSize: 32, bold: true, color: colors.white,
        align: 'center', fontFace: 'Segoe UI', valign: 'middle'
      });
    }

    // Título IMPACTANTE
    slide1.addText((content.title || 'APRESENTAÇÃO').toUpperCase(), {
      x: 1, y: 2.3, w: 8, h: 1.2,
      fontSize: 48, bold: true, color: colors.white,
      align: 'center', fontFace: 'Segoe UI',
      charSpacing: 2,
      shadow: { type: 'outer', blur: 10, opacity: 0.4, angle: 45, offset: 4 }
    });

    // Linha decorativa
    slide1.addShape(pptx.ShapeType.rect, {
      x: 3.5, y: 3.5, w: 3, h: 0.08,
      fill: { color: colors.accent },
      line: { type: 'none' }
    });

    // Subtítulo com background
    slide1.addShape(pptx.ShapeType.roundRect, {
      x: 2.5, y: 3.8, w: 5, h: 0.6,
      fill: { color: colors.accent, transparency: 20 },
      line: { type: 'none' }
    });

    slide1.addText(content.subtitle || company, {
      x: 2.5, y: 3.85, w: 5, h: 0.5,
      fontSize: 22, bold: true, color: colors.white,
      align: 'center', fontFace: 'Segoe UI', valign: 'middle'
    });

    // Slides de conteúdo (2-N) com layouts variados
    for (let i = 0; i < content.slides.length; i++) {
      const slideData = content.slides[i];
      const layout = slideData.layout || 'default';

      if (layout === 'bigNumber') {
        this.createBigNumberSlide(pptx, slideData, colors, i);
      } else if (layout === 'comparison') {
        this.createComparisonSlide(pptx, slideData, colors, i);
      } else if (layout === 'iconGrid') {
        this.createIconGridSlide(pptx, slideData, colors, i);
      } else if (layout === 'timeline') {
        this.createTimelineSlide(pptx, slideData, colors, i);
      } else if (layout === 'quote') {
        this.createQuoteSlide(pptx, slideData, colors, i);
      } else if (layout === 'process') {
        this.createProcessSlide(pptx, slideData, colors, i);
      } else {
        this.createDefaultSlide(pptx, slideData, colors, i);
      }
    }

    // Slide de contato (último)
    const contactSlide = pptx.addSlide();
    contactSlide.background = { color: colors.white };
    contactSlide.transition = { type: 'fade', duration: 0.8 };

    contactSlide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 5, h: 5.625,
      fill: { color: colors.primary, transparency: 5 },
      line: { type: 'none' }
    });

    try {
      contactSlide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 3.5, y: 0.8, w: 3, h: 1.2
      });
    } catch (e) {
      contactSlide.addText('DAREDE', {
        x: 3, y: 1, w: 4, h: 1,
        fontSize: 48, bold: true, color: colors.primary,
        align: 'center', fontFace: 'Arial'
      });
    }

    contactSlide.addText('Vamos Conversar?', {
      x: 0.5, y: 2.2, w: 9, h: 0.8,
      fontSize: 44, bold: true, color: colors.primary,
      align: 'center', fontFace: 'Arial'
    });

    const contacts = [
      { icon: '📧', text: 'comercial@darede.com.br', y: 3.3 },
      { icon: '📞', text: '+55 11 3090-1115', y: 4 },
      { icon: '🌐', text: 'www.darede.com.br', y: 4.7 }
    ];

    contacts.forEach((contact) => {
      contactSlide.addShape(pptx.ShapeType.roundRect, {
        x: 2, y: contact.y, w: 6, h: 0.5,
        fill: { color: colors.lightGray }, line: { type: 'none' }
      });

      contactSlide.addText(contact.icon, {
        x: 2.3, y: contact.y + 0.05, w: 0.5, h: 0.4,
        fontSize: 20, align: 'center', valign: 'middle'
      });

      contactSlide.addText(contact.text, {
        x: 3, y: contact.y + 0.05, w: 4.5, h: 0.4,
        fontSize: 18, color: colors.dark,
        fontFace: 'Arial', valign: 'middle'
      });
    });

    contactSlide.addShape(pptx.ShapeType.ellipse, {
      x: 8, y: 0.5, w: 1.5, h: 1.5,
      fill: { color: colors.accent, transparency: 70 },
      line: { type: 'none' }
    });

    // Salvar arquivo
    const fileName = `pptx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pptx`;
    const filePath = `./generated/${fileName}`;

    await pptx.writeFile({ fileName: filePath });

    return {
      success: true,
      fileName: fileName,
      filePath: filePath,
      url: `/generated/${fileName}`
    };
  }

  // LAYOUT 1: Big Number - Design profissional com camadas
  createBigNumberSlide(pptx, slideData, colors, index) {
    const slide = pptx.addSlide();
    slide.background = {
      fill: colors.primary
    };
    slide.transition = { type: 'fade', duration: 0.6 };

    // CAMADA 1: Background decorativo com formas orgânicas
    slide.addShape(pptx.ShapeType.ellipse, {
      x: -1, y: 3, w: 4, h: 4,
      fill: { color: colors.accent, transparency: 85 },
      line: { type: 'none' }
    });

    slide.addShape(pptx.ShapeType.ellipse, {
      x: 7, y: -0.5, w: 3.5, h: 3.5,
      fill: { color: colors.accent, transparency: 90 },
      line: { type: 'none' }
    });

    // Retângulo arredondado decorativo
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6, y: 4, w: 4.5, h: 2,
      fill: { color: colors.white, transparency: 95 },
      line: { type: 'none' }
    });

    // CAMADA 2: Logo com fundo semi-transparente
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.2, y: 0.2, w: 1.6, h: 0.7,
      fill: { color: colors.white, transparency: 85 },
      line: { type: 'none' }
    });

    try {
      slide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 8.4, y: 0.3, w: 1.2, h: 0.5
      });
    } catch (e) {
      slide.addText('DAREDE', {
        x: 8.4, y: 0.35, w: 1.2, h: 0.5,
        fontSize: 12, bold: true, color: colors.white,
        fontFace: 'Segoe UI', align: 'center', valign: 'middle'
      });
    }

    // CAMADA 3: Card principal com sombra (simulada)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8, y: 1.3, w: 5.5, h: 3.5,
      fill: { color: colors.white, transparency: 8 },
      line: { type: 'none' }
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.7, y: 1.2, w: 5.5, h: 3.5,
      fill: { color: colors.white, transparency: 12 },
      line: { type: 'none' }
    });

    // Título com estilo bold moderno
    slide.addText(slideData.title.toUpperCase(), {
      x: 0.5, y: 0.6, w: 6, h: 0.5,
      fontSize: 18, bold: true, color: colors.accent,
      align: 'left', fontFace: 'Segoe UI', charSpacing: 2
    });

    // Linha de separação decorativa
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.15, w: 1.2, h: 0.05,
      fill: { color: colors.accent },
      line: { type: 'none' }
    });

    // Número GIGANTE com sombra
    slide.addText(slideData.bigNumber || '100+', {
      x: 1.3, y: 1.85, w: 4.5, h: 1.5,
      fontSize: 110, bold: true, color: colors.accent,
      align: 'center', fontFace: 'Segoe UI',
      shadow: { type: 'outer', blur: 8, opacity: 0.3, angle: 45, offset: 3 }
    });

    // Label com background
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.5, y: 3.5, w: 4, h: 0.6,
      fill: { color: colors.accent, transparency: 15 },
      line: { type: 'none' }
    });

    slide.addText(slideData.bigNumberLabel || 'Métrica Principal', {
      x: 1.5, y: 3.55, w: 4, h: 0.5,
      fontSize: 20, bold: true, color: colors.white,
      align: 'center', fontFace: 'Segoe UI', valign: 'middle'
    });

    // Bullets com cards individuais
    if (slideData.bullets && slideData.bullets.length > 0) {
      slideData.bullets.slice(0, 2).forEach((bullet, idx) => {
        const yPos = 4.4 + (idx * 0.6);

        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8, y: yPos, w: 5.5, h: 0.5,
          fill: { color: colors.white, transparency: 90 },
          line: { type: 'none' }
        });

        slide.addShape(pptx.ShapeType.ellipse, {
          x: 1, y: yPos + 0.1, w: 0.3, h: 0.3,
          fill: { color: colors.accent },
          line: { type: 'none' }
        });

        slide.addText(bullet, {
          x: 1.5, y: yPos + 0.05, w: 4.5, h: 0.4,
          fontSize: 14, color: colors.white,
          fontFace: 'Segoe UI', valign: 'middle'
        });
      });
    }
  }

  // LAYOUT 2: Comparison - Design assimétrico profissional
  createComparisonSlide(pptx, slideData, colors, index) {
    const slide = pptx.addSlide();
    slide.background = { color: 'F8F9FA' };
    slide.transition = { type: 'push', duration: 0.7 };

    // Background decorativo diagonal
    slide.addShape(pptx.ShapeType.rect, {
      x: -0.5, y: 0, w: 5.5, h: 5.625,
      fill: { color: colors.lightGray, transparency: 30 },
      line: { type: 'none' },
      rotate: 5
    });

    // Logo com card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.2, y: 0.2, w: 1.6, h: 0.7,
      fill: { color: colors.white },
      line: { width: 2, color: colors.primary, dashType: 'solid' }
    });

    try {
      slide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 8.4, y: 0.3, w: 1.2, h: 0.5
      });
    } catch (e) {
      slide.addText('DAREDE', {
        x: 8.4, y: 0.35, w: 1.2, h: 0.5,
        fontSize: 12, bold: true, color: colors.primary,
        fontFace: 'Segoe UI', align: 'center', valign: 'middle'
      });
    }

    // Título com linha decorativa
    slide.addText(slideData.title.toUpperCase(), {
      x: 0.5, y: 0.5, w: 7, h: 0.6,
      fontSize: 32, bold: true, color: colors.primary,
      align: 'left', fontFace: 'Segoe UI', charSpacing: 1
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.15, w: 2.5, h: 0.08,
      fill: { color: colors.accent },
      line: { type: 'none' }
    });

    // Card ESQUERDO (Antes) - com ícone X
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5, y: 1.6, w: 4.3, h: 3.4,
      fill: { color: 'FFFFFF' },
      line: { type: 'none' },
      shadow: { type: 'outer', blur: 15, opacity: 0.15, angle: 90, offset: 5 }
    });

    // Badge "ANTES" com fundo
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.7, y: 1.8, w: 1.2, h: 0.4,
      fill: { color: 'DC2626' },
      line: { type: 'none' }
    });

    slide.addText(slideData.leftTitle?.toUpperCase() || 'ANTES', {
      x: 0.7, y: 1.82, w: 1.2, h: 0.36,
      fontSize: 14, bold: true, color: 'FFFFFF',
      align: 'center', fontFace: 'Segoe UI', valign: 'middle'
    });

    // Ícone X grande
    slide.addShape(pptx.ShapeType.rect, {
      x: 2.3, y: 2.4, w: 0.12, h: 1,
      fill: { color: 'DC2626', transparency: 50 },
      line: { type: 'none' },
      rotate: 45
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 2.3, y: 2.4, w: 0.12, h: 1,
      fill: { color: 'DC2626', transparency: 50 },
      line: { type: 'none' },
      rotate: -45
    });

    slide.addText(slideData.leftText || 'Situação anterior problemática', {
      x: 0.8, y: 2.5, w: 3.7, h: 2.2,
      fontSize: 16, color: '4B5563',
      fontFace: 'Segoe UI', valign: 'top'
    });

    // Seta grande central
    slide.addShape(pptx.ShapeType.rightArrow, {
      x: 4.3, y: 3, w: 1.4, h: 0.5,
      fill: { color: colors.accent },
      line: { type: 'none' }
    });

    // Card DIREITO (Depois) - com checkmark
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 5.2, y: 1.6, w: 4.3, h: 3.4,
      fill: { color: colors.primary, transparency: 5 },
      line: { width: 3, color: colors.accent, dashType: 'solid' },
      shadow: { type: 'outer', blur: 20, opacity: 0.2, angle: 90, offset: 5 }
    });

    // Badge "DEPOIS"
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 5.4, y: 1.8, w: 1.4, h: 0.4,
      fill: { color: '10B981' },
      line: { type: 'none' }
    });

    slide.addText(slideData.rightTitle?.toUpperCase() || 'DEPOIS', {
      x: 5.4, y: 1.82, w: 1.4, h: 0.36,
      fontSize: 14, bold: true, color: 'FFFFFF',
      align: 'center', fontFace: 'Segoe UI', valign: 'middle'
    });

    // Checkmark visual
    slide.addShape(pptx.ShapeType.rect, {
      x: 7.1, y: 2.7, w: 0.12, h: 0.6,
      fill: { color: '10B981' },
      line: { type: 'none' },
      rotate: 45
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 6.85, y: 2.95, w: 0.12, h: 0.35,
      fill: { color: '10B981' },
      line: { type: 'none' },
      rotate: -45
    });

    slide.addText(slideData.rightText || 'Nova solução com resultados positivos', {
      x: 5.4, y: 2.5, w: 3.9, h: 2.2,
      fontSize: 16, bold: true, color: colors.primary,
      fontFace: 'Segoe UI', valign: 'top'
    });
  }

  // LAYOUT 3: Icon Grid - Cards com ícones modernos
  createIconGridSlide(pptx, slideData, colors, index) {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.transition = { type: 'wipe', duration: 0.6 };

    // Background com formas geométricas
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 8, y: -1, w: 3, h: 3,
      fill: { color: colors.primary, transparency: 95 },
      line: { type: 'none' }
    });

    slide.addShape(pptx.ShapeType.ellipse, {
      x: -1, y: 4, w: 2.5, h: 2.5,
      fill: { color: colors.accent, transparency: 95 },
      line: { type: 'none' }
    });

    // Logo
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.2, y: 0.2, w: 1.6, h: 0.7,
      fill: { color: colors.white },
      line: { width: 2, color: colors.primary }
    });

    try {
      slide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 8.4, y: 0.3, w: 1.2, h: 0.5
      });
    } catch (e) {
      slide.addText('DAREDE', {
        x: 8.4, y: 0.35, w: 1.2, h: 0.5,
        fontSize: 12, bold: true, color: colors.primary,
        fontFace: 'Segoe UI', align: 'center', valign: 'middle'
      });
    }

    // Título moderno
    slide.addText(slideData.title.toUpperCase(), {
      x: 0.5, y: 0.5, w: 7, h: 0.6,
      fontSize: 36, bold: true, color: colors.primary,
      align: 'left', fontFace: 'Segoe UI', charSpacing: 1
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 1.15, w: 3, h: 0.08,
      fill: { color: colors.accent },
      line: { type: 'none' }
    });

    // Grid profissional (3 cols)
    const items = slideData.items || [];
    const cardW = 2.8;
    const cardH = 2.2;
    const startX = 0.7;
    const startY = 1.8;
    const gapX = 3.1;
    const gapY = 2.5;

    const iconColors = [colors.primary, colors.accent, '10B981', '3B82F6', 'DC2626', '8B5CF6'];

    items.forEach((item, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      const x = startX + (col * gapX);
      const y = startY + (row * gapY);
      const iconColor = iconColors[idx % iconColors.length];

      // Card 3D com sombra
      slide.addShape(pptx.ShapeType.roundRect, {
        x: x + 0.05, y: y + 0.05, w: cardW, h: cardH,
        fill: { color: '000000', transparency: 90 },
        line: { type: 'none' }
      });

      slide.addShape(pptx.ShapeType.roundRect, {
        x: x, y: y, w: cardW, h: cardH,
        fill: { color: 'FFFFFF' },
        line: { width: 2, color: iconColor, dashType: 'solid' },
        shadow: { type: 'outer', blur: 12, opacity: 0.15, angle: 90, offset: 4 }
      });

      // Barra colorida no topo
      slide.addShape(pptx.ShapeType.rect, {
        x: x, y: y, w: cardW, h: 0.15,
        fill: { color: iconColor },
        line: { type: 'none' }
      });

      // Círculo ícone com gradiente visual
      slide.addShape(pptx.ShapeType.ellipse, {
        x: x + 0.9, y: y + 0.4, w: 1, h: 1,
        fill: { color: iconColor, transparency: 15 },
        line: { width: 3, color: iconColor }
      });

      const iconMap = {
        'chart': '📊', 'shield': '🛡', 'rocket': '🚀',
        'star': '⭐', 'check': '✅', 'heart': '❤',
        'dollar': '💰', 'clock': '⏰', 'globe': '🌐',
        'cloud': '☁', 'fire': '🔥', 'target': '🎯'
      };

      slide.addText(iconMap[item.icon] || '●', {
        x: x + 0.9, y: y + 0.45, w: 1, h: 0.9,
        fontSize: 36, align: 'center', valign: 'middle'
      });

      // Título do card
      slide.addText(item.text || '', {
        x: x + 0.15, y: y + 1.5, w: cardW - 0.3, h: 0.6,
        fontSize: 13, bold: true, color: colors.dark,
        align: 'center', fontFace: 'Segoe UI', valign: 'top'
      });
    });
  }

  // LAYOUT 4: Timeline - Linha do tempo
  createTimelineSlide(pptx, slideData, colors, index) {
    const slide = pptx.addSlide();
    slide.background = { color: colors.white };
    slide.transition = { type: 'cover', duration: 0.7 };

    try {
      slide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 8.5, y: 0.3, w: 1.2, h: 0.5
      });
    } catch (e) {
      slide.addText('DAREDE', {
        x: 8.5, y: 0.3, w: 1.2, h: 0.5,
        fontSize: 11, bold: true, color: colors.primary,
        fontFace: 'Arial', align: 'right'
      });
    }

    // Título
    slide.addText(slideData.title, {
      x: 0.5, y: 0.7, w: 9, h: 0.7,
      fontSize: 40, bold: true, color: colors.primary,
      align: 'center', fontFace: 'Arial'
    });

    // Linha horizontal principal
    slide.addShape(pptx.ShapeType.rect, {
      x: 1, y: 2.8, w: 8, h: 0.08,
      fill: { color: colors.accent }, line: { type: 'none' }
    });

    // Steps da timeline
    const steps = slideData.steps || [];
    const stepCount = steps.length;
    const stepW = 7 / (stepCount - 1);

    steps.forEach((step, idx) => {
      const x = 1 + (idx * stepW);

      // Círculo na linha
      slide.addShape(pptx.ShapeType.ellipse, {
        x: x - 0.2, y: 2.6, w: 0.4, h: 0.4,
        fill: { color: colors.primary }, line: { type: 'none' }
      });

      // Ano/data
      slide.addText(step.year || '', {
        x: x - 0.5, y: 2.1, w: 1, h: 0.4,
        fontSize: 24, bold: true, color: colors.accent,
        align: 'center', fontFace: 'Arial'
      });

      // Texto descritivo
      slide.addText(step.text || '', {
        x: x - 0.7, y: 3.3, w: 1.4, h: 1.2,
        fontSize: 14, color: colors.dark,
        align: 'center', fontFace: 'Arial', valign: 'top'
      });
    });
  }

  // LAYOUT 5: Quote - Citação grande
  createQuoteSlide(pptx, slideData, colors, index) {
    const slide = pptx.addSlide();
    slide.background = { color: colors.primary };
    slide.transition = { type: 'zoom', duration: 0.8 };

    try {
      slide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 8.5, y: 0.3, w: 1.2, h: 0.5
      });
    } catch (e) {
      slide.addText('DAREDE', {
        x: 8.5, y: 0.3, w: 1.2, h: 0.5,
        fontSize: 11, bold: true, color: colors.white,
        fontFace: 'Arial', align: 'right'
      });
    }

    // Aspas grandes decorativas
    slide.addText('"', {
      x: 0.5, y: 0.5, w: 1.5, h: 1.5,
      fontSize: 200, color: colors.accent,
      transparency: 30, fontFace: 'Arial'
    });

    // Quote text
    slide.addText(slideData.quote || slideData.title, {
      x: 1.5, y: 1.5, w: 7, h: 2.5,
      fontSize: 36, italic: true, color: colors.white,
      align: 'center', fontFace: 'Arial', valign: 'middle'
    });

    // Autor
    slide.addText(`— ${slideData.author || 'Cliente'}`, {
      x: 2, y: 4.2, w: 6, h: 0.5,
      fontSize: 20, color: colors.accent,
      align: 'center', fontFace: 'Arial'
    });
  }

  // LAYOUT 6: Process - Fluxo de processo
  createProcessSlide(pptx, slideData, colors, index) {
    const slide = pptx.addSlide();
    slide.background = { color: colors.white };
    slide.transition = { type: 'split', duration: 0.7 };

    try {
      slide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 8.5, y: 0.3, w: 1.2, h: 0.5
      });
    } catch (e) {
      slide.addText('DAREDE', {
        x: 8.5, y: 0.3, w: 1.2, h: 0.5,
        fontSize: 11, bold: true, color: colors.primary,
        fontFace: 'Arial', align: 'right'
      });
    }

    // Título
    slide.addText(slideData.title, {
      x: 0.5, y: 0.5, w: 9, h: 0.7,
      fontSize: 40, bold: true, color: colors.primary,
      align: 'center', fontFace: 'Arial'
    });

    // Process steps horizontais
    const steps = slideData.steps || slideData.bullets || [];
    const stepCount = Math.min(steps.length, 4);
    const stepW = 2;
    const startX = 0.8;
    const startY = 2;
    const gapX = 2.3;

    steps.slice(0, stepCount).forEach((step, idx) => {
      const x = startX + (idx * gapX);

      // Card do step
      slide.addShape(pptx.ShapeType.roundRect, {
        x: x, y: startY, w: stepW, h: 2.5,
        fill: { color: idx % 2 === 0 ? colors.primary : colors.accent, transparency: 10 },
        line: { type: 'none' }
      });

      // Número do step
      slide.addShape(pptx.ShapeType.ellipse, {
        x: x + 0.65, y: startY + 0.2, w: 0.7, h: 0.7,
        fill: { color: idx % 2 === 0 ? colors.primary : colors.accent },
        line: { type: 'none' }
      });

      slide.addText(`${idx + 1}`, {
        x: x + 0.65, y: startY + 0.2, w: 0.7, h: 0.7,
        fontSize: 28, bold: true, color: colors.white,
        align: 'center', valign: 'middle', fontFace: 'Arial'
      });

      // Texto do step
      const stepText = typeof step === 'string' ? step : step.text || '';
      slide.addText(stepText, {
        x: x + 0.2, y: startY + 1.1, w: stepW - 0.4, h: 1.2,
        fontSize: 14, color: colors.dark,
        align: 'center', fontFace: 'Arial', valign: 'top'
      });

      // Seta para próximo step
      if (idx < stepCount - 1) {
        slide.addText('→', {
          x: x + stepW, y: startY + 1, w: 0.3, h: 0.5,
          fontSize: 32, color: colors.accent,
          align: 'center', valign: 'middle'
        });
      }
    });
  }

  // LAYOUT DEFAULT: Slide padrão com bullets
  createDefaultSlide(pptx, slideData, colors, index) {
    const slide = pptx.addSlide();
    slide.background = { color: colors.white };
    slide.transition = { type: 'fade', duration: 0.6 };

    // Barra lateral
    slide.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: 0.15, h: 5.625,
      fill: { color: colors.primary }, line: { type: 'none' }
    });

    try {
      slide.addImage({
        path: 'https://i.ibb.co/QvP3HK6n/logo-darede.png',
        x: 8.5, y: 0.3, w: 1.2, h: 0.5
      });
    } catch (e) {
      slide.addText('DAREDE', {
        x: 8.5, y: 0.3, w: 1.2, h: 0.5,
        fontSize: 11, bold: true, color: colors.primary,
        fontFace: 'Arial', align: 'right'
      });
    }

    // Número do slide
    slide.addText(`${index + 2}`, {
      x: 0.3, y: 0.3, w: 0.5, h: 0.5,
      fontSize: 48, bold: true, color: colors.accent,
      fontFace: 'Arial', transparency: 50
    });

    // Título
    slide.addText(slideData.title, {
      x: 0.8, y: 1.2, w: 7.5, h: 0.8,
      fontSize: 40, bold: true, color: colors.primary,
      align: 'left', fontFace: 'Arial'
    });

    // Linha decorativa
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 2.1, w: 2, h: 0.08,
      fill: { color: colors.accent }, line: { type: 'none' }
    });

    // Bullets
    if (slideData.bullets && slideData.bullets.length > 0) {
      slideData.bullets.forEach((bullet, idx) => {
        const yPos = 2.7 + (idx * 0.7);

        slide.addShape(pptx.ShapeType.ellipse, {
          x: 1, y: yPos + 0.05, w: 0.35, h: 0.35,
          fill: { color: colors.accent, transparency: 30 },
          line: { type: 'none' }
        });

        slide.addText(bullet, {
          x: 1.5, y: yPos, w: 7.5, h: 0.5,
          fontSize: 20, color: colors.dark,
          fontFace: 'Arial', valign: 'middle'
        });
      });
    }

    // Forma decorativa
    const shapes = [pptx.ShapeType.ellipse, pptx.ShapeType.rect, pptx.ShapeType.triangle];
    slide.addShape(shapes[index % shapes.length], {
      x: 8.3, y: 4.5, w: 1.4, h: 1.4,
      fill: { color: colors.accent, transparency: 80 },
      line: { type: 'none' }, rotate: 15
    });
  }

  /**
   * Gera conteúdo estruturado dos slides com IA
   */
  async generateSlideContent(briefing, slideCount, company, audience, excelData) {
    const prompt = `Você é um DESIGNER VISUAL especialista em criar apresentações estilo Canva com MÁXIMO IMPACTO VISUAL.

BRIEFING: ${briefing}
${excelData}

Empresa: ${company}
Público: ${audience}
Slides: ${slideCount}

CRIE uma estrutura JSON com slides VISUAIS e VARIADOS:

{
  "title": "Título principal impactante",
  "subtitle": "Subtítulo em 1 linha",
  "slides": [
    {
      "title": "Título Curto",
      "layout": "bigNumber",
      "bigNumber": "250+",
      "bigNumberLabel": "Clientes atendidos",
      "bullets": ["Detalhe 1", "Detalhe 2"]
    },
    {
      "title": "Outro Título",
      "layout": "comparison",
      "leftTitle": "Antes",
      "leftText": "Problema/situação antiga",
      "rightTitle": "Depois",
      "rightText": "Solução/resultado novo"
    },
    {
      "title": "Features",
      "layout": "iconGrid",
      "items": [
        {"icon": "chart", "text": "Analytics avançado"},
        {"icon": "shield", "text": "Segurança total"},
        {"icon": "rocket", "text": "Performance 10x"}
      ]
    },
    {
      "title": "Crescimento",
      "layout": "timeline",
      "steps": [
        {"year": "2020", "text": "Início"},
        {"year": "2023", "text": "Expansão"},
        {"year": "2024", "text": "Liderança"}
      ]
    }
  ]
}

⚠️ LAYOUTS DISPONÍVEIS (VARIE entre eles!):
1. "bigNumber" - Número gigante + explicação (use para métricas)
2. "comparison" - Antes vs Depois lado a lado
3. "iconGrid" - Grid com ícones + texto (3-4 items)
4. "timeline" - Linha do tempo (3-4 passos)
5. "quote" - Citação/depoimento grande
6. "process" - Processo/fluxo em etapas

REGRAS CRÍTICAS:
- CADA slide deve ter layout DIFERENTE
- Títulos: máx 5 palavras, impactantes
- ${excelData ? 'USE números e fatos REAIS dos anexos' : 'Números específicos quando relevante'}
- Varie layouts: NÃO repita o mesmo tipo
- Bullets: máx 8 palavras por item

Retorne APENAS o JSON válido, sem markdown.`;

    const response = await this.openai.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você gera estruturas JSON para apresentações estilo Canva.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 4000
    });

    const jsonText = response.choices[0].message.content.trim();
    const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
      return {
        title: 'Apresentação',
        subtitle: company,
        slides: []
      };
    }
  }
}

module.exports = CanvaPPTXService;
