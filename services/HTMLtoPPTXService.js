/**
 * HTMLtoPPTXService - Converte apresentações HTML em PPTX com qualidade profissional
 * Usa Puppeteer para capturar screenshots de cada slide HTML e insere no PowerPoint
 */

const pptxgen = require('pptxgenjs');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class HTMLtoPPTXService {
  constructor() {
    this.browser = null;
  }

  /**
   * Converte HTML gerado para PPTX mantendo todo o design visual
   */
  async convertHTMLtoPPTX(htmlFilePath, outputFileName) {
    console.log('🎨 Convertendo HTML para PPTX profissional...');

    try {
      // Ler HTML
      const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');

      // Extrair slides do HTML
      const slideMatches = htmlContent.match(/<section[^>]*class="slide"[^>]*>[\s\S]*?<\/section>/g);

      if (!slideMatches || slideMatches.length === 0) {
        throw new Error('Nenhum slide encontrado no HTML');
      }

      console.log(`📊 Encontrados ${slideMatches.length} slides no HTML`);

      // Iniciar navegador
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await this.browser.newPage();

      // Configurar viewport 16:9 HD
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2 // Retina quality
      });

      // Criar PPTX
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'Darede - GerAI';
      pptx.company = 'Darede';

      // Criar HTML temporário para cada slide
      const tempDir = path.join(__dirname, '../temp');
      await fs.mkdir(tempDir, { recursive: true });

      // Processar cada slide
      for (let i = 0; i < slideMatches.length; i++) {
        console.log(`📸 Capturando slide ${i + 1}/${slideMatches.length}...`);

        const slideHTML = this.wrapSlideHTML(slideMatches[i], htmlContent);
        const tempHTMLPath = path.join(tempDir, `slide_${i}.html`);
        await fs.writeFile(tempHTMLPath, slideHTML, 'utf-8');

        // Navegar e capturar screenshot
        await page.goto(`file:///${tempHTMLPath.replace(/\\/g, '/')}`, {
          waitUntil: 'networkidle0'
        });

        // Aguardar animações CSS
        await page.waitForTimeout(500);

        // Tirar screenshot
        const screenshotPath = path.join(tempDir, `slide_${i}.png`);
        await page.screenshot({
          path: screenshotPath,
          type: 'png',
          fullPage: false
        });

        // Adicionar slide ao PPTX como imagem
        const slide = pptx.addSlide();
        slide.addImage({
          path: screenshotPath,
          x: 0,
          y: 0,
          w: 10,
          h: 5.625,
          sizing: { type: 'contain', w: 10, h: 5.625 }
        });

        // Adicionar transição
        const transitions = ['fade', 'push', 'wipe', 'cover', 'reveal'];
        slide.transition = {
          type: transitions[i % transitions.length],
          duration: 0.6
        };

        console.log(`✅ Slide ${i + 1} capturado`);
      }

      // Fechar navegador
      await this.browser.close();
      this.browser = null;

      // Salvar PPTX
      const outputPath = path.join(__dirname, '../generated', outputFileName);
      await pptx.writeFile({ fileName: outputPath });

      // Limpar arquivos temporários
      await this.cleanupTempFiles(tempDir);

      console.log(`✅ PPTX gerado com sucesso: ${outputFileName}`);

      return {
        success: true,
        fileName: outputFileName,
        filePath: outputPath,
        url: `/generated/${outputFileName}`,
        slideCount: slideMatches.length
      };
    } catch (error) {
      console.error('❌ Erro ao converter HTML para PPTX:', error);

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      throw error;
    }
  }

  /**
   * Envolve slide individual com CSS/JS completo
   */
  wrapSlideHTML(slideContent, originalHTML) {
    // Extrair CSS do HTML original
    const styleMatches = originalHTML.match(/<style>[\s\S]*?<\/style>/g);
    const styles = styleMatches ? styleMatches.join('\n') : '';

    // Extrair scripts do HTML original
    const scriptMatches = originalHTML.match(/<script>[\s\S]*?<\/script>/g);
    const scripts = scriptMatches ? scriptMatches.join('\n') : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080">
  ${styles}
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
    }
    .slide {
      opacity: 1 !important;
      transform: none !important;
      display: flex !important;
    }
    .slide.active {
      opacity: 1 !important;
    }
    /* Forçar animações a completarem */
    * {
      animation-play-state: running !important;
      animation-delay: 0s !important;
    }
  </style>
</head>
<body>
  ${slideContent}
  ${scripts}
  <script>
    // Ativar slide imediatamente
    document.querySelector('.slide').classList.add('active');

    // Forçar Chart.js a renderizar se existir
    if (typeof Chart !== 'undefined') {
      setTimeout(() => {
        document.querySelectorAll('canvas').forEach(canvas => {
          const ctx = canvas.getContext('2d');
          if (ctx && canvas.dataset.chart) {
            try {
              eval(canvas.dataset.chart);
            } catch(e) {}
          }
        });
      }, 100);
    }
  </script>
</body>
</html>`;
  }

  /**
   * Limpa arquivos temporários
   */
  async cleanupTempFiles(tempDir) {
    try {
      const files = await fs.readdir(tempDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(tempDir, file)).catch(() => {}))
      );
      await fs.rmdir(tempDir).catch(() => {});
    } catch (error) {
      console.warn('⚠️  Erro ao limpar arquivos temporários:', error.message);
    }
  }
}

module.exports = HTMLtoPPTXService;
