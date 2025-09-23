const fs = require('fs-extra');
const path = require('path');
const cheerio = require('cheerio');

class TemplateService {
  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.assetsDir = path.join(__dirname, '..', 'assets');
    this.moduleTypes = [
      'agenda', 'problema', 'solucao', 'comparativo',
      'cases', 'metricas', 'storytelling', 'conclusao'
    ];
  }

  async listTemplates() {
    try {
      await fs.ensureDir(this.templatesDir);
      const files = await fs.readdir(this.templatesDir);

      const templates = [];
      for (const file of files) {
        if (path.extname(file).toLowerCase() === '.html') {
          const templatePath = path.join(this.templatesDir, file);
          const metadata = await this.extractTemplateMetadata(templatePath);
          templates.push({
            id: path.parse(file).name,
            name: metadata.name || path.parse(file).name,
            description: metadata.description || 'Template de apresentação',
            category: metadata.category || 'geral',
            modules: metadata.modules || [],
            thumbnail: metadata.thumbnail || null,
            createdAt: (await fs.stat(templatePath)).ctime,
            path: templatePath
          });
        }
      }

      return templates;
    } catch (error) {
      throw new Error(`Erro ao listar templates: ${error.message}`);
    }
  }

  async extractTemplateMetadata(templatePath) {
    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      const $ = cheerio.load(content);

      const metadata = {
        name: $('meta[name="template-name"]').attr('content') ||
              $('title').text() ||
              path.basename(templatePath, '.html'),
        description: $('meta[name="description"]').attr('content') || '',
        category: $('meta[name="category"]').attr('content') || 'geral',
        thumbnail: $('meta[name="thumbnail"]').attr('content') || null,
        modules: []
      };

      $('[data-module]').each((i, elem) => {
        const moduleType = $(elem).attr('data-module');
        if (this.moduleTypes.includes(moduleType)) {
          metadata.modules.push({
            type: moduleType,
            selector: $(elem).prop('tagName').toLowerCase() +
                     ($(elem).attr('id') ? '#' + $(elem).attr('id') : '') +
                     ($(elem).attr('class') ? '.' + $(elem).attr('class').split(' ').join('.') : ''),
            placeholder: $(elem).attr('data-placeholder') || `{{${moduleType}}}`
          });
        }
      });

      return metadata;
    } catch (error) {
      return { name: path.basename(templatePath, '.html') };
    }
  }

  async processTemplate(file, metadata = {}) {
    try {
      const templatePath = file.path;
      const content = await fs.readFile(templatePath, 'utf-8');

      const processedTemplate = await this.createSmartTemplate(content, metadata);

      const templateId = path.parse(file.filename).name;
      const outputPath = path.join(this.templatesDir, `${templateId}_processed.html`);

      await fs.writeFile(outputPath, processedTemplate);

      return {
        id: templateId,
        originalPath: templatePath,
        processedPath: outputPath,
        metadata: await this.extractTemplateMetadata(outputPath)
      };
    } catch (error) {
      throw new Error(`Erro ao processar template: ${error.message}`);
    }
  }

  async createSmartTemplate(htmlContent, metadata) {
    const $ = cheerio.load(htmlContent);

    this.addModuleMarkers($);
    this.addContentPlaceholders($);
    this.preserveBrandingElements($);
    this.makeResponsive($);

    return $.html();
  }

  addModuleMarkers($) {
    const commonSelectors = [
      'section', '.slide', '.page', '.content-block',
      'h1, h2, h3', '.title', '.subtitle',
      'p', '.description', '.text-content',
      'ul, ol', '.list', '.bullet-points',
      'img', '.image', '.graphic',
      '.chart', '.graph', '.metrics',
      '.logo', '.brand'
    ];

    commonSelectors.forEach(selector => {
      $(selector).each((i, elem) => {
        const $elem = $(elem);
        const text = $elem.text().toLowerCase();

        if (text.includes('agenda') || text.includes('índice')) {
          $elem.attr('data-module', 'agenda');
        } else if (text.includes('problema') || text.includes('desafio')) {
          $elem.attr('data-module', 'problema');
        } else if (text.includes('solução') || text.includes('proposta')) {
          $elem.attr('data-module', 'solucao');
        } else if (text.includes('comparativo') || text.includes('versus')) {
          $elem.attr('data-module', 'comparativo');
        } else if (text.includes('case') || text.includes('exemplo')) {
          $elem.attr('data-module', 'cases');
        } else if (text.includes('métrica') || text.includes('resultado')) {
          $elem.attr('data-module', 'metricas');
        } else if ($elem.is('img') && !$elem.hasClass('logo')) {
          $elem.attr('data-content-type', 'image');
        }
      });
    });
  }

  addContentPlaceholders($) {
    $('[data-module]').each((i, elem) => {
      const $elem = $(elem);
      const module = $elem.attr('data-module');

      if (!$elem.attr('data-placeholder')) {
        $elem.attr('data-placeholder', `{{${module}_content}}`);
      }

      if ($elem.is('h1, h2, h3')) {
        $elem.attr('data-ai-role', 'title');
      } else if ($elem.is('p, div') && $elem.text().length > 50) {
        $elem.attr('data-ai-role', 'description');
      } else if ($elem.is('ul, ol')) {
        $elem.attr('data-ai-role', 'list');
      }
    });

    $('img:not(.logo)').each((i, elem) => {
      const $elem = $(elem);
      if (!$elem.attr('data-placeholder')) {
        $elem.attr('data-placeholder', '{{dynamic_image}}');
        $elem.attr('data-ai-search', 'true');
      }
    });
  }

  preserveBrandingElements($) {
    $('img').each((i, elem) => {
      const $elem = $(elem);
      const src = $elem.attr('src') || '';
      const alt = $elem.attr('alt') || '';

      if (src.includes('logo') || alt.includes('logo') ||
          $elem.hasClass('logo') || $elem.closest('.logo').length) {
        $elem.addClass('preserve-brand');
        $elem.attr('data-preserve', 'true');
      }
    });

    $('[class*="brand"], [class*="logo"], [id*="brand"], [id*="logo"]').each((i, elem) => {
      $(elem).addClass('preserve-brand').attr('data-preserve', 'true');
    });
  }

  makeResponsive($) {
    if (!$('meta[name="viewport"]').length) {
      $('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }

    const responsiveCSS = `
    <style>
      .gerai-responsive {
        max-width: 100%;
        height: auto;
      }
      .gerai-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }
      @media (max-width: 768px) {
        .gerai-container { padding: 0 15px; }
        .gerai-responsive { font-size: 14px; }
      }
    </style>
    `;

    $('head').append(responsiveCSS);
    $('img:not(.preserve-brand)').addClass('gerai-responsive');
  }

  async createPitchDeckTemplate(type = 'vendas') {
    const pitchStructures = {
      vendas: [
        'agenda', 'problema', 'solucao', 'comparativo',
        'cases', 'metricas', 'conclusao'
      ],
      onboarding: [
        'agenda', 'visao_geral', 'processos', 'ferramentas',
        'timeline', 'contatos', 'proximos_passos'
      ],
      relatorio: [
        'agenda', 'resumo_executivo', 'metricas', 'analises',
        'conquistas', 'desafios', 'plano_acao'
      ]
    };

    const structure = pitchStructures[type] || pitchStructures.vendas;

    let htmlTemplate = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="template-name" content="Pitch Deck ${type.charAt(0).toUpperCase() + type.slice(1)}">
        <meta name="category" content="pitch-deck">
        <title>Pitch Deck - ${type}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .slide { margin-bottom: 40px; padding: 30px; border: 1px solid #ddd; border-radius: 8px; }
            .slide h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .slide h2 { color: #666; }
            .preserve-brand { border: 2px dashed #28a745; }
        </style>
    </head>
    <body>
    `;

    structure.forEach((module, index) => {
      htmlTemplate += `
        <div class="slide" data-module="${module}">
            <h1 data-ai-role="title" data-placeholder="{{${module}_title}}">
                ${this.getModuleTitle(module)}
            </h1>
            <div data-ai-role="description" data-placeholder="{{${module}_content}}">
                <p>Conteúdo será gerado automaticamente pela IA baseado no seu briefing.</p>
            </div>
        </div>
      `;
    });

    htmlTemplate += `
    </body>
    </html>
    `;

    const fileName = `pitch_deck_${type}_${Date.now()}.html`;
    const filePath = path.join(this.templatesDir, fileName);

    await fs.writeFile(filePath, htmlTemplate);

    return {
      id: path.parse(fileName).name,
      path: filePath,
      type: 'pitch-deck',
      category: type,
      structure
    };
  }

  getModuleTitle(module) {
    const titles = {
      agenda: 'Agenda',
      problema: 'O Problema',
      solucao: 'Nossa Solução',
      comparativo: 'Comparativo',
      cases: 'Cases de Sucesso',
      metricas: 'Métricas e Resultados',
      conclusao: 'Conclusão',
      visao_geral: 'Visão Geral',
      processos: 'Processos',
      ferramentas: 'Ferramentas',
      timeline: 'Timeline',
      contatos: 'Contatos',
      proximos_passos: 'Próximos Passos',
      resumo_executivo: 'Resumo Executivo',
      analises: 'Análises',
      conquistas: 'Conquistas',
      desafios: 'Desafios',
      plano_acao: 'Plano de Ação'
    };

    return titles[module] || module.charAt(0).toUpperCase() + module.slice(1);
  }
}

module.exports = new TemplateService();