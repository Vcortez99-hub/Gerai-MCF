const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const TemplateService = require('./TemplateService');
const AssetLibrary = require('./AssetLibrary');

class PresentationService {
  constructor() {
    this.generatedDir = path.join(__dirname, '..', 'generated');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    await fs.ensureDir(this.generatedDir);
  }

  async generatePresentation(templateId, config, aiContent) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 INICIANDO GERAÇÃO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Config:', JSON.stringify(config, null, 2));
    console.log('🎨 AI Content Type:', aiContent.type);

    const startTime = Date.now();

    try {
      console.log('🎯 Generating presentation with type:', aiContent.type);

      let finalHTML;
      let metadata = {};

      if (aiContent.type === 'complete-html') {
        // HTML completo gerado diretamente pela IA
        finalHTML = aiContent.html;
        console.log('✨ Using complete HTML from AI');
        console.log(`📝 HTML length: ${finalHTML ? finalHTML.length : 0} characters`);
      } else {
        // Método antigo - processar template com JSON
        const template = await this.loadTemplate(templateId);
        const brandingConfig = await AssetLibrary.getBrandingConfig();
        const presentation = await this.processTemplate(template, config, aiContent, brandingConfig);
        finalHTML = presentation.html;
        metadata = presentation.metadata;
        console.log('🔄 Using legacy template processing');
      }

      const presentationId = `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const outputPath = path.join(this.generatedDir, `${presentationId}.html`);

      console.log('📝 Final HTML type:', typeof finalHTML);
      console.log('📝 Final HTML defined:', finalHTML !== undefined);
      console.log('📝 Final HTML length:', finalHTML ? finalHTML.length : 'N/A');

      await fs.writeFile(outputPath, finalHTML || '<html><body><h1>Erro: HTML não gerado</h1></body></html>');

      await this.savePresentationMetadata(presentationId, {
        templateId: templateId || 'ai-generated',
        config,
        aiContent,
        generatedAt: new Date().toISOString(),
        outputPath,
        title: aiContent.title || 'Apresentação Gerada'
      });

      const result = {
        id: presentationId,
        title: aiContent.title || 'Apresentação Gerada',
        path: outputPath,
        url: `/generated/${presentationId}.html`,
        preview: await this.generatePreview(outputPath),
        metadata
      };

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Apresentação gerada com sucesso!`);
      console.log(`📊 ID: ${presentationId}`);
      console.log(`📄 Title: ${result.title}`);
      console.log(`🔗 URL: ${result.url}`);
      console.log(`⏱️  Tempo total: ${elapsed}s`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return result;
    } catch (error) {
      console.error('\n❌ ERRO NA GERAÇÃO:', error.message);
      console.error('Stack:', error.stack);
      throw new Error(`Erro ao gerar apresentação: ${error.message}`);
    }
  }

  async loadTemplate(templateId) {
    try {
      // Se for o templateId especial de AI, não precisamos carregar template físico
      if (templateId === 'ai-generated-template') {
        return {
          id: templateId,
          name: 'Template Gerado por IA',
          content: null, // Não há template físico, HTML será gerado pela IA
          isAIGenerated: true
        };
      }

      const templates = await TemplateService.listTemplates();
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        throw new Error(`Template não encontrado: ${templateId}`);
      }

      const content = await fs.readFile(template.path, 'utf-8');
      return {
        ...template,
        content
      };
    } catch (error) {
      throw new Error(`Erro ao carregar template: ${error.message}`);
    }
  }

  async processTemplate(template, config, aiContent, brandingConfig) {
    // Se é template AI, não precisamos processar template físico
    if (template.isAIGenerated || template.content === null) {
      console.log('🎨 Using AI-generated HTML directly');
      return {
        html: aiContent.html, // HTML já vem pronto da IA
        metadata: {
          modules: [],
          assets: [],
          structure: { isAIGenerated: true }
        }
      };
    }

    // Processamento normal para templates físicos
    const $ = cheerio.load(template.content);

    await this.applyBrandingRules($, brandingConfig);
    await this.populateContent($, aiContent);
    await this.optimizeAssets($, config);
    await this.addInteractiveFeatures($);
    await this.addPresentationStyles($);

    return {
      html: $.html(),
      metadata: {
        modules: this.extractModulesInfo($),
        assets: this.extractAssetsInfo($),
        structure: this.extractStructureInfo($)
      }
    };
  }

  async applyBrandingRules($, brandingConfig) {
    const brandingCSS = this.generateBrandingCSS(brandingConfig);

    $('head').append(`<style id="gerai-branding">${brandingCSS}</style>`);

    $('[data-preserve="true"]').each((i, elem) => {
      $(elem).addClass('gerai-preserve-brand');
    });

    $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
      const $elem = $(elem);
      if (!$elem.hasClass('gerai-preserve-brand')) {
        $elem.css('color', brandingConfig.colors.primary);
        $elem.css('font-family', brandingConfig.fonts.primary);
      }
    });

    $('p, div, span').each((i, elem) => {
      const $elem = $(elem);
      if (!$elem.hasClass('gerai-preserve-brand')) {
        $elem.css('font-family', brandingConfig.fonts.primary);
      }
    });
  }

  generateBrandingCSS(brandingConfig) {
    return `
      :root {
        --gerai-primary: ${brandingConfig.colors.primary};
        --gerai-secondary: ${brandingConfig.colors.secondary};
        --gerai-success: ${brandingConfig.colors.success};
        --gerai-warning: ${brandingConfig.colors.warning};
        --gerai-danger: ${brandingConfig.colors.danger};
        --gerai-font-primary: ${brandingConfig.fonts.primary};
        --gerai-font-secondary: ${brandingConfig.fonts.secondary};
        --gerai-spacing-sm: ${brandingConfig.spacing.small};
        --gerai-spacing-md: ${brandingConfig.spacing.medium};
        --gerai-spacing-lg: ${brandingConfig.spacing.large};
        --gerai-spacing-xl: ${brandingConfig.spacing.xlarge};
      }

      .gerai-preserve-brand {
        border: 2px dashed var(--gerai-success) !important;
        position: relative;
      }

      .gerai-preserve-brand::after {
        content: "🔒 Protegido";
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--gerai-success);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
      }

      .gerai-ai-generated {
        border-left: 4px solid var(--gerai-primary);
        padding-left: var(--gerai-spacing-md);
        margin: var(--gerai-spacing-md) 0;
      }

      .gerai-slide {
        min-height: 500px;
        padding: var(--gerai-spacing-lg);
        margin-bottom: var(--gerai-spacing-xl);
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }

      .gerai-slide h1 {
        color: var(--gerai-primary);
        border-bottom: 2px solid var(--gerai-primary);
        padding-bottom: var(--gerai-spacing-sm);
        margin-bottom: var(--gerai-spacing-lg);
      }

      .gerai-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--gerai-spacing-md);
        margin: var(--gerai-spacing-lg) 0;
      }

      .gerai-metric {
        text-align: center;
        padding: var(--gerai-spacing-lg);
        background: #f8f9fa;
        border-radius: 8px;
        border-top: 4px solid var(--gerai-primary);
      }

      .gerai-metric-value {
        font-size: 2em;
        font-weight: bold;
        color: var(--gerai-primary);
        display: block;
      }

      .gerai-metric-label {
        color: var(--gerai-secondary);
        font-size: 0.9em;
        margin-top: var(--gerai-spacing-sm);
      }

      @media print {
        .gerai-slide {
          page-break-after: always;
          box-shadow: none;
          border: 1px solid #ddd;
        }
      }

      @media (max-width: 768px) {
        .gerai-slide {
          padding: var(--gerai-spacing-md);
        }

        .gerai-metrics {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  async populateContent($, aiContent) {
    // Substituir título global
    if (aiContent.title) {
      $('title').text(aiContent.title);
      $('h1').first().text(aiContent.title);
    }

    // Análise inteligente do template para identificar estrutura
    const templateStructure = this.analyzeTemplateStructure($);
    console.log('📋 Template structure detected:', templateStructure);

    // Estratégia mais inteligente de substituição de conteúdo
    for (const [moduleType, moduleData] of Object.entries(aiContent.modules || {})) {
      console.log(`🔄 Processing module: ${moduleType}`);

      // Buscar elementos específicos primeiro
      let moduleElements = $(`[data-module="${moduleType}"]`);

      // Se não encontrar elementos específicos, tentar abordagem mais ampla
      if (moduleElements.length === 0) {
        // Tentar encontrar por classes ou IDs relacionados
        moduleElements = $(`.${moduleType}, #${moduleType}, .slide-${moduleType}`);
      }

      // Tentar encontrar por padrões de conteúdo existente
      if (moduleElements.length === 0) {
        moduleElements = this.findElementsByContentPattern($, moduleType, moduleData);
      }

      // Se ainda não encontrar, criar uma seção genérica
      if (moduleElements.length === 0) {
        const newSection = this.createModuleSection(moduleType, moduleData);
        $('body').append(newSection);
        moduleElements = $(newSection);
        console.log(`✨ Created new section for module: ${moduleType}`);
      }

      moduleElements.each((i, elem) => {
        const $elem = $(elem);
        $elem.addClass('gerai-ai-generated');

        // Tentar encontrar elementos de título de várias formas
        let titleElement = $elem.find('[data-ai-role="title"]');
        if (titleElement.length === 0) {
          titleElement = $elem.find('h1, h2, h3, .title, .slide-title').first();
        }
        if (titleElement.length && moduleData.title) {
          titleElement.text(moduleData.title);
        } else if (moduleData.title) {
          // Se não encontrar elemento de título, criar um
          $elem.prepend(`<h2 class="gerai-generated-title">${moduleData.title}</h2>`);
        }

        // Tentar encontrar elementos de conteúdo de várias formas
        let contentElement = $elem.find('[data-ai-role="description"]');
        if (contentElement.length === 0) {
          contentElement = $elem.find('.content, .description, .text, p').first();
        }
        if (contentElement.length && moduleData.content) {
          contentElement.html(`<p>${moduleData.content}</p>`);
        } else if (moduleData.content) {
          // Se não encontrar elemento de conteúdo, criar um
          $elem.append(`<div class="gerai-generated-content"><p>${moduleData.content}</p></div>`);
        }

        // Tentar encontrar elementos de lista de várias formas
        let listElement = $elem.find('[data-ai-role="list"]');
        if (listElement.length === 0) {
          listElement = $elem.find('ul, ol, .list').first();
        }
        if (listElement.length && moduleData.bullets) {
          const listHTML = moduleData.bullets.map(bullet => `<li>${bullet}</li>`).join('');
          listElement.html(`<ul>${listHTML}</ul>`);
        } else if (moduleData.bullets) {
          // Se não encontrar elemento de lista, criar um
          const listHTML = moduleData.bullets.map(bullet => `<li>${bullet}</li>`).join('');
          $elem.append(`<div class="gerai-generated-list"><ul>${listHTML}</ul></div>`);
        }

        // Adicionar subtítulo se existir
        if (moduleData.subtitle) {
          $elem.append(`<h3 class="gerai-subtitle">${moduleData.subtitle}</h3>`);
        }

        // Adicionar estatísticas se existir
        if (moduleData.stats) {
          $elem.append(`<div class="gerai-stats"><strong>📊 ${moduleData.stats}</strong></div>`);
        }

        if (moduleData.metrics && moduleType === 'metricas') {
          this.addMetricsVisualization($elem, moduleData.metrics);
        }

        if (moduleData.suggestedImage) {
          this.addImagePlaceholder($elem, moduleData.suggestedImage);
        }
      });
    }

    if (aiContent.suggestedAssets) {
      await this.applySuggestedAssets($, aiContent.suggestedAssets);
    }

    // Pós-processamento inteligente
    this.enhanceContentRelevance($, aiContent);
  }

  analyzeTemplateStructure($) {
    return {
      totalElements: $('*').length,
      sections: $('section, div.slide, .slide, article').length,
      headings: $('h1, h2, h3, h4, h5, h6').length,
      lists: $('ul, ol').length,
      images: $('img').length,
      hasDataAttributes: $('[data-*]').length > 0,
      hasSlideStructure: $('.slide, [data-slide], section').length > 0,
      textContent: $('body').text().length
    };
  }

  findElementsByContentPattern($, moduleType, moduleData) {
    // Mapear tipos de módulo para padrões de busca
    const contentPatterns = {
      'capa': 'h1, .title, .hero, .cover, .intro',
      'agenda': '.agenda, .outline, .toc, ul:first, ol:first',
      'problema': '.problem, .challenge, .issue, .current',
      'solucao': '.solution, .strategy, .approach, .method',
      'comparativo': '.compare, .comparison, .before-after, .vs',
      'cases': '.case, .example, .success, .study',
      'metricas': '.metrics, .kpi, .results, .numbers, .stats',
      'timeline': '.timeline, .roadmap, .schedule, .phases',
      'conclusao': '.conclusion, .summary, .next, .action'
    };

    const pattern = contentPatterns[moduleType] || 'div, section, article';
    return $(pattern).filter((i, elem) => {
      const $elem = $(elem);
      const text = $elem.text().toLowerCase();

      // Verificar se o elemento parece estar vazio ou com placeholder
      return text.length > 10 && (
        text.includes('lorem') ||
        text.includes('ipsum') ||
        text.includes('placeholder') ||
        text.includes('your content') ||
        text.includes('title here') ||
        $elem.find('*').length < 3
      );
    }).first();
  }

  createModuleSection(moduleType, moduleData) {
    const sectionClass = `gerai-slide gerai-${moduleType}`;

    let sectionContent = `
      <section class="${sectionClass}" data-module="${moduleType}">
        <div class="slide-container">
    `;

    // Adicionar título se existir
    if (moduleData.title) {
      sectionContent += `<h2 class="slide-title">${moduleData.title}</h2>`;
    }

    // Adicionar conteúdo se existir
    if (moduleData.content) {
      sectionContent += `<div class="slide-content">${moduleData.content}</div>`;
    }

    // Adicionar lista se existir
    if (moduleData.bullets && moduleData.bullets.length > 0) {
      sectionContent += '<ul class="slide-list">';
      moduleData.bullets.forEach(bullet => {
        sectionContent += `<li>${bullet}</li>`;
      });
      sectionContent += '</ul>';
    }

    // Adicionar métricas se existir
    if (moduleData.metrics && moduleType === 'metricas') {
      sectionContent += '<div class="metrics-container">';
      moduleData.metrics.forEach(metric => {
        sectionContent += `
          <div class="metric-item">
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.label}</div>
            ${metric.description ? `<div class="metric-description">${metric.description}</div>` : ''}
          </div>
        `;
      });
      sectionContent += '</div>';
    }

    sectionContent += `
        </div>
      </section>
    `;

    return sectionContent;
  }

  enhanceContentRelevance($, aiContent) {
    // Substituir textos genéricos restantes por conteúdo mais específico
    $('*').each((i, elem) => {
      const $elem = $(elem);
      let text = $elem.text();

      if (text && !$elem.hasClass('gerai-preserve-brand')) {
        // Substituir placeholders comuns
        const replacements = {
          'Lorem ipsum': aiContent.narrative?.hook || 'Conteúdo personalizado gerado por IA',
          'Your Company': aiContent.config?.company || 'Sua Empresa',
          'Company Name': aiContent.config?.company || 'Nome da Empresa',
          'Title Here': aiContent.title || 'Título da Apresentação',
          'Your Title': aiContent.title || 'Título Personalizado',
          'Description here': aiContent.narrative?.keyMessage || 'Mensagem principal',
          'Add your content': 'Conteúdo gerado especificamente para seu contexto'
        };

        Object.entries(replacements).forEach(([placeholder, replacement]) => {
          if (text.includes(placeholder)) {
            $elem.text(text.replace(new RegExp(placeholder, 'gi'), replacement));
          }
        });

        // Substituir textos genéricos por contexto específico
        if (text.match(/^(Description|Content|Text|Sample|Example)/i) && text.length < 50) {
          const contextualContent = this.getContextualContent(aiContent, $elem.closest('[data-module]').attr('data-module'));
          if (contextualContent) {
            $elem.text(contextualContent);
          }
        }
      }
    });
  }

  getContextualContent(aiContent, moduleType) {
    const contextMap = {
      'capa': aiContent.narrative?.hook,
      'agenda': 'Estrutura estratégica desta apresentação',
      'problema': 'Análise da situação atual e desafios identificados',
      'solucao': 'Estratégia personalizada para seus objetivos',
      'cases': 'Exemplos de sucesso em contextos similares',
      'metricas': 'Indicadores de performance e ROI esperado',
      'conclusao': aiContent.narrative?.cta
    };

    return contextMap[moduleType] || null;
  }

  addMetricsVisualization($elem, metrics) {
    const metricsHTML = metrics.map(metric => `
      <div class="gerai-metric">
        <span class="gerai-metric-value">${metric.value}</span>
        <div class="gerai-metric-label">${metric.label}</div>
        ${metric.description ? `<small>${metric.description}</small>` : ''}
      </div>
    `).join('');

    $elem.append(`<div class="gerai-metrics">${metricsHTML}</div>`);
  }

  addImagePlaceholder($elem, suggestion) {
    const placeholderHTML = `
      <div class="gerai-image-placeholder" style="
        background: #f8f9fa;
        border: 2px dashed #007bff;
        padding: 40px;
        text-align: center;
        margin: 16px 0;
        border-radius: 8px;
      ">
        <div style="color: #007bff; font-size: 24px; margin-bottom: 8px;">🖼️</div>
        <div style="color: #6c757d; font-size: 14px;">
          <strong>Sugestão de Imagem:</strong><br>
          ${suggestion}
        </div>
      </div>
    `;

    $elem.append(placeholderHTML);
  }

  async applySuggestedAssets($, suggestedAssets) {
    if (suggestedAssets.icons) {
      for (const iconName of suggestedAssets.icons.slice(0, 3)) {
        const iconAssets = await AssetLibrary.searchAssets(iconName, 'icons');
        if (iconAssets.icons.length > 0) {
          $('body').append(`<!-- Ícone sugerido: ${iconAssets.icons[0].url} -->`);
        }
      }
    }

    if (suggestedAssets.colorPalette) {
      const colorCSS = suggestedAssets.colorPalette.map((color, i) =>
        `.gerai-accent-${i + 1} { color: ${color}; }`
      ).join('\n');

      $('head').append(`<style>${colorCSS}</style>`);
    }
  }

  async optimizeAssets($, config) {
    $('img').each((i, elem) => {
      const $elem = $(elem);

      if (!$elem.hasClass('gerai-preserve-brand')) {
        $elem.attr('loading', 'lazy');

        if (!$elem.attr('alt')) {
          $elem.attr('alt', 'Imagem da apresentação');
        }

        const currentSrc = $elem.attr('src');
        if (currentSrc && !currentSrc.startsWith('http') && !currentSrc.startsWith('/')) {
          $elem.attr('src', `/assets/images/${currentSrc}`);
        }
      }
    });

    $('[data-ai-search="true"]').each((i, elem) => {
      const $elem = $(elem);
      $elem.addClass('gerai-dynamic-content');
      $elem.attr('title', 'Conteúdo será substituído por IA');
    });
  }

  async addInteractiveFeatures($) {
    const interactiveScript = `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Navegação por teclado
          document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
              nextSlide();
            } else if (e.key === 'ArrowLeft') {
              prevSlide();
            } else if (e.key === 'Escape') {
              exitFullscreen();
            } else if (e.key === 'f' || e.key === 'F11') {
              toggleFullscreen();
              e.preventDefault();
            }
          });

          // Controles de apresentação
          function nextSlide() {
            const slides = document.querySelectorAll('.gerai-slide');
            // Implementar navegação
          }

          function prevSlide() {
            // Implementar navegação anterior
          }

          function toggleFullscreen() {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }

          // Indicador de progresso
          updateProgress();
        });

        function updateProgress() {
          const slides = document.querySelectorAll('.gerai-slide');
          const currentSlide = 1; // Implementar lógica de slide atual
          const progress = (currentSlide / slides.length) * 100;

          const progressBar = document.createElement('div');
          progressBar.style.cssText = \`
            position: fixed;
            top: 0;
            left: 0;
            width: \${progress}%;
            height: 4px;
            background: var(--gerai-primary);
            z-index: 1000;
            transition: width 0.3s ease;
          \`;

          document.body.appendChild(progressBar);
        }
      </script>
    `;

    $('body').append(interactiveScript);
  }

  async addPresentationStyles($) {
    const presentationCSS = `
      <style>
        .gerai-presentation-mode {
          font-size: 1.2em;
          line-height: 1.6;
        }

        .gerai-speaker-notes {
          display: none;
          background: #f8f9fa;
          border-left: 4px solid var(--gerai-warning);
          padding: var(--gerai-spacing-md);
          margin: var(--gerai-spacing-md) 0;
          font-style: italic;
        }

        .gerai-controls {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 1000;
        }

        .gerai-controls button {
          background: none;
          border: 1px solid white;
          color: white;
          padding: 5px 10px;
          margin: 0 2px;
          border-radius: 4px;
          cursor: pointer;
        }

        .gerai-controls button:hover {
          background: rgba(255,255,255,0.2);
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
      </style>
    `;

    $('head').append(presentationCSS);

    const controls = `
      <div class="gerai-controls">
        <button onclick="toggleFullscreen()">⛶ Tela Cheia</button>
        <button onclick="toggleSpeakerNotes()">📝 Notas</button>
        <button onclick="exportPDF()">📄 PDF</button>
      </div>
    `;

    $('body').append(controls);
  }

  extractModulesInfo($) {
    const modules = [];
    $('[data-module]').each((i, elem) => {
      const $elem = $(elem);
      modules.push({
        type: $elem.attr('data-module'),
        selector: $elem.prop('tagName').toLowerCase(),
        hasContent: $elem.text().trim().length > 0,
        aiGenerated: $elem.hasClass('gerai-ai-generated')
      });
    });
    return modules;
  }

  extractAssetsInfo($) {
    const assets = {
      images: [],
      preserved: []
    };

    $('img').each((i, elem) => {
      const $elem = $(elem);
      const asset = {
        src: $elem.attr('src'),
        alt: $elem.attr('alt'),
        preserved: $elem.hasClass('gerai-preserve-brand')
      };

      if (asset.preserved) {
        assets.preserved.push(asset);
      } else {
        assets.images.push(asset);
      }
    });

    return assets;
  }

  extractStructureInfo($) {
    return {
      totalSlides: $('.gerai-slide').length || $('[data-module]').length,
      hasInteractivity: $('script').length > 0,
      hasBranding: $('.gerai-preserve-brand').length > 0,
      responsiveDesign: $('meta[name="viewport"]').length > 0
    };
  }

  async generatePreview(htmlPath) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });

      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const previewPath = htmlPath.replace('.html', '_preview.png');
      await page.screenshot({
        path: previewPath,
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });

      await browser.close();

      return `/generated/${path.basename(previewPath)}`;
    } catch (error) {
      console.warn('Erro ao gerar preview:', error.message);
      return null;
    }
  }

  async exportToPDF(presentationId) {
    try {
      const metadata = await this.loadPresentationMetadata(presentationId);
      if (!metadata) {
        throw new Error('Apresentação não encontrada');
      }

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      const htmlContent = await fs.readFile(metadata.outputPath, 'utf-8');

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfPath = metadata.outputPath.replace('.html', '.pdf');
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });

      await browser.close();
      return pdfPath;
    } catch (error) {
      throw new Error(`Erro ao exportar PDF: ${error.message}`);
    }
  }

  async savePresentationMetadata(presentationId, metadata) {
    const metadataPath = path.join(this.generatedDir, `${presentationId}.meta.json`);
    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  }

  async loadPresentationMetadata(presentationId) {
    try {
      const metadataPath = path.join(this.generatedDir, `${presentationId}.meta.json`);
      return await fs.readJson(metadataPath);
    } catch (error) {
      return null;
    }
  }

  async listPresentations() {
    try {
      const files = await fs.readdir(this.generatedDir);
      const presentations = [];

      for (const file of files) {
        if (file.endsWith('.meta.json')) {
          const presentationId = file.replace('.meta.json', '');
          const metadata = await this.loadPresentationMetadata(presentationId);

          if (metadata) {
            presentations.push({
              id: presentationId,
              title: metadata.title,
              createdAt: metadata.generatedAt,
              config: metadata.config,
              url: `/generated/${presentationId}.html`,
              preview: `/generated/${presentationId}_preview.png`
            });
          }
        }
      }

      return presentations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw new Error(`Erro ao listar apresentações: ${error.message}`);
    }
  }
}

module.exports = new PresentationService();
