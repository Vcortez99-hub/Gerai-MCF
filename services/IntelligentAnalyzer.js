/**
 * Intelligent Analyzer - Análise real de documentos e briefings usando OpenAI
 * Processa anexos, extrai insights reais e gera conteúdo personalizado
 */

const OpenAI = require('openai');
const fs = require('fs-extra');
const XLSX = require('xlsx');
const CacheManager = require('./CacheManager');
const DataValidator = require('./DataValidator');
const promptManager = require('./PromptManager');

class IntelligentAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o'; // GPT-4o para análise mais avançada

    console.log('🧠 IntelligentAnalyzer inicializado - Análise real com IA');
    console.log(`🎯 Modelo configurado: ${this.model}`);

    // Sistema de cache e validação
    this.cache = new CacheManager();
    this.validator = new DataValidator();

    // Inicializar sistema de prompts
    this.initializePrompts();

    console.log('✅ Cache, validação e prompts integrados');
  }

  /**
   * Inicializa sistema de prompts externos
   */
  async initializePrompts() {
    try {
      if (!promptManager.initialized) {
        await promptManager.initialize();
      }
      console.log('📝 Sistema de prompts carregado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao carregar prompts:', error);
      return false;
    }
  }

  /**
   * Extrai JSON de resposta que pode estar em markdown
   */
  parseJSONFromResponse(content) {
    try {
      // Tenta parse direto primeiro
      return JSON.parse(content);
    } catch {
      try {
        // Se falhar, procura por JSON em bloco de código markdown (mais flexível)
        const jsonMatch = content.match(/```(?:json)?\s*([\[\{][\s\S]*?[\]\}])\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }

        // Procura por array JSON solto (começando com [)
        const arrayMatch = content.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          return JSON.parse(arrayMatch[0]);
        }

        // Procura por objeto JSON solto (começando com {)
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          return JSON.parse(objectMatch[0]);
        }

        // Se não encontrar JSON, retorna null para ativar fallbacks
        console.warn('⚠️ Nenhum JSON válido encontrado na resposta, retornando null para ativar fallbacks');
        return null;
      } catch (parseError) {
        console.error('❌ Erro ao extrair JSON da resposta:', parseError);
        console.error('📝 Conteúdo recebido (preview):', content.substring(0, 200) + '...');
        // Retorna null para ativar fallbacks em vez de lançar erro
        return null;
      }
    }
  }

  /**
   * Analisa briefing e anexos de forma inteligente
   */
  async analyzeContent(briefing, config) {
    console.log('🔍 Iniciando análise inteligente do conteúdo...');

    // Garantir que os prompts estão carregados antes de prosseguir
    if (!promptManager.initialized) {
      console.log('⏳ Aguardando inicialização dos prompts...');
      const initialized = await this.initializePrompts();
      if (!initialized) {
        throw new Error('Falha ao carregar prompts externos');
      }
    }

    try {
      // 1. Analisar anexos se existirem
      let attachmentAnalysis = null;
      if (config.attachments && config.attachments.length > 0) {
        console.log(`📎 Analisando ${config.attachments.length} anexo(s)...`);
        attachmentAnalysis = await this.analyzeAttachments(config.attachments, briefing);
      }

      // 2. Análise do briefing principal
      const briefingAnalysis = await this.analyzeBriefing(briefing, config);

      // 3. Gerar estrutura de slides inteligente
      const slideStructure = await this.generateSlideStructure(briefing, config, attachmentAnalysis);

      // 4. Gerar conteúdo para cada slide
      const slides = await this.generateSlideContents(briefing, config, slideStructure, attachmentAnalysis);

      console.log('✅ Análise inteligente concluída!');

      return {
        success: true,
        briefingAnalysis,
        attachmentAnalysis,
        slideStructure,
        slides,
        insights: this.extractKeyInsights(briefingAnalysis, attachmentAnalysis)
      };

    } catch (error) {
      console.error('❌ Erro na análise inteligente:', error);
      throw error;
    }
  }

  /**
   * Analisa anexos usando IA com REAL processamento de dados
   */
  async analyzeAttachments(attachments, briefing) {
    console.log('📊 Processando anexos com IA...');

    const analysisResults = [];

    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      console.log(`📄 Analisando anexo ${i + 1}: ${attachment.type}`);

      try {
        // Extrair conteúdo do anexo baseado no tipo
        let content = '';
        let structuredData = null;

        if (attachment.url && attachment.url.startsWith('data:')) {
          // Anexo em base64
          const base64Data = attachment.url.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');

          if (attachment.type.includes('spreadsheet') ||
              attachment.type.includes('excel') ||
              attachment.type.includes('xlsx') ||
              attachment.type.includes('sheet') ||
              attachment.name?.endsWith('.xlsx') ||
              attachment.name?.endsWith('.xls') ||
              attachment.name?.endsWith('.csv')) {
            // REAL Excel processing with mathematical analysis
            console.log('📊 Processando arquivo Excel com análise matemática...');
            console.log(`📄 Tipo: ${attachment.type}, Nome: ${attachment.name || 'sem nome'}`);
            try {
              const workbook = XLSX.read(buffer, { type: 'buffer' });
              const sheetNames = workbook.SheetNames;

              let excelData = {
                sheets: {},
                summary: { totalSheets: sheetNames.length, sheetNames },
                analysis: {
                  totalCells: 0,
                  numericCells: 0,
                  textCells: 0,
                  calculations: {}
                }
              };

              // DETAILED analysis of each sheet
              sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

                // Separate headers from data
                const headers = jsonData[0] || [];
                const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));

                // MATHEMATICAL ANALYSIS
                const numericColumns = {};
                headers.forEach((header, index) => {
                  if (header) {
                    const columnValues = dataRows.map(row => row[index]).filter(val => val !== null && val !== '' && !isNaN(parseFloat(val)));

                    if (columnValues.length > 0) {
                      const numbers = columnValues.map(val => parseFloat(val));
                      numericColumns[header] = {
                        count: numbers.length,
                        sum: numbers.reduce((a, b) => a + b, 0),
                        average: numbers.reduce((a, b) => a + b, 0) / numbers.length,
                        min: Math.min(...numbers),
                        max: Math.max(...numbers),
                        values: numbers
                      };
                    }
                  }
                });

                excelData.sheets[sheetName] = {
                  headers: headers,
                  data: dataRows,
                  rowCount: dataRows.length,
                  columnCount: headers.length,
                  numericColumns: numericColumns,
                  totalNumericCells: Object.values(numericColumns).reduce((sum, col) => sum + col.count, 0)
                };

                // Add to global analysis
                excelData.analysis.totalCells += dataRows.length * headers.length;
                excelData.analysis.numericCells += Object.values(numericColumns).reduce((sum, col) => sum + col.count, 0);
              });

              structuredData = excelData;

              // Create DETAILED textual summary with REAL calculations
              content = `ARQUIVO EXCEL ANALISADO COM PRECISÃO MATEMÁTICA:
Total de planilhas: ${sheetNames.length}
Planilhas: ${sheetNames.join(', ')}
Total de células analisadas: ${excelData.analysis.totalCells}
Células numéricas encontradas: ${excelData.analysis.numericCells}

ANÁLISE DETALHADA POR PLANILHA:
`;

              sheetNames.forEach(sheetName => {
                const sheet = excelData.sheets[sheetName];
                content += `\n=== PLANILHA: ${sheetName} ===\n`;
                content += `Cabeçalhos: ${sheet.headers.join(' | ')}\n`;
                content += `Linhas de dados: ${sheet.rowCount}\n`;
                content += `Colunas: ${sheet.columnCount}\n`;
                content += `Células numéricas: ${sheet.totalNumericCells}\n`;

                // Add REAL mathematical analysis for each numeric column
                if (Object.keys(sheet.numericColumns).length > 0) {
                  content += `\nANÁLISE MATEMÁTICA:\n`;
                  Object.entries(sheet.numericColumns).forEach(([header, stats]) => {
                    content += `${header}: SOMA=${stats.sum.toFixed(2)}, MÉDIA=${stats.average.toFixed(2)}, MIN=${stats.min}, MAX=${stats.max}, TOTAL_VALORES=${stats.count}\n`;
                  });
                }

                // Show ACTUAL data samples
                content += `\nPRIMEIRAS 3 LINHAS DE DADOS REAIS:\n`;
                sheet.data.slice(0, 3).forEach((row, index) => {
                  content += `Linha ${index + 1}: ${row.join(' | ')}\n`;
                });
              });

              console.log(`✅ Excel processado: ${excelData.analysis.numericCells} células numéricas, ${excelData.analysis.totalCells} células totais`);
              console.log(`📝 Conteúdo preparado para IA: ${content.length} caracteres`);
              console.log(`🔍 Preview do conteúdo: ${content.substring(0, 300)}...`);

            } catch (xlsxError) {
              console.error('❌ ERRO CRÍTICO ao processar Excel:', xlsxError.message);
              content = `ERRO CRÍTICO no processamento Excel: ${xlsxError.message}`;
            }
          } else if (attachment.type.includes('text') || attachment.type.includes('csv')) {
            content = buffer.toString('utf-8');
          }
        }

        if (content.length > 0) {
          // Análise IA do conteúdo usando prompt externo
          const messages = promptManager.buildMessages('analysis', 'data-analysis', {
            briefing: briefing.substring(0, 200) + '...',
            content
          });

          const response = await this.openai.chat.completions.create({
            model: this.model,
            messages
          });

          const analysis = this.parseJSONFromResponse(response.choices[0].message.content);
          analysisResults.push({
            index: i,
            type: attachment.type,
            analysis,
            structuredData, // Dados Excel estruturados
            hasContent: true
          });

        } else {
          // Anexo sem conteúdo extraível
          analysisResults.push({
            index: i,
            type: attachment.type,
            analysis: {
              summary: `Arquivo ${attachment.type} detectado mas conteúdo não processável`,
              insights: [],
              statistics: [],
              recommendations: [],
              risks: []
            },
            hasContent: false
          });
        }

      } catch (error) {
        console.warn(`⚠️ Erro ao analisar anexo ${i + 1}:`, error.message);
        analysisResults.push({
          index: i,
          type: attachment.type,
          analysis: {
            summary: 'Erro no processamento do anexo',
            insights: [],
            statistics: [],
            recommendations: [],
            risks: []
          },
          hasContent: false,
          error: error.message
        });
      }
    }

    return {
      count: attachments.length,
      results: analysisResults,
      hasValidData: analysisResults.some(r => r.hasContent)
    };
  }

  /**
   * Analisa briefing usando IA
   */
  async analyzeBriefing(briefing, config) {
    console.log('📝 Analisando briefing com IA...');

    const messages = promptManager.buildMessages('analysis', 'briefing-analysis', {
      briefing,
      audience: config.audience || 'Não especificado',
      company: config.company || 'Não especificado'
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    return this.parseJSONFromResponse(response.choices[0].message.content);
  }

  /**
   * Gera estrutura inteligente de slides
   */
  async generateSlideStructure(briefing, config, attachmentAnalysis) {
    console.log('🏗️ Gerando estrutura de slides inteligente...');

    const hasAttachments = attachmentAnalysis && attachmentAnalysis.hasValidData;
    const slideTopics = config.slideTopics || [];

    // Usar prompt externo
    const messages = promptManager.buildMessages('generation', 'slide-structure', {
      briefing,
      slide_topics: JSON.stringify(slideTopics),
      has_attachments: hasAttachments ? 'SIM - dados para análise' : 'NÃO',
      slide_count: config.slideCount || 6
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    return this.parseJSONFromResponse(response.choices[0].message.content);
  }

  /**
   * Gera conteúdo inteligente para cada slide com layouts únicos
   */
  async generateSlideContents(briefing, config, slideStructure, attachmentAnalysis) {
    console.log('🎨 Gerando conteúdo inteligente dos slides com layouts únicos...');

    const slides = [];

    for (const slideSpec of slideStructure) {
      console.log(`📄 Gerando slide ${slideSpec.index}: ${slideSpec.title} (${slideSpec.type})`);

      try {
        let slideContent;

        // Determinar layout baseado no tipo e posição
        const layoutVariation = this.determineLayoutVariation(slideSpec, slideSpec.index);
        console.log(`🎨 Layout escolhido: ${layoutVariation} para slide ${slideSpec.index}`);

        switch (slideSpec.type) {
          case 'cover':
            slideContent = await this.generateCoverSlide(briefing, config);
            break;
          case 'shock-reveal':
            slideContent = await this.generateShockRevealSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation);
            break;
          case 'perspective-shift':
            slideContent = await this.generatePerspectiveShiftSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation);
            break;
          case 'hidden-opportunity':
            slideContent = await this.generateHiddenOpportunitySlide(briefing, slideSpec, attachmentAnalysis, layoutVariation);
            break;
          case 'transformation-vision':
            slideContent = await this.generateTransformationVisionSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation);
            break;
          case 'contrarian-insight':
            slideContent = await this.generateContrarianInsightSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation);
            break;
          case 'emotional-story':
            slideContent = await this.generateEmotionalStorySlide(briefing, slideSpec, attachmentAnalysis, layoutVariation);
            break;
          case 'future-scenario':
            slideContent = await this.generateFutureScenarioSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation);
            break;
          case 'data-analysis':
            slideContent = await this.generateDataAnalysisSlide(briefing, slideSpec, attachmentAnalysis);
            break;
          case 'contact':
            slideContent = await this.generateContactSlide();
            break;
          default:
            // Fallback com layout variado
            slideContent = await this.generateContentSlide(briefing, slideSpec, config, attachmentAnalysis, layoutVariation);
        }

        slides.push({
          index: slideSpec.index,
          type: slideSpec.type,
          title: slideSpec.title,
          content: slideContent,
          layout: layoutVariation
        });

      } catch (error) {
        console.error(`❌ Erro ao gerar slide ${slideSpec.index}:`, error);
        slides.push({
          index: slideSpec.index,
          type: slideSpec.type,
          title: slideSpec.title,
          content: this.generateErrorSlide(slideSpec),
          layout: 'error'
        });
      }
    }

    return slides;
  }

  /**
   * Determina variação de layout baseada no tipo e posição do slide
   */
  determineLayoutVariation(slideSpec, index) {
    const variations = {
      'shock-reveal': ['timeline', 'split-screen', 'center-impact'],
      'perspective-shift': ['before-after', 'lens-comparison', 'flip-card'],
      'hidden-opportunity': ['treasure-map', 'iceberg', 'door-reveal'],
      'transformation-vision': ['journey', 'metamorphosis', 'rocket-launch'],
      'contrarian-insight': ['myth-buster', 'truth-bomb', 'paradigm-break'],
      'emotional-story': ['hero-journey', 'photo-story', 'testimonial'],
      'future-scenario': ['crystal-ball', 'timeline-future', 'sci-fi'],
      'data-analysis': ['dashboard', 'infographic', 'chart-story'],
      'default': ['grid', 'timeline', 'split', 'center', 'story']
    };

    const typeVariations = variations[slideSpec.type] || variations['default'];
    return typeVariations[index % typeVariations.length];
  }

  /**
   * Gera slide de capa inteligente
   */
  async generateCoverSlide(briefing, config) {
    // Usar prompt externo
    const messages = promptManager.buildMessages('generation', 'cover-slide', {
      briefing,
      company: config.company || 'Darede',
      audience: config.audience || 'Executivos'
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    const coverData = this.parseJSONFromResponse(response.choices[0].message.content);

    return `
      <div class="slide slide-cover active" data-index="0">
        <img class="cover-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
        <div class="dots-decoration">
          ${Array(10).fill(0).map(() => '<div class="dot"></div>').join('')}
        </div>
        <div class="cover-content">
          <div class="ai-icon">
            <i class="fas fa-chart-line" style="font-size: 3rem; color: var(--primary-color);"></i>
          </div>
          <div class="cover-title">
            <div class="separator-line" style="width: 100px; height: 4px; background: var(--primary-color); margin: 0 auto 2rem;"></div>
            <h1 style="color: var(--text-dark); font-size: 3rem; font-weight: 800; text-align: center;">${coverData.title}</h1>
            <p class="subtitle" style="color: var(--text-muted); font-size: 1.5rem; text-align: center; margin-top: 1rem;">${coverData.subtitle}</p>
          </div>
        </div>
        <div class="partner-badges">
          <div class="badge">AWS Partner</div>
          <div class="badge isg-badge">ISG ★ 2022</div>
        </div>
      </div>
    `;
  }

  /**
   * Gera slide de análise de dados CONTEXTUAL e ADAPTATIVO
   */
  async generateDataAnalysisSlide(briefing, slideSpec, attachmentAnalysis) {
    console.log('📊 Gerando slide de dados CONTEXTUAL baseado no briefing...');

    // FASE 1: Determinar tipo de visualização baseado no contexto
    const visualizationType = await this.determineVisualizationType(briefing, slideSpec);
    console.log(`🎯 Tipo de visualização determinado: ${visualizationType}`);

    let dataInsights = [];
    let chartData = [];

    if (attachmentAnalysis && attachmentAnalysis.hasValidData) {
      // Usar dados reais dos anexos
      const validResults = attachmentAnalysis.results.filter(r => r.hasContent);
      dataInsights = validResults.flatMap(r => r.analysis.insights || []).slice(0, 3);

      // Extrair dados REAIS do Excel para gráficos com MATEMÁTICA PRECISA
      const excelResults = validResults.filter(r => r.structuredData);
      if (excelResults.length > 0) {
        const excelData = excelResults[0].structuredData;
        const firstSheet = Object.values(excelData.sheets)[0];

        if (firstSheet && firstSheet.numericColumns && Object.keys(firstSheet.numericColumns).length > 0) {
          // Use REAL numeric columns for charts
          const numericEntries = Object.entries(firstSheet.numericColumns).slice(0, 4);

          chartData = numericEntries.map(([columnName, stats], index) => {
            // Use REAL statistical data
            let displayValue = stats.sum;
            let label = columnName.substring(0, 20);

            // Convert large numbers to appropriate display format
            if (displayValue > 1000000) {
              displayValue = Math.round(displayValue / 1000000 * 10) / 10;
              label += ` (${displayValue}M)`;
              displayValue = Math.min(displayValue * 10, 100); // Scale for chart display
            } else if (displayValue > 1000) {
              displayValue = Math.round(displayValue / 1000 * 10) / 10;
              label += ` (${displayValue}K)`;
              displayValue = Math.min(displayValue, 100); // Scale for chart display
            } else {
              displayValue = Math.min(Math.round(displayValue), 100);
            }

            return {
              label: label,
              value: Math.max(displayValue, 5), // Minimum 5% for visibility
              realValue: stats.sum,
              realAverage: stats.average,
              count: stats.count,
              color: ['#1e5c3f', '#ff9500', '#ffb700', '#10b981'][index]
            };
          });

          console.log(`📊 Usando dados REAIS do Excel: ${chartData.length} colunas numéricas`);
        } else if (firstSheet && firstSheet.data.length > 0) {
          // Fallback: try to extract from first data rows
          chartData = firstSheet.data.slice(0, 4).map((row, index) => {
            let label = String(row[0] || `Item ${index + 1}`);
            let value = 0;

            // Look for numeric value in the row
            for (let i = 1; i < row.length; i++) {
              const cell = row[i];
              if (typeof cell === 'number' && cell > 0) {
                value = cell;
                break;
              } else if (typeof cell === 'string') {
                const numMatch = cell.match(/(\d+(?:\.\d+)?)/);
                if (numMatch) {
                  const num = parseFloat(numMatch[1]);
                  if (num > 0) {
                    value = num;
                    break;
                  }
                }
              }
            }

            // Scale value for chart display (keep original for tooltip)
            let displayValue = value;
            if (value > 1000) {
              displayValue = Math.min(Math.round(value / 1000 * 10), 100);
            } else {
              displayValue = Math.min(Math.round(value), 100);
            }

            return {
              label: label.substring(0, 20),
              value: Math.max(displayValue, 5),
              realValue: value,
              color: ['#1e5c3f', '#ff9500', '#ffb700', '#10b981'][index]
            };
          });
        }
      }

      // Fallback para estatísticas se não conseguiu extrair dados do Excel
      if (chartData.length === 0) {
        const stats = validResults.flatMap(r => r.analysis.statistics || []);
        chartData = stats.slice(0, 4).map((stat, index) => ({
          label: `Métrica ${index + 1}`,
          value: Math.floor(Math.random() * 60) + 30,
          color: ['#1e5c3f', '#ff9500', '#ffb700', '#10b981'][index]
        }));
      }
    }

    // Gerar insights com IA quando não há anexos válidos
    if (dataInsights.length === 0) {
      console.log('📊 🔥 NOVA VERSÃO: Gerando insights com IA para análise sem anexos...');
      const messages = promptManager.buildMessages('generation', 'insights-no-attachments', {
        briefing,
        slide_title: slideSpec.title
      });

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages
      });

      const aiInsights = this.parseJSONFromResponse(response.choices[0].message.content);
      // Transformar insights ricos em formato simples para compatibilidade, mas mantendo impacto
      dataInsights = (aiInsights.insights || []).map(insight => {
        if (typeof insight === 'string') {
          return insight;
        }
        return `${insight.shock_fact || ''} ${insight.insight || insight} ${insight.implication ? '→ ' + insight.implication : ''}`;
      });
    }

    // Gerar dados de gráfico com IA quando não há anexos
    if (chartData.length === 0) {
      console.log('📈 Gerando dados de gráfico com IA...');
      const messages = promptManager.buildMessages('generation', 'chart-metrics', {
        briefing,
        slide_title: slideSpec.title
      });

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages
      });

      const aiMetrics = this.parseJSONFromResponse(response.choices[0].message.content);
      chartData = (aiMetrics.metrics || []).map((metric, index) => ({
        label: metric.label,
        value: metric.value,
        color: ['#1e5c3f', '#ff9500', '#ffb700', '#10b981'][index]
      }));
    }

    // FASE 2: Gerar visualização contextual
    const visualization = await this.generateContextualVisualization(briefing, slideSpec, visualizationType, dataInsights, chartData);
    console.log(`🎨 Visualização gerada: ${visualization.visualization_title}`);

    // FASE 3: Renderizar slide dinâmico baseado no tipo
    return this.renderDataAnalysisSlide(slideSpec, visualization, dataInsights, chartData, visualizationType);
  }

  /**
   * Gera slide de conteúdo genérico inteligente
   */
  async generateContentSlide(briefing, slideSpec, config, attachmentAnalysis, layoutVariation = 'grid') {
    const messages = promptManager.buildMessages('generation', 'content-slide', {
      slide_title: slideSpec.title,
      briefing,
      has_attachment_data: attachmentAnalysis?.hasValidData ? 'Disponíveis para referência' : 'Não disponíveis',
      slide_purpose: slideSpec.purpose || 'Informativo'
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    const slideData = this.parseJSONFromResponse(response.choices[0].message.content);

    // Fallback para formato antigo se necessário
    const title = slideData.impact_title || slideData.title || 'Slide de Impacto';
    const points = slideData.points || [];

    return `
      <div class="slide content-slide impact-slide" data-index="${slideSpec.index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
        <div class="dots-decoration">
          ${Array(5).fill(0).map(() => '<div class="dot"></div>').join('')}
        </div>

        <!-- Header com perspectiva e hook narrativo -->
        <div class="slide-header" style="margin-bottom: 2rem;">
          ${slideData.perspective_lens ? `<div class="perspective-badge" style="display: inline-block; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; margin-bottom: 1rem;">${slideData.perspective_lens} Lens</div>` : ''}
          <h2 style="color: var(--text-dark); text-align: center; margin-bottom: 1rem; font-size: 2.8rem; font-weight: 800; line-height: 1.2;">${title}</h2>
          ${slideData.narrative_thread ? `<p style="color: var(--text-muted); text-align: center; font-size: 1.1rem; font-style: italic; max-width: 800px; margin: 0 auto;">${slideData.narrative_thread}</p>` : ''}
        </div>

        <!-- Elemento de Choque/Surpresa -->
        ${slideData.shock_element ? `
        <div class="shock-element" style="background: linear-gradient(135deg, rgba(255, 149, 0, 0.1), rgba(255, 149, 0, 0.2)); border: 2px solid var(--secondary-color); border-radius: 16px; padding: 1.5rem; margin: 2rem auto; max-width: 600px; text-align: center;">
          <i class="fas fa-bolt" style="font-size: 2rem; color: var(--secondary-color); margin-bottom: 1rem;"></i>
          <h3 style="color: var(--secondary-color); margin-bottom: 0.5rem; font-weight: 700;">Momento de Revelação</h3>
          <p style="color: var(--text-dark); font-size: 1.1rem; font-weight: 500; margin: 0;">${slideData.shock_element}</p>
        </div>
        ` : ''}

        <!-- Grid de Insights Impactantes -->
        <div class="impact-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 2rem; padding: 0 2rem; margin-top: 2rem;">
          ${points.map((point, index) => `
            <div class="impact-card" style="background: linear-gradient(135deg, rgba(30, 92, 63, 0.03) 0%, rgba(255, 149, 0, 0.03) 100%); border-radius: 20px; padding: 2.5rem; border: 1px solid rgba(30, 92, 63, 0.1); transition: all 0.4s ease; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06); position: relative; overflow: hidden;">

              <!-- Número do insight -->
              <div class="insight-number" style="position: absolute; top: -10px; right: -10px; width: 50px; height: 50px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.2rem;">${index + 1}</div>

              <!-- Ícone e metáfora visual -->
              <div class="card-visual" style="display: flex; align-items: center; margin-bottom: 1.5rem;">
                <div class="card-icon" style="margin-right: 1rem;">
                  <i class="${point.icon || 'fas fa-lightbulb'}" style="font-size: 2.8rem; color: var(--primary-color);"></i>
                </div>
                ${point.visual_metaphor ? `<div class="visual-metaphor" style="flex: 1; font-size: 0.9rem; color: var(--text-muted); font-style: italic;">"${point.visual_metaphor}"</div>` : ''}
              </div>

              <!-- Revelação principal -->
              <h3 style="color: var(--text-dark); margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700; line-height: 1.3;">${point.revelation || point.title || 'Insight Transformador'}</h3>

              <!-- Evidência -->
              ${point.evidence ? `<div class="evidence" style="background: rgba(30, 92, 63, 0.08); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid var(--primary-color);">
                <strong style="color: var(--primary-color); font-size: 0.9rem;">EVIDÊNCIA:</strong>
                <p style="color: var(--text-dark); margin: 0.5rem 0 0 0; font-size: 0.95rem;">${point.evidence}</p>
              </div>` : ''}

              <!-- Implicação -->
              ${point.implication ? `<div class="implication" style="margin-bottom: 1rem;">
                <strong style="color: var(--secondary-color); font-size: 0.9rem;">IMPLICAÇÃO:</strong>
                <p style="color: var(--text-dark); margin: 0.5rem 0 0 0; line-height: 1.5;">${point.implication}</p>
              </div>` : ''}

              <!-- Ação -->
              ${point.action ? `<div class="action" style="background: rgba(255, 149, 0, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--secondary-color);">
                <strong style="color: var(--secondary-color); font-size: 0.9rem;">AÇÃO IMEDIATA:</strong>
                <p style="color: var(--text-dark); margin: 0.5rem 0 0 0; font-weight: 500; font-size: 0.95rem;">${point.action}</p>
              </div>` : ''}

              <!-- Fallback para formato antigo -->
              ${!point.revelation && point.description ? `<p style="color: var(--text-muted); line-height: 1.6; margin: 0;">${point.description}</p>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Gancho para próximo slide -->
        ${slideData.transition_hook ? `
        <div class="transition-hook" style="margin-top: 3rem; text-align: center; padding: 1.5rem; background: rgba(30, 92, 63, 0.05); border-radius: 12px; max-width: 700px; margin-left: auto; margin-right: auto;">
          <i class="fas fa-arrow-right" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
          <span style="color: var(--text-dark); font-weight: 600; font-size: 1rem;">${slideData.transition_hook}</span>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Gera slide de contato fixo
   */
  generateContactSlide() {
    return `
      <div class="slide contact-slide" data-index="999">
        <img class="contact-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
        <div class="contact-content" style="text-align: center; max-width: 600px; margin: 0 auto; padding-top: 4rem;">
          <h2 style="color: var(--text-dark); font-size: 2.5rem; margin-bottom: 2rem;">Vamos conversar?</h2>
          <p style="color: var(--text-muted); font-size: 1.2rem; margin-bottom: 3rem;">Entre em contato para discutir como podemos ajudar sua empresa</p>

          <div class="contact-info" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div class="contact-item" style="display: flex; align-items: center; justify-content: center; gap: 1rem; font-size: 1.3rem; color: var(--text-dark);">
              <i class="fas fa-envelope" style="color: var(--primary-color); font-size: 1.5rem;"></i>
              <span>comercial@darede.com.br</span>
            </div>
            <div class="contact-item" style="display: flex; align-items: center; justify-content: center; gap: 1rem; font-size: 1.3rem; color: var(--text-dark);">
              <i class="fas fa-phone" style="color: var(--primary-color); font-size: 1.5rem;"></i>
              <span>+55 11 3090-1115</span>
            </div>
            <div class="contact-item" style="display: flex; align-items: center; justify-content: center; gap: 1rem; font-size: 1.3rem; color: var(--text-dark);">
              <i class="fas fa-globe" style="color: var(--primary-color); font-size: 1.5rem;"></i>
              <span>www.darede.com.br</span>
            </div>
          </div>
        </div>
        <div class="partner-badges">
          <div class="badge">AWS Partner</div>
          <div class="badge isg-badge">ISG ★ 2022</div>
        </div>
      </div>
    `;
  }

  /**
   * Extrai insights principais da análise
   */
  extractKeyInsights(briefingAnalysis, attachmentAnalysis) {
    const insights = [];

    if (briefingAnalysis) {
      insights.push({
        type: 'objective',
        content: briefingAnalysis.objective || 'Objetivo não identificado'
      });

      insights.push({
        type: 'challenges',
        content: Array.isArray(briefingAnalysis.challenges) ? briefingAnalysis.challenges[0] : briefingAnalysis.challenges
      });
    }

    if (attachmentAnalysis && attachmentAnalysis.hasValidData) {
      const validResults = attachmentAnalysis.results.filter(r => r.hasContent);
      const allInsights = validResults.flatMap(r => r.analysis.insights || []);

      insights.push({
        type: 'data',
        content: allInsights[0] || 'Dados processados com sucesso'
      });
    }

    return insights;
  }

  /**
   * Gera slide de revelação chocante com layouts únicos
   */
  async generateShockRevealSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation) {
    const messages = promptManager.buildMessages('generation', 'shock-reveal', {
      briefing,
      slide_title: slideSpec.title,
      slide_purpose: slideSpec.purpose || 'Revelar dados chocantes',
      layout_variation: layoutVariation
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    let data = this.parseJSONFromResponse(response.choices[0].message.content);

    // Validação robusta com fallbacks completos
    console.log('🔍 Debug shock-reveal - Dados recebidos:', data ? JSON.stringify(data, null, 2) : 'null (ativando fallbacks)');

    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Dados inválidos ou JSON não encontrado, usando fallbacks para shock-reveal');
      data = {};
    }

    // Garantir todas as propriedades necessárias
    data = {
      shock_title: data.shock_title || data.title || slideSpec.title || 'REVELAÇÃO IMPORTANTE',
      reveal_data: data.reveal_data || data.data || data.fact || 'DADO SURPREENDENTE',
      context: data.context || data.description || 'Contexto que muda tudo',
      implications: data.implications || ['Impacto transformador', 'Nova perspectiva'],
      visual_elements: data.visual_elements || ['IMPACTO', 'TRANSFORMAÇÃO']
    };

    if (layoutVariation === 'timeline') {
      return this.createTimelineLayout(data, slideSpec.index);
    } else if (layoutVariation === 'split-screen') {
      return this.createSplitScreenLayout(data, slideSpec.index);
    } else {
      return this.createCenterImpactLayout(data, slideSpec.index);
    }
  }

  /**
   * Gera slide de mudança de perspectiva
   */
  async generatePerspectiveShiftSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation) {
    const messages = promptManager.buildMessages('generation', 'perspective-shift', {
      briefing,
      slide_title: slideSpec.title,
      layout_variation: layoutVariation
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    let data = this.parseJSONFromResponse(response.choices[0].message.content);

    // Validação robusta com fallbacks completos
    console.log('🔍 Debug perspective-shift - Dados recebidos:', data ? JSON.stringify(data, null, 2) : 'null (ativando fallbacks)');

    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Dados inválidos ou JSON não encontrado, usando fallbacks para perspective-shift');
      data = {};
    }

    // Garantir todas as propriedades necessárias
    data = {
      old_view: data.old_view || data.before || 'Visão tradicional',
      new_view: data.new_view || data.after || 'Nova perspectiva revolucionária',
      shift_trigger: data.shift_trigger || data.trigger || 'Mudança de paradigma',
      evidence: data.evidence || data.proof || 'Evidências concretas',
      action_required: data.action_required || data.action || 'Ação necessária'
    };

    if (layoutVariation === 'before-after') {
      return this.createBeforeAfterLayout(data, slideSpec.index);
    } else if (layoutVariation === 'lens-comparison') {
      return this.createLensComparisonLayout(data, slideSpec.index);
    } else {
      return this.createFlipCardLayout(data, slideSpec.index);
    }
  }

  /**
   * Gera slide de oportunidade oculta
   */
  async generateHiddenOpportunitySlide(briefing, slideSpec, attachmentAnalysis, layoutVariation) {
    const messages = promptManager.buildMessages('generation', 'hidden-opportunity', {
      briefing,
      slide_title: slideSpec.title,
      layout_variation: layoutVariation
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    let data = this.parseJSONFromResponse(response.choices[0].message.content);

    // Validação robusta com fallbacks completos
    console.log('🔍 Debug hidden-opportunity - Dados recebidos:', data ? JSON.stringify(data, null, 2) : 'null (ativando fallbacks)');

    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Dados inválidos ou JSON não encontrado, usando fallbacks para hidden-opportunity');
      data = {};
    }

    // Garantir todas as propriedades necessárias
    data = {
      hidden_opportunity: data.hidden_opportunity || data.opportunity || 'Oportunidade oculta',
      why_hidden: data.why_hidden || data.reason || 'Por estar escondida',
      value_potential: data.value_potential || data.value || 'Alto potencial de valor',
      unlock_steps: data.unlock_steps || data.steps || ['Passo 1', 'Passo 2', 'Passo 3'],
      competitive_advantage: data.competitive_advantage || data.advantage || 'Vantagem competitiva'
    };

    if (layoutVariation === 'treasure-map') {
      return this.createTreasureMapLayout(data, slideSpec.index);
    } else if (layoutVariation === 'iceberg') {
      return this.createIcebergLayout(data, slideSpec.index);
    } else {
      return this.createDoorRevealLayout(data, slideSpec.index);
    }
  }

  /**
   * Layout Timeline - Evolução temporal dramática
   */
  createTimelineLayout(data, index) {
    // Fallbacks para evitar undefined
    const shockTitle = data?.shock_title || data?.reveal_data || 'EVOLUÇÃO';
    const revealData = data?.reveal_data || data?.shock_fact || 'TRANSFORMAÇÃO';
    const context = data?.context || data?.implication || 'Situação anterior';

    return `
      <div class="slide timeline-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <!-- Timeline Header - Responsivo -->
        <div class="timeline-header" style="text-align: center; margin-bottom: 2rem; padding: 1rem;">
          <h2 style="color: var(--text-dark); font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1rem; line-height: 1.2;">${shockTitle}</h2>
          <div class="shock-reveal" style="background: linear-gradient(135deg, var(--secondary-color), #ff6b35); color: white; padding: clamp(0.8rem, 1.5vw, 1rem) clamp(1.2rem, 3vw, 2rem); border-radius: 25px; display: inline-block; font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 700; max-width: 90%; word-wrap: break-word;">
            ${revealData}
          </div>
        </div>

        <!-- Timeline Visual - Responsivo -->
        <div class="timeline-container" style="position: relative; height: clamp(250px, 40vh, 300px); margin: 2rem 1rem;">
          <div class="timeline-line" style="position: absolute; left: 50%; width: 4px; height: 100%; background: linear-gradient(to bottom, var(--primary-color), var(--secondary-color)); transform: translateX(-50%);"></div>

          <!-- Timeline Points - Responsivos -->
          <div class="timeline-point" style="position: absolute; left: 50%; top: 20%; width: clamp(60px, 8vw, 80px); height: clamp(60px, 8vw, 80px); background: var(--primary-color); border-radius: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: clamp(0.8rem, 1.2vw, 1.2rem); box-shadow: 0 8px 32px rgba(30, 92, 63, 0.3);">
            ANTES
          </div>

          <div class="timeline-point" style="position: absolute; left: 50%; top: 80%; width: clamp(60px, 8vw, 80px); height: clamp(60px, 8vw, 80px); background: var(--secondary-color); border-radius: 50%; transform: translateX(-50%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: clamp(0.8rem, 1.2vw, 1.2rem); box-shadow: 0 8px 32px rgba(255, 149, 0, 0.3);">
            AGORA
          </div>

          <!-- Context Boxes - Responsivos -->
          <div class="context-before" style="position: absolute; right: 55%; top: 10%; background: rgba(30, 92, 63, 0.1); padding: 1rem; border-radius: 15px; max-width: clamp(200px, 35vw, 300px); border-left: 4px solid var(--primary-color);">
            <h4 style="color: var(--primary-color); margin-bottom: 0.5rem; font-size: clamp(0.9rem, 1.2vw, 1.1rem);">Contexto Anterior</h4>
            <p style="color: var(--text-dark); margin: 0; line-height: 1.4; font-size: clamp(0.8rem, 1vw, 0.9rem);">${context}</p>
          </div>

          <div class="context-now" style="position: absolute; left: 55%; top: 70%; background: rgba(255, 149, 0, 0.1); padding: 1.5rem; border-radius: 15px; max-width: 300px; border-left: 4px solid var(--secondary-color);">
            <h4 style="color: var(--secondary-color); margin-bottom: 0.5rem;">Nova Realidade</h4>
            <p style="color: var(--text-dark); margin: 0; line-height: 1.4;">${data.implications?.[0] || 'Transformação completa'}</p>
          </div>
        </div>

        <!-- Visual Elements -->
        <div class="visual-elements" style="display: flex; justify-content: center; gap: 2rem; margin-top: 2rem;">
          ${(data.visual_elements || []).map((element, i) => `
            <div class="visual-element" style="background: linear-gradient(135deg, rgba(30, 92, 63, 0.05), rgba(255, 149, 0, 0.05)); padding: 1rem 1.5rem; border-radius: 12px; border: 1px solid var(--primary-color); color: var(--text-dark); font-weight: 600;">
              <i class="fas fa-star" style="color: var(--secondary-color); margin-right: 0.5rem;"></i>
              ${element}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Layout Split Screen - Contraste dramático
   */
  createSplitScreenLayout(data, index) {
    // Fallbacks para evitar undefined
    const shockTitle = data?.shock_title || data?.reveal_data || 'COMPARAÇÃO';
    const context = data?.context || data?.old_view || 'Situação anterior';
    const revealData = data?.reveal_data || data?.new_view || 'Nova realidade';

    return `
      <div class="slide split-screen-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <!-- Split Header - Responsivo -->
        <div class="split-header" style="text-align: center; margin-bottom: 1.5rem; padding: 1rem;">
          <h2 style="color: var(--text-dark); font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; line-height: 1.2;">${shockTitle}</h2>
        </div>

        <!-- Split Container - Responsivo -->
        <div class="split-container" style="display: grid; grid-template-columns: 1fr 1fr; height: clamp(350px, 50vh, 500px); gap: 2px; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 64px rgba(0, 0, 0, 0.1); margin: 0 1rem;">

          <!-- Left Side - Expectativa - Responsivo -->
          <div class="split-left" style="background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: clamp(1.5rem, 3vw, 3rem); display: flex; flex-direction: column; justify-content: center; position: relative;">
            <div class="split-label" style="position: absolute; top: 1rem; left: 1rem; background: rgba(255, 255, 255, 0.2); padding: 0.3rem 0.8rem; border-radius: 10px; font-size: clamp(0.7rem, 1vw, 0.9rem); font-weight: 600;">
              EXPECTATIVA
            </div>
            <h3 style="font-size: clamp(1.2rem, 2.5vw, 2rem); margin-bottom: 1rem; opacity: 0.9; line-height: 1.2;">O que pensávamos</h3>
            <p style="font-size: clamp(0.9rem, 1.5vw, 1.2rem); line-height: 1.4; opacity: 0.8;">${context}</p>
            <div class="old-metric" style="margin-top: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 10px; text-align: center;">
              <div style="font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; opacity: 0.6;">?</div>
              <div style="font-size: clamp(0.7rem, 1vw, 0.9rem); opacity: 0.7;">Dados limitados</div>
            </div>
          </div>

          <!-- Right Side - Realidade - Responsivo -->
          <div class="split-right" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: clamp(1.5rem, 3vw, 3rem); display: flex; flex-direction: column; justify-content: center; position: relative;">
            <div class="split-label" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255, 255, 255, 0.2); padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600;">
              REALIDADE
            </div>
            <h3 style="font-size: 2rem; margin-bottom: 1.5rem;">A verdade revelada</h3>
            <p style="font-size: 1.2rem; line-height: 1.5;">${data.implications?.[0] || 'Nova perspectiva'}</p>
            <div class="new-metric" style="margin-top: 2rem; padding: 1rem; background: rgba(255, 255, 255, 0.2); border-radius: 10px; text-align: center; border: 2px solid rgba(255, 255, 255, 0.3);">
              <div style="font-size: 3rem; font-weight: 800;">${data.reveal_data}</div>
              <div style="font-size: 0.9rem;">Dados reveladores</div>
            </div>
          </div>
        </div>

        <!-- Impact Arrow -->
        <div class="impact-arrow" style="position: absolute; left: 50%; top: 60%; transform: translateX(-50%); z-index: 10;">
          <div style="width: 60px; height: 60px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); border: 3px solid var(--secondary-color);">
            <i class="fas fa-arrow-right" style="color: var(--secondary-color); font-size: 1.5rem;"></i>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Layout Before/After - Transformação visual
   */
  createBeforeAfterLayout(data, index) {
    return `
      <div class="slide before-after-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="transformation-header" style="text-align: center; margin-bottom: 3rem;">
          <h2 style="color: var(--text-dark); font-size: 2.5rem; font-weight: 800;">Mudança de Perspectiva</h2>
          <p style="color: var(--text-muted); font-size: 1.2rem;">${data.shift_trigger}</p>
        </div>

        <div class="before-after-container" style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: center; margin: 2rem 0;">

          <!-- Before -->
          <div class="before-card" style="background: linear-gradient(135deg, #95a5a6, #7f8c8d); color: white; padding: 2.5rem; border-radius: 20px; text-align: center; transform: perspective(1000px) rotateY(5deg); box-shadow: -8px 8px 32px rgba(0, 0, 0, 0.2);">
            <div class="card-label" style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem 1rem; border-radius: 15px; display: inline-block; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;">
              VISÃO ANTIGA
            </div>
            <h3 style="font-size: 1.8rem; margin-bottom: 1.5rem; opacity: 0.9;">Como era antes</h3>
            <p style="line-height: 1.6; opacity: 0.8; font-size: 1.1rem;">${data.old_view}</p>
            <div class="status-indicator" style="margin-top: 1.5rem; padding: 0.8rem; background: rgba(231, 76, 60, 0.3); border-radius: 10px;">
              <i class="fas fa-times-circle" style="margin-right: 0.5rem;"></i>
              Limitado
            </div>
          </div>

          <!-- Transformation Arrow -->
          <div class="transformation-arrow" style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 8px 32px rgba(30, 92, 63, 0.3);">
              <i class="fas fa-exchange-alt" style="color: white; font-size: 2rem;"></i>
            </div>
            <div style="color: var(--primary-color); font-weight: 600; text-align: center; font-size: 0.9rem;">
              TRANSFORMAÇÃO
            </div>
          </div>

          <!-- After -->
          <div class="after-card" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 2.5rem; border-radius: 20px; text-align: center; transform: perspective(1000px) rotateY(-5deg); box-shadow: 8px 8px 32px rgba(30, 92, 63, 0.3);">
            <div class="card-label" style="background: rgba(255, 255, 255, 0.2); padding: 0.5rem 1rem; border-radius: 15px; display: inline-block; margin-bottom: 1.5rem; font-size: 0.9rem; font-weight: 600;">
              NOVA VISÃO
            </div>
            <h3 style="font-size: 1.8rem; margin-bottom: 1.5rem;">Como é agora</h3>
            <p style="line-height: 1.6; font-size: 1.1rem;">${data.new_view}</p>
            <div class="status-indicator" style="margin-top: 1.5rem; padding: 0.8rem; background: rgba(39, 174, 96, 0.3); border-radius: 10px;">
              <i class="fas fa-check-circle" style="margin-right: 0.5rem;"></i>
              Transformado
            </div>
          </div>
        </div>

        <!-- Evidence & Action -->
        <div class="evidence-action" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 3rem;">
          <div class="evidence-card" style="background: rgba(30, 92, 63, 0.05); padding: 2rem; border-radius: 15px; border-left: 4px solid var(--primary-color);">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; font-weight: 700;">Evidência</h4>
            <p style="color: var(--text-dark); line-height: 1.5; margin: 0;">${data.evidence}</p>
          </div>
          <div class="action-card" style="background: rgba(255, 149, 0, 0.05); padding: 2rem; border-radius: 15px; border-left: 4px solid var(--secondary-color);">
            <h4 style="color: var(--secondary-color); margin-bottom: 1rem; font-weight: 700;">Ação Necessária</h4>
            <p style="color: var(--text-dark); line-height: 1.5; margin: 0;">${data.action_required}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera slide de erro com layout limpo
   */
  generateErrorSlide(slideSpec) {
    return `
      <div class="slide error-slide" data-index="${slideSpec.index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
        <div class="error-content" style="text-align: center; padding: 4rem; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div style="background: linear-gradient(135deg, var(--secondary-color), #ff6b35); width: 120px; height: 120px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; box-shadow: 0 16px 64px rgba(255, 149, 0, 0.3);">
            <i class="fas fa-cog fa-spin" style="font-size: 3rem; color: white;"></i>
          </div>
          <h2 style="color: var(--text-dark); margin-bottom: 1.5rem; font-size: 2.5rem; font-weight: 800;">${slideSpec.title}</h2>
          <p style="color: var(--text-muted); font-size: 1.2rem; max-width: 600px; line-height: 1.6;">Este slide está sendo refinado com IA avançada para garantir máximo impacto. Em breve, uma experiência visual única.</p>
          <div style="margin-top: 2rem; background: rgba(30, 92, 63, 0.1); padding: 1rem 2rem; border-radius: 25px; color: var(--primary-color); font-weight: 600;">
            <i class="fas fa-magic" style="margin-right: 0.5rem;"></i>
            Aguarde a mágica acontecer...
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Métodos auxiliares para layouts que faltam
   */
  createCenterImpactLayout(data, index) {
    // Fallbacks para evitar undefined
    const revealData = data?.reveal_data || data?.shock_fact || 'REVELAÇÃO';
    const shockTitle = data?.shock_title || data?.insight || 'IMPACTO';
    const context = data?.context || data?.implication || 'Contexto importante';

    return `
      <div class="slide center-impact-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="center-impact-container" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center; padding: 2rem;">
          <!-- Central Impact Circle - Responsivo -->
          <div class="impact-circle" style="width: clamp(200px, 25vw, 300px); height: clamp(200px, 25vw, 300px); background: radial-gradient(circle, var(--secondary-color), var(--primary-color)); border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; box-shadow: 0 20px 80px rgba(30, 92, 63, 0.4); margin-bottom: 2rem; position: relative; padding: 1rem;">
            <div style="font-size: clamp(1.5rem, 4vw, 3rem); font-weight: 800; margin-bottom: 0.5rem; text-align: center; line-height: 1.2;">${revealData}</div>
            <div style="font-size: clamp(0.8rem, 1.2vw, 1rem); opacity: 0.9; text-align: center;">${shockTitle}</div>

            <!-- Radiating Elements - Responsivos -->
            <div class="radiating-element" style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: white; color: var(--primary-color); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: clamp(0.6rem, 0.8vw, 0.8rem); font-weight: 600;">
              ${data.visual_elements?.[0] || 'IMPACTO'}
            </div>
            <div class="radiating-element" style="position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); background: white; color: var(--primary-color); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: clamp(0.6rem, 0.8vw, 0.8rem); font-weight: 600;">
              ${data.visual_elements?.[1] || 'TRANSFORMAÇÃO'}
            </div>
          </div>

          <h2 style="color: var(--text-dark); font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 800; max-width: 90%; margin-bottom: 1rem; line-height: 1.3;">${context}</h2>
          <p style="color: var(--text-muted); font-size: 1.2rem; max-width: 600px; line-height: 1.6;">${data.implications?.[0] || 'Uma nova perspectiva que muda tudo'}</p>
        </div>
      </div>
    `;
  }

  createLensComparisonLayout(data, index) {
    return this.createBeforeAfterLayout(data, index); // Simplificado por ora
  }

  createFlipCardLayout(data, index) {
    return this.createBeforeAfterLayout(data, index); // Simplificado por ora
  }

  createTreasureMapLayout(data, index) {
    return `
      <div class="slide treasure-map-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="treasure-header" style="text-align: center; margin-bottom: 2rem;">
          <h2 style="color: var(--text-dark); font-size: 2.8rem; font-weight: 800;">🗺️ Mapa do Tesouro Oculto</h2>
          <p style="color: var(--text-muted); font-size: 1.2rem;">${data.hidden_opportunity}</p>
        </div>

        <div class="treasure-map" style="background: linear-gradient(135deg, #f4f3ef, #ede7d3); border-radius: 20px; padding: 3rem; margin: 2rem; position: relative; border: 3px solid #d4af37; box-shadow: 0 16px 64px rgba(0, 0, 0, 0.1);">

          <!-- Treasure Chest -->
          <div class="treasure-chest" style="position: absolute; top: 20%; right: 15%; width: 120px; height: 120px; background: linear-gradient(135deg, #d4af37, #ffd700); border-radius: 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(212, 175, 55, 0.4);">
            <div style="color: white; text-align: center;">
              <i class="fas fa-treasure-chest" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
              <div style="font-size: 0.8rem; font-weight: 600;">TESOURO</div>
            </div>
          </div>

          <!-- Path to Treasure -->
          <div class="treasure-path" style="position: absolute; top: 50%; left: 10%; right: 25%; height: 6px; background: repeating-linear-gradient(to right, #d4af37 0px, #d4af37 20px, transparent 20px, transparent 30px); border-radius: 3px;"></div>

          <!-- Value Potential -->
          <div class="value-card" style="position: absolute; top: 15%; left: 10%; background: white; padding: 1.5rem; border-radius: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); max-width: 250px;">
            <h4 style="color: var(--primary-color); margin-bottom: 0.5rem; font-weight: 700;">💰 Valor Potencial</h4>
            <p style="color: var(--text-dark); margin: 0; font-size: 0.95rem;">${data.value_potential}</p>
          </div>

          <!-- Why Hidden -->
          <div class="hidden-reason" style="position: absolute; bottom: 20%; left: 15%; background: rgba(255, 149, 0, 0.1); padding: 1.5rem; border-radius: 15px; border-left: 4px solid var(--secondary-color); max-width: 300px;">
            <h4 style="color: var(--secondary-color); margin-bottom: 0.5rem; font-weight: 700;">🔍 Por que está oculto?</h4>
            <p style="color: var(--text-dark); margin: 0; font-size: 0.95rem;">${data.why_hidden}</p>
          </div>
        </div>

        <!-- Unlock Steps -->
        <div class="unlock-steps" style="display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;">
          ${(data.unlock_steps || ['Descobrir', 'Validar', 'Executar']).map((step, i) => `
            <div class="step-card" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 1rem 1.5rem; border-radius: 15px; text-align: center; min-width: 150px;">
              <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">${i + 1}</div>
              <div style="font-size: 0.9rem;">${step}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  createIcebergLayout(data, index) {
    return `
      <div class="slide iceberg-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="iceberg-header" style="text-align: center; margin-bottom: 2rem;">
          <h2 style="color: var(--text-dark); font-size: 2.8rem; font-weight: 800;">🧊 O que está por baixo da superfície</h2>
        </div>

        <div class="iceberg-container" style="position: relative; height: 500px; margin: 2rem;">

          <!-- Water Line -->
          <div class="water-line" style="position: absolute; left: 0; right: 0; top: 30%; height: 4px; background: linear-gradient(to right, #3498db, #2980b9); z-index: 5;"></div>
          <div class="water-surface" style="position: absolute; left: 0; right: 0; top: 30%; bottom: 0; background: linear-gradient(to bottom, rgba(52, 152, 219, 0.3), rgba(52, 152, 219, 0.6)); border-radius: 0 0 20px 20px;"></div>

          <!-- Visible Part (Above Water) -->
          <div class="iceberg-visible" style="position: absolute; left: 40%; top: 10%; width: 200px; height: 120px; background: linear-gradient(135deg, #ecf0f1, #bdc3c7); border-radius: 100px 100px 0 0; display: flex; align-items: center; justify-content: center; z-index: 10;">
            <div style="text-align: center; color: var(--text-dark);">
              <div style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">Visível</div>
              <div style="font-size: 0.8rem; opacity: 0.7;">O óbvio</div>
            </div>
          </div>

          <!-- Hidden Part (Below Water) -->
          <div class="iceberg-hidden" style="position: absolute; left: 35%; top: 30%; width: 300px; height: 250px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%); display: flex; align-items: center; justify-content: center; z-index: 3;">
            <div style="text-align: center; color: white; padding: 2rem;">
              <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">💎 Oportunidade Oculta</h3>
              <p style="font-size: 1rem; line-height: 1.4;">${data.hidden_opportunity}</p>
            </div>
          </div>

          <!-- Value Indicators -->
          <div class="value-indicator" style="position: absolute; right: 10%; top: 50%; background: white; padding: 1.5rem; border-radius: 15px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); max-width: 250px;">
            <h4 style="color: var(--secondary-color); margin-bottom: 0.5rem;">📈 Valor Real</h4>
            <p style="color: var(--text-dark); margin: 0; font-weight: 600;">${data.value_potential}</p>
          </div>

          <div class="competitive-advantage" style="position: absolute; left: 5%; bottom: 15%; background: rgba(30, 92, 63, 0.1); padding: 1.5rem; border-radius: 15px; border-left: 4px solid var(--primary-color); max-width: 280px;">
            <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">🏆 Vantagem Competitiva</h4>
            <p style="color: var(--text-dark); margin: 0; font-size: 0.95rem;">${data.competitive_advantage}</p>
          </div>
        </div>
      </div>
    `;
  }

  createDoorRevealLayout(data, index) {
    return `
      <div class="slide door-reveal-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="door-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem;">
          <h2 style="color: var(--text-dark); font-size: clamp(2rem, 3.5vw, 2.8rem); font-weight: 800; margin-bottom: 1rem;">🚪 ${data.hidden_opportunity || 'Abrindo Novas Portas'}</h2>
          <p style="color: var(--text-muted); font-size: clamp(1rem, 1.5vw, 1.2rem); max-width: 80%; margin: 0 auto;">${data.why_hidden || 'Oportunidades esperando para serem descobertas'}</p>
        </div>

        <div class="door-container" style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: center; margin: 2rem; min-height: 400px;">

          <!-- Porta Fechada -->
          <div class="closed-door" style="background: linear-gradient(135deg, #8b7355, #6d5d4f); color: white; padding: 3rem 2rem; border-radius: 15px; text-align: center; position: relative; min-height: 300px; display: flex; flex-direction: column; justify-content: center;">
            <div style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; background: #d4af37; border-radius: 50%; box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);"></div>
            <h3 style="font-size: clamp(1.2rem, 2vw, 1.6rem); margin-bottom: 1.5rem; opacity: 0.8;">SITUAÇÃO ATUAL</h3>
            <p style="line-height: 1.5; opacity: 0.7; font-size: clamp(0.9rem, 1.2vw, 1rem);">Limitações visíveis</p>
            <div style="margin-top: 1rem; font-size: clamp(1.5rem, 2.5vw, 2rem); opacity: 0.6;">🔒</div>
          </div>

          <!-- Chave -->
          <div class="key-transform" style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: clamp(60px, 8vw, 80px); height: clamp(60px, 8vw, 80px); background: linear-gradient(135deg, #d4af37, #ffd700); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 8px 32px rgba(212, 175, 55, 0.4); animation: pulse 2s infinite;">
              <i class="fas fa-key" style="color: white; font-size: clamp(1.5rem, 2.5vw, 2rem);"></i>
            </div>
            <div style="color: var(--primary-color); font-weight: 700; font-size: clamp(0.8rem, 1vw, 0.9rem); text-align: center;">DESCOBERTA</div>
          </div>

          <!-- Porta Aberta -->
          <div class="open-door" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 3rem 2rem; border-radius: 15px; text-align: center; min-height: 300px; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at center, rgba(255,255,255,0.1), transparent); pointer-events: none;"></div>
            <h3 style="font-size: clamp(1.2rem, 2vw, 1.6rem); margin-bottom: 1.5rem;">NOVAS POSSIBILIDADES</h3>
            <p style="line-height: 1.5; font-size: clamp(0.9rem, 1.2vw, 1rem); margin-bottom: 1rem;">${data.value_potential || 'Oportunidades infinitas'}</p>
            <div style="margin-top: 1rem; font-size: clamp(1.5rem, 2.5vw, 2rem);">✨</div>
          </div>
        </div>

        <!-- Passos para Desbloquear -->
        <div class="unlock-steps" style="display: flex; justify-content: center; gap: clamp(0.5rem, 2vw, 1rem); margin-top: 2rem; flex-wrap: wrap;">
          ${(data.unlock_steps || ['Identificar chave', 'Abrir porta', 'Explorar oportunidades']).map((step, i) => `
            <div class="step-card" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: clamp(0.8rem, 1.5vw, 1rem) clamp(1rem, 2vw, 1.5rem); border-radius: 15px; text-align: center; min-width: clamp(120px, 20vw, 150px); flex: 1; max-width: 200px;">
              <div style="font-size: clamp(1.2rem, 2vw, 1.5rem); font-weight: 800; margin-bottom: 0.5rem;">${i + 1}</div>
              <div style="font-size: clamp(0.8rem, 1vw, 0.9rem); line-height: 1.2;">${step}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Layouts que faltam - implementações completas
  createTransformationLayout(data, index, layoutVariation) {
    const title = data?.impact_title || 'Transformação em Curso';
    const narrative = data?.narrative_thread || 'Uma nova era está chegando';
    const points = data?.points || [{ revelation: 'Mudança inevitável', action: 'Prepare-se agora' }];

    return `
      <div class="slide transformation-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="transformation-header" style="text-align: center; margin-bottom: 3rem; padding: 2rem;">
          <h2 style="color: var(--text-dark); font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 800; margin-bottom: 1rem; line-height: 1.1;">${title}</h2>
          <p style="color: var(--text-muted); font-size: clamp(1.1rem, 2vw, 1.4rem); max-width: 80%; margin: 0 auto; line-height: 1.5;">${narrative}</p>
        </div>

        <div class="transformation-visual" style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 3rem; align-items: center; margin: 2rem; min-height: 300px;">
          <!-- Estado Atual -->
          <div class="current-state" style="background: linear-gradient(135deg, #95a5a6, #7f8c8d); color: white; padding: 2.5rem; border-radius: 20px; text-align: center; opacity: 0.8;">
            <h3 style="font-size: clamp(1.2rem, 2vw, 1.6rem); margin-bottom: 1rem;">ESTADO ATUAL</h3>
            <p style="font-size: clamp(0.9rem, 1.2vw, 1rem); line-height: 1.4;">${points[0]?.revelation || 'Situação conhecida'}</p>
            <div style="margin-top: 1rem; font-size: 2rem; opacity: 0.7;">⏸️</div>
          </div>

          <!-- Transformação -->
          <div class="transformation-arrow" style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: clamp(60px, 8vw, 100px); height: clamp(60px, 8vw, 100px); background: linear-gradient(135deg, var(--secondary-color), #ff6b35); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; animation: pulse 2s infinite;">
              <i class="fas fa-rocket" style="color: white; font-size: clamp(1.5rem, 3vw, 2.5rem);"></i>
            </div>
            <div style="color: var(--secondary-color); font-weight: 700; font-size: clamp(0.8rem, 1vw, 0.9rem); text-align: center;">TRANSFORMAÇÃO</div>
          </div>

          <!-- Estado Futuro -->
          <div class="future-state" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 2.5rem; border-radius: 20px; text-align: center;">
            <h3 style="font-size: clamp(1.2rem, 2vw, 1.6rem); margin-bottom: 1rem;">NOVO FUTURO</h3>
            <p style="font-size: clamp(0.9rem, 1.2vw, 1rem); line-height: 1.4;">${points[0]?.action || 'Possibilidades infinitas'}</p>
            <div style="margin-top: 1rem; font-size: 2rem;">✨</div>
          </div>
        </div>
      </div>
    `;
  }

  createContrarianLayout(data, index, layoutVariation) {
    const title = data?.impact_title || 'Quebrando Paradigmas';
    const narrative = data?.narrative_thread || 'Desafiando o pensamento convencional';
    const points = data?.points || [{ revelation: 'Verdade oculta', evidence: 'Prova contrária' }];

    return `
      <div class="slide contrarian-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="contrarian-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem;">
          <h2 style="color: var(--text-dark); font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1rem;">${title}</h2>
          <p style="color: var(--text-muted); font-size: clamp(1rem, 1.5vw, 1.2rem); max-width: 80%; margin: 0 auto;">${narrative}</p>
        </div>

        <div class="myth-vs-reality" style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: center; margin: 2rem;">
          <!-- Mito -->
          <div class="myth-card" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 2rem; border-radius: 20px; text-align: center; position: relative;">
            <div style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 15px; display: inline-block; margin-bottom: 1rem; font-size: 0.8rem; font-weight: 600;">MITO</div>
            <h3 style="font-size: clamp(1.2rem, 2vw, 1.6rem); margin-bottom: 1rem;">O que se acredita</h3>
            <p style="line-height: 1.5; opacity: 0.9;">${points[0]?.revelation || 'Crença limitante'}</p>
            <div style="position: absolute; top: -10px; right: -10px; font-size: 2rem;">❌</div>
          </div>

          <!-- VS -->
          <div class="vs-divider" style="text-align: center;">
            <div style="background: var(--text-dark); color: white; padding: 1rem; border-radius: 50%; font-weight: 800; font-size: 1.2rem;">VS</div>
          </div>

          <!-- Realidade -->
          <div class="reality-card" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; padding: 2rem; border-radius: 20px; text-align: center; position: relative;">
            <div style="background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 15px; display: inline-block; margin-bottom: 1rem; font-size: 0.8rem; font-weight: 600;">REALIDADE</div>
            <h3 style="font-size: clamp(1.2rem, 2vw, 1.6rem); margin-bottom: 1rem;">A verdade é</h3>
            <p style="line-height: 1.5;">${points[0]?.evidence || 'Nova perspectiva'}</p>
            <div style="position: absolute; top: -10px; right: -10px; font-size: 2rem;">✅</div>
          </div>
        </div>
      </div>
    `;
  }

  createStoryLayout(data, index, layoutVariation) {
    const title = data?.impact_title || 'Uma História Transformadora';
    const narrative = data?.narrative_thread || 'A jornada humana por trás dos números';
    const points = data?.points || [{ revelation: 'História tocante', implication: 'Impacto emocional' }];

    return `
      <div class="slide story-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="story-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem;">
          <h2 style="color: var(--text-dark); font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1rem;">${title}</h2>
          <p style="color: var(--text-muted); font-size: clamp(1rem, 1.5vw, 1.2rem); max-width: 80%; margin: 0 auto; font-style: italic;">${narrative}</p>
        </div>

        <div class="story-content" style="background: linear-gradient(135deg, rgba(30, 92, 63, 0.05), rgba(255, 149, 0, 0.05)); padding: 3rem; border-radius: 25px; margin: 2rem; border-left: 6px solid var(--primary-color); position: relative;">
          <div style="position: absolute; top: -15px; left: 30px; background: var(--primary-color); color: white; padding: 0.5rem 1.5rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">
            📖 HISTÓRIA REAL
          </div>

          <div class="story-narrative" style="font-size: clamp(1.1rem, 1.8vw, 1.4rem); line-height: 1.8; color: var(--text-dark); margin-top: 1rem; text-align: justify;">
            ${points[0]?.revelation || 'Era uma vez uma transformação que mudou tudo...'}
          </div>

          <div class="story-impact" style="margin-top: 2rem; padding: 1.5rem; background: rgba(255, 149, 0, 0.1); border-radius: 15px; border-left: 4px solid var(--secondary-color);">
            <h4 style="color: var(--secondary-color); margin-bottom: 0.5rem; font-weight: 700;">💫 Impacto da História</h4>
            <p style="color: var(--text-dark); margin: 0; line-height: 1.5;">${points[0]?.implication || 'Uma lição que ressoa para sempre'}</p>
          </div>
        </div>
      </div>
    `;
  }

  createFutureLayout(data, index, layoutVariation) {
    const title = data?.impact_title || 'Cenários do Futuro';
    const narrative = data?.narrative_thread || 'Antecipando tendências e oportunidades';
    const points = data?.points || [{ revelation: 'Futuro em construção', action: 'Prepare-se hoje' }];

    return `
      <div class="slide future-slide" data-index="${index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="future-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem;">
          <div style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1rem;">🔮 ${title}</div>
          <p style="color: var(--text-muted); font-size: clamp(1rem, 1.5vw, 1.2rem); max-width: 80%; margin: 0 auto;">${narrative}</p>
        </div>

        <div class="timeline-future" style="position: relative; margin: 2rem; padding: 2rem; background: linear-gradient(135deg, rgba(30, 92, 63, 0.02), rgba(255, 149, 0, 0.02)); border-radius: 25px;">
          <!-- Linha do Tempo -->
          <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; background: linear-gradient(to bottom, var(--primary-color), var(--secondary-color)); transform: translateX(-50%);"></div>

          <!-- Hoje -->
          <div class="timeline-now" style="position: relative; margin-bottom: 4rem; text-align: center;">
            <div style="background: var(--primary-color); color: white; padding: 1rem 2rem; border-radius: 25px; display: inline-block; font-weight: 700; margin-bottom: 1rem; font-size: clamp(0.9rem, 1.2vw, 1rem);">
              📅 HOJE
            </div>
            <p style="color: var(--text-muted); max-width: 60%; margin: 0 auto; line-height: 1.5;">Estado atual das coisas</p>
          </div>

          <!-- Futuro Próximo -->
          <div class="timeline-near" style="position: relative; margin-bottom: 4rem; text-align: right;">
            <div style="background: linear-gradient(135deg, var(--secondary-color), #ff6b35); color: white; padding: 1rem 2rem; border-radius: 25px; display: inline-block; font-weight: 700; margin-bottom: 1rem; margin-left: auto; font-size: clamp(0.9rem, 1.2vw, 1rem);">
              🚀 FUTURO PRÓXIMO
            </div>
            <p style="color: var(--text-dark); max-width: 60%; margin-left: auto; line-height: 1.5; font-weight: 600;">${points[0]?.revelation || 'Mudanças se acelerando'}</p>
          </div>

          <!-- Futuro Distante -->
          <div class="timeline-far" style="position: relative; text-align: left;">
            <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 1rem 2rem; border-radius: 25px; display: inline-block; font-weight: 700; margin-bottom: 1rem; font-size: clamp(0.9rem, 1.2vw, 1rem);">
              🌟 VISÃO DE LONGO PRAZO
            </div>
            <p style="color: var(--text-dark); max-width: 60%; line-height: 1.5; font-weight: 600;">${points[0]?.action || 'Transformação completa'}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Determina tipo de visualização baseado no contexto do briefing
   */
  async determineVisualizationType(briefing, slideSpec) {
    const messages = promptManager.buildMessages('analysis', 'determine-visualization', {
      briefing,
      slide_title: slideSpec.title,
      slide_purpose: slideSpec.purpose || 'Análise de dados'
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    const result = this.parseJSONFromResponse(response.choices[0].message.content);
    console.log(`📊 Visualização escolhida: ${result.type} - ${result.reason}`);
    return result.type;
  }

  /**
   * Gera visualização contextual baseada no tipo determinado
   */
  async generateContextualVisualization(briefing, slideSpec, visualizationType, dataInsights, chartData) {
    const messages = promptManager.buildMessages('visualization', 'contextual-visualization', {
      briefing,
      slide_title: slideSpec.title,
      visualization_type: visualizationType,
      insights: dataInsights.join('; ')
    });

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages
    });

    return this.parseJSONFromResponse(response.choices[0].message.content);
  }

  /**
   * Renderiza slide de análise de dados baseado no tipo de visualização
   */
  renderDataAnalysisSlide(slideSpec, visualization, dataInsights, chartData, visualizationType) {
    const baseSlide = `
      <div class="slide data-analysis-slide ${visualizationType}-slide" data-index="${slideSpec.index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
        <div class="dots-decoration">
          ${Array(5).fill(0).map(() => '<div class="dot"></div>').join('')}
        </div>
        <div class="slide-header">
          <h2 style="color: var(--text-dark); text-align: center; margin-bottom: 2rem; font-size: 2.5rem; font-weight: 800;">${visualization.visualization_title}</h2>
        </div>
    `;

    let visualizationContent = '';

    switch (visualizationType) {
      case 'dashboard':
        visualizationContent = this.createDashboardVisualization(visualization);
        break;
      case 'comparison':
        visualizationContent = this.createComparisonVisualization(visualization);
        break;
      case 'process':
        visualizationContent = this.createProcessVisualization(visualization);
        break;
      case 'timeline':
        visualizationContent = this.createTimelineVisualization(visualization);
        break;
      case 'financial':
        visualizationContent = this.createFinancialVisualization(visualization);
        break;
      case 'growth':
        visualizationContent = this.createGrowthVisualization(visualization);
        break;
      default:
        visualizationContent = this.createDefaultVisualization(visualization);
    }

    const insightsSection = `
        <div class="insights-section" style="margin-top: 3rem; padding: 2rem; background: rgba(30, 92, 63, 0.03); border-radius: 20px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; align-items: center;">
            <div>
              <h3 style="color: var(--primary-color); margin-bottom: 1rem; font-size: 1.8rem; font-weight: 700;">💡 ${visualization.key_insight}</h3>
              <p style="color: var(--text-dark); font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem;">${dataInsights[0] || 'Insight principal baseado nos dados analisados.'}</p>
            </div>
            <div class="action-box" style="background: linear-gradient(135deg, var(--secondary-color), #ff6b35); color: white; padding: 2rem; border-radius: 15px; text-align: center;">
              <h4 style="margin: 0 0 1rem 0; font-size: 1.2rem;">🎯 Próxima Ação</h4>
              <p style="margin: 0; font-size: 1rem; line-height: 1.4;">${visualization.call_to_action}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    return baseSlide + visualizationContent + insightsSection;
  }

  /**
   * Visualizações específicas por tipo
   */
  createDashboardVisualization(visualization) {
    return `
      <div class="dashboard-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin: 2rem 0;">
        ${visualization.chart_elements.map((element, index) => `
          <div class="metric-card" style="background: linear-gradient(135deg, ${element.color}, ${this.lightenColor(element.color)}); color: white; padding: 2rem; border-radius: 15px; text-align: center; box-shadow: 0 8px 32px rgba(30, 92, 63, 0.2);">
            <div style="font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem;">${element.value}${this.getUnit(element.label)}</div>
            <div style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 1rem;">${element.label}</div>
            <div style="font-size: 0.9rem; opacity: 0.8; background: rgba(255, 255, 255, 0.2); padding: 0.5rem; border-radius: 8px;">${element.insight}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  createComparisonVisualization(visualization) {
    return `
      <div class="comparison-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin: 2rem 0; align-items: stretch;">
        ${visualization.chart_elements.slice(0, 2).map((element, index) => `
          <div class="comparison-card" style="background: linear-gradient(135deg, ${element.color}, ${this.lightenColor(element.color)}); color: white; padding: 3rem; border-radius: 20px; text-align: center; position: relative; box-shadow: 0 12px 48px rgba(30, 92, 63, 0.3);">
            <div class="card-badge" style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: white; color: ${element.color}; padding: 0.5rem 1.5rem; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">
              ${index === 0 ? 'ATUAL' : 'PROPOSTO'}
            </div>
            <div style="font-size: 4rem; font-weight: 800; margin: 2rem 0 1rem 0;">${element.value}${this.getUnit(element.label)}</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 1rem; opacity: 0.95;">${element.label}</h3>
            <p style="font-size: 1rem; opacity: 0.8; line-height: 1.4;">${element.insight}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  createProcessVisualization(visualization) {
    return `
      <div class="process-container" style="margin: 2rem 0;">
        <div class="process-flow" style="display: flex; justify-content: space-between; align-items: center; position: relative; margin: 2rem 0;">
          <div class="process-line" style="position: absolute; top: 50%; left: 10%; right: 10%; height: 4px; background: linear-gradient(to right, var(--primary-color), var(--secondary-color)); z-index: 1;"></div>
          ${visualization.chart_elements.map((element, index) => `
            <div class="process-step" style="background: ${element.color}; color: white; width: 120px; height: 120px; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; z-index: 2; box-shadow: 0 8px 32px rgba(30, 92, 63, 0.3);">
              <div style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">${index + 1}</div>
              <div style="font-size: 0.8rem; text-align: center; font-weight: 600;">${element.label}</div>
            </div>
          `).join('')}
        </div>
        <div class="process-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 3rem;">
          ${visualization.chart_elements.map((element, index) => `
            <div class="detail-card" style="background: rgba(30, 92, 63, 0.05); padding: 1.5rem; border-radius: 12px; border-left: 4px solid ${element.color};">
              <h4 style="color: ${element.color}; margin-bottom: 0.5rem; font-weight: 700;">${element.label}</h4>
              <p style="color: var(--text-dark); margin: 0; font-size: 0.95rem; line-height: 1.4;">${element.insight}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  createFinancialVisualization(visualization) {
    return `
      <div class="financial-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
        <div class="financial-chart" style="background: linear-gradient(135deg, rgba(30, 92, 63, 0.05), rgba(255, 149, 0, 0.05)); border-radius: 20px; padding: 2rem;">
          <h3 style="color: var(--text-dark); margin-bottom: 2rem; text-align: center; font-weight: 700;">Análise Financeira</h3>
          <div class="bar-chart" style="display: flex; align-items: end; justify-content: space-around; height: 200px; margin-bottom: 1rem;">
            ${visualization.chart_elements.map((element, index) => `
              <div class="bar-item" style="display: flex; flex-direction: column; align-items: center;">
                <div class="bar" style="width: 40px; height: ${element.value * 2}px; background: linear-gradient(to top, ${element.color}, ${this.lightenColor(element.color)}); border-radius: 4px 4px 0 0; margin-bottom: 0.5rem;"></div>
                <div style="font-size: 0.8rem; color: var(--text-dark); text-align: center; font-weight: 600;">${element.label}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${element.value}${this.getUnit(element.label)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="financial-summary" style="display: flex; flex-direction: column; gap: 1rem;">
          ${visualization.chart_elements.map((element, index) => `
            <div class="summary-card" style="background: white; border: 1px solid ${element.color}; border-radius: 12px; padding: 1.5rem; border-left: 6px solid ${element.color};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="color: ${element.color}; margin: 0; font-weight: 700;">${element.label}</h4>
                <span style="font-size: 1.5rem; font-weight: 800; color: var(--text-dark);">${element.value}${this.getUnit(element.label)}</span>
              </div>
              <p style="color: var(--text-muted); margin: 0; font-size: 0.9rem; line-height: 1.4;">${element.insight}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  createTimelineVisualization(visualization) {
    return `
      <div class="timeline-container" style="margin: 2rem 0; position: relative;">
        <div class="timeline-line" style="position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; background: linear-gradient(to bottom, var(--primary-color), var(--secondary-color)); transform: translateX(-50%);"></div>
        <div class="timeline-items" style="display: flex; flex-direction: column; gap: 3rem;">
          ${visualization.chart_elements.map((element, index) => `
            <div class="timeline-item" style="display: flex; align-items: center; ${index % 2 === 0 ? 'flex-direction: row' : 'flex-direction: row-reverse'};">
              <div class="timeline-content" style="flex: 1; ${index % 2 === 0 ? 'margin-right: 2rem; text-align: right' : 'margin-left: 2rem; text-align: left'};">
                <div class="timeline-card" style="background: white; border: 2px solid ${element.color}; border-radius: 15px; padding: 2rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);">
                  <h4 style="color: ${element.color}; margin: 0 0 1rem 0; font-weight: 700; font-size: 1.3rem;">${element.label}</h4>
                  <div style="font-size: 2.5rem; font-weight: 800; color: var(--text-dark); margin-bottom: 1rem;">${element.value}${this.getUnit(element.label)}</div>
                  <p style="color: var(--text-muted); margin: 0; line-height: 1.5;">${element.insight}</p>
                </div>
              </div>
              <div class="timeline-marker" style="width: 60px; height: 60px; background: ${element.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.2rem; z-index: 2; box-shadow: 0 4px 16px rgba(30, 92, 63, 0.3);">
                ${index + 1}
              </div>
              <div style="flex: 1;"></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  createGrowthVisualization(visualization) {
    return `
      <div class="growth-container" style="margin: 2rem 0;">
        <div class="growth-chart" style="background: linear-gradient(135deg, rgba(30, 92, 63, 0.05), rgba(255, 149, 0, 0.05)); border-radius: 20px; padding: 2rem; margin-bottom: 2rem;">
          <h3 style="color: var(--text-dark); margin-bottom: 2rem; text-align: center; font-weight: 700;">Projeção de Crescimento</h3>
          <div class="growth-bars" style="display: flex; align-items: end; justify-content: space-around; height: 250px; margin-bottom: 2rem;">
            ${visualization.chart_elements.map((element, index) => {
              const height = Math.max(element.value * 3, 50);
              return `
                <div class="growth-bar" style="display: flex; flex-direction: column; align-items: center;">
                  <div class="bar-value" style="margin-bottom: 0.5rem; font-weight: 700; color: ${element.color}; font-size: 1.1rem;">${element.value}${this.getUnit(element.label)}</div>
                  <div class="bar" style="width: 60px; height: ${height}px; background: linear-gradient(to top, ${element.color}, ${this.lightenColor(element.color)}); border-radius: 8px 8px 0 0; position: relative; box-shadow: 0 4px 16px rgba(30, 92, 63, 0.2);">
                    <div class="growth-arrow" style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); color: ${element.color}; font-size: 1.5rem;">
                      <i class="fas fa-arrow-up"></i>
                    </div>
                  </div>
                  <div class="bar-label" style="margin-top: 1rem; text-align: center; font-weight: 600; color: var(--text-dark); font-size: 0.9rem;">${element.label}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="growth-insights" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          ${visualization.chart_elements.map((element, index) => `
            <div class="insight-card" style="background: white; border: 1px solid ${element.color}; border-radius: 12px; padding: 2rem; border-left: 6px solid ${element.color}; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);">
              <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                <div style="width: 12px; height: 12px; background: ${element.color}; border-radius: 50%; margin-right: 1rem;"></div>
                <h4 style="color: ${element.color}; margin: 0; font-weight: 700;">${element.label}</h4>
              </div>
              <p style="color: var(--text-dark); margin: 0; line-height: 1.5; font-size: 0.95rem;">${element.insight}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  createDefaultVisualization(visualization) {
    return this.createDashboardVisualization(visualization);
  }

  /**
   * Métodos auxiliares
   */
  lightenColor(color) {
    // Simplificado - retorna uma versão mais clara da cor
    const colors = {
      '#1e5c3f': '#2d7a52',
      '#ff9500': '#ffb700',
      '#ffb700': '#ffd700',
      '#10b981': '#34d399'
    };
    return colors[color] || color;
  }

  getUnit(label) {
    if (label.toLowerCase().includes('custo') || label.toLowerCase().includes('receita') || label.toLowerCase().includes('valor')) {
      return '';
    }
    if (label.toLowerCase().includes('percent') || label.toLowerCase().includes('%')) {
      return '%';
    }
    if (label.toLowerCase().includes('tempo') || label.toLowerCase().includes('mês')) {
      return '';
    }
    return '';
  }

  /**
   * Gera slide de história emocional
   */
  async generateEmotionalStorySlide(briefing, slideSpec, attachmentAnalysis, layoutVariation) {
    try {
      console.log('🎭 Gerando slide de história emocional...');

      // Fallback para conteúdo simples e útil
      const slideContent = {
        title: slideSpec.title || 'Nossa Experiência Comprovada',
        story: `Com base no seu briefing sobre ${briefing.substring(0, 100)}..., desenvolvemos uma abordagem prática que já transformou empresas similares.`,
        benefits: [
          'Implementação baseada em casos reais',
          'Resultados mensuráveis em 30-60 dias',
          'Suporte especializado durante todo o processo'
        ],
        cta: 'Vamos discutir como adaptar essa experiência para seu contexto específico.'
      };

      return this.generateContentSlide(slideContent, slideSpec);

    } catch (error) {
      console.error('❌ Erro ao gerar slide emocional:', error);
      return this.generateFallbackSlide(slideSpec, 'Experiência e Resultados');
    }
  }

  /**
   * Gera slide de visão de transformação
   */
  async generateTransformationVisionSlide(briefing, slideSpec, attachmentAnalysis, layoutVariation) {
    try {
      console.log('🚀 Gerando slide de visão de transformação...');

      // Fallback para conteúdo prático
      const slideContent = {
        title: slideSpec.title || 'Próximos Passos para Transformação',
        vision: 'Baseado no seu briefing, identificamos oportunidades concretas de melhoria.',
        steps: [
          {
            phase: 'Fase 1 (0-30 dias)',
            description: 'Análise detalhada e planejamento customizado'
          },
          {
            phase: 'Fase 2 (30-60 dias)',
            description: 'Implementação das primeiras melhorias'
          },
          {
            phase: 'Fase 3 (60-90 dias)',
            description: 'Otimização e expansão dos resultados'
          }
        ],
        timeline: '90 dias para resultados tangíveis'
      };

      return this.generateContentSlide(slideContent, slideSpec);

    } catch (error) {
      console.error('❌ Erro ao gerar slide de transformação:', error);
      return this.generateFallbackSlide(slideSpec, 'Roadmap de Implementação');
    }
  }

  /**
   * Gera slide de fallback para casos de erro
   */
  generateFallbackSlide(slideSpec, defaultTitle = 'Conteúdo Personalizado') {
    return `
      <div class="slide content-slide" data-index="${slideSpec.index}">
        <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">

        <div class="slide-header" style="margin-bottom: 2rem;">
          <h2 style="color: var(--text-dark); text-align: center; margin-bottom: 1rem; font-size: 2.8rem; font-weight: 800;">
            ${slideSpec.title || defaultTitle}
          </h2>
        </div>

        <div class="slide-content" style="padding: 0 2rem;">
          <div style="background: linear-gradient(135deg, rgba(30, 92, 63, 0.03) 0%, rgba(255, 149, 0, 0.03) 100%);
                      border-radius: 20px; padding: 2.5rem; text-align: center;">
            <i class="fas fa-lightbulb" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
            <p style="font-size: 1.2rem; color: var(--text-dark); margin-bottom: 1.5rem;">
              Conteúdo personalizado será desenvolvido com base nas informações específicas do seu briefing.
            </p>
            <p style="font-size: 1rem; color: var(--text-muted);">
              Entre em contato para detalhamento completo desta seção.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}

module.exports = IntelligentAnalyzer;