/**
 * PresentationAnalyzer - Análise prévia e estruturação de slides (estilo Gamma.ai)
 */

const OpenAI = require('openai');
const ExcelProcessor = require('./ExcelProcessor');

class PresentationAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4o';
  }

  /**
   * Analisa briefing + anexos e sugere estrutura de slides
   */
  async analyzeAndStructure(briefing, config) {
    console.log('🔍 Analisando conteúdo para estruturar slides...');

    // Processar anexos Excel se houver
    let excelData = '';
    if (config.attachments && config.attachments.length > 0) {
      const processedData = await ExcelProcessor.processAttachments(config.attachments);
      if (processedData.hasData) {
        excelData = '\n\n' + processedData.summary;
      }
    }

    const slideCount = parseInt(config.slideCount) || 6;

    const analysisPrompt = `Você é um especialista em estruturar apresentações executivas.

TAREFA: Analise o briefing e dados fornecidos, e sugira a melhor estrutura de ${slideCount} slides.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 BRIEFING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${briefing}
${excelData}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ CONFIGURAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de slides: ${slideCount}
Empresa: ${config.company || 'Cliente'}
Público: ${config.audience || 'Executivos'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ESTRUTURA DESEJADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Para CADA slide, defina:
1. **Número do slide** (1 a ${slideCount})
2. **Tipo de layout** (escolha entre):
   - "cover" (capa)
   - "hero-stats" (números grandes)
   - "bar-chart" (gráfico de barras)
   - "comparison" (antes/depois)
   - "timeline" (processo/etapas)
   - "content" (conteúdo texto)
   - "contact" (contato)

3. **Título do slide** (curto e impactante)
4. **Briefing detalhado** (o que este slide deve comunicar)
5. **Dados sugeridos** (se aplicável, baseado nos anexos)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ REGRAS OBRIGATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Slide 1 SEMPRE é "cover" (capa)
- Slide ${slideCount} SEMPRE é "contact" (contato)
- Se houver dados numéricos, incluir slides "hero-stats" e "bar-chart"
- Máximo 1-2 slides "content" (evitar muito texto)
- Preferir visualizações (stats, charts, comparison)
- Briefing de cada slide deve ser ESPECÍFICO e DETALHADO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 FORMATO DE RESPOSTA (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Retorne APENAS um JSON válido (sem markdown):

{
  "slideCount": ${slideCount},
  "slides": [
    {
      "slideNumber": 1,
      "type": "cover",
      "title": "[Título impactante da apresentação]",
      "briefing": "[Descrição do que a capa deve comunicar]",
      "suggestedData": null
    },
    {
      "slideNumber": 2,
      "type": "hero-stats",
      "title": "[Título do insight principal]",
      "briefing": "[Quais métricas mostrar e por quê]",
      "suggestedData": ["[Métrica 1]", "[Métrica 2]", "[Métrica 3]"]
    },
    {
      "slideNumber": 3,
      "type": "bar-chart",
      "title": "[Título do gráfico]",
      "briefing": "[O que o gráfico deve comparar/mostrar]",
      "suggestedData": ["[Item 1]", "[Item 2]", "[Item 3]"]
    }
    // ... até slide ${slideCount}
  ],
  "insights": "[Resumo dos principais insights da apresentação]",
  "recommendations": "[Recomendações de como apresentar]"
}

Retorne APENAS o JSON, sem explicações ou markdown.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: "Você é um especialista em estruturar apresentações executivas. Retorne APENAS JSON válido, sem markdown."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const structure = JSON.parse(content);

      console.log(`✅ Estrutura analisada: ${structure.slides.length} slides`);

      // Validar estrutura
      this.validateStructure(structure, slideCount);

      return {
        success: true,
        structure: structure,
        canEdit: true,
        message: "Estrutura gerada com sucesso. Edite os briefings antes de gerar."
      };

    } catch (error) {
      console.error('❌ Erro na análise:', error.message);

      // Fallback: estrutura básica
      return {
        success: false,
        structure: this.generateFallbackStructure(briefing, slideCount, config),
        canEdit: true,
        message: "Estrutura básica gerada. Você pode editá-la antes de gerar."
      };
    }
  }

  /**
   * Valida e corrige estrutura
   */
  validateStructure(structure, expectedCount) {
    // Garantir que tem o número correto de slides
    if (structure.slides.length !== expectedCount) {
      console.warn(`⚠️ Ajustando número de slides de ${structure.slides.length} para ${expectedCount}`);

      if (structure.slides.length > expectedCount) {
        structure.slides = structure.slides.slice(0, expectedCount);
      } else {
        // Adicionar slides faltantes
        while (structure.slides.length < expectedCount - 1) {
          structure.slides.push({
            slideNumber: structure.slides.length + 1,
            type: "content",
            title: `Slide ${structure.slides.length + 1}`,
            briefing: "Conteúdo adicional",
            suggestedData: null
          });
        }
      }
    }

    // Garantir que slide 1 é capa
    if (structure.slides[0].type !== 'cover') {
      structure.slides[0].type = 'cover';
    }

    // Garantir que último slide é contato
    const lastIndex = structure.slides.length - 1;
    if (structure.slides[lastIndex].type !== 'contact') {
      structure.slides[lastIndex] = {
        slideNumber: expectedCount,
        type: "contact",
        title: "Vamos conversar?",
        briefing: "Slide de contato com informações da Darede",
        suggestedData: null
      };
    }

    // Numerar slides sequencialmente
    structure.slides.forEach((slide, index) => {
      slide.slideNumber = index + 1;
    });

    structure.slideCount = expectedCount;
  }

  /**
   * Gera estrutura de fallback
   */
  generateFallbackStructure(briefing, slideCount, config) {
    const slides = [
      {
        slideNumber: 1,
        type: "cover",
        title: `Apresentação ${config.company || ''}`,
        briefing: "Slide de capa com título, subtítulo e logo Darede",
        suggestedData: null
      }
    ];

    // Slides intermediários
    for (let i = 2; i < slideCount; i++) {
      slides.push({
        slideNumber: i,
        type: i === 2 ? "hero-stats" : "content",
        title: `Slide ${i}`,
        briefing: `Conteúdo sobre: ${briefing.substring(0, 100)}...`,
        suggestedData: null
      });
    }

    // Último slide: contato
    slides.push({
      slideNumber: slideCount,
      type: "contact",
      title: "Vamos conversar?",
      briefing: "Slide de contato com email e telefone da Darede",
      suggestedData: null
    });

    return {
      slideCount,
      slides,
      insights: "Estrutura básica gerada",
      recommendations: "Edite os briefings para personalizar cada slide"
    };
  }

  /**
   * Gera apresentação final baseada na estrutura editada
   */
  async generateFromStructure(structure, config) {
    console.log('🎨 Gerando apresentação a partir da estrutura editada...');

    // Processar anexos novamente para ter dados frescos
    let excelData = '';
    if (config.attachments && config.attachments.length > 0) {
      const processedData = await ExcelProcessor.processAttachments(config.attachments);
      if (processedData.hasData) {
        excelData = processedData.summary;
      }
    }

    // Construir briefing completo com todos os slides
    let fullBriefing = 'ESTRUTURA COMPLETA DA APRESENTAÇÃO:\n\n';

    structure.slides.forEach(slide => {
      fullBriefing += `━━━ SLIDE ${slide.slideNumber}: ${slide.title} ━━━\n`;
      fullBriefing += `Tipo: ${slide.type}\n`;
      fullBriefing += `Briefing: ${slide.briefing}\n`;
      if (slide.suggestedData && slide.suggestedData.length > 0) {
        fullBriefing += `Dados sugeridos: ${slide.suggestedData.join(', ')}\n`;
      }
      fullBriefing += '\n';
    });

    if (excelData) {
      fullBriefing += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      fullBriefing += 'DADOS DOS ANEXOS:\n';
      fullBriefing += excelData;
    }

    // Atualizar config com briefing completo
    const updatedConfig = {
      ...config,
      slideCount: structure.slideCount,
      slideStructure: structure.slides,
      fullBriefing: fullBriefing
    };

    return {
      briefing: fullBriefing,
      config: updatedConfig
    };
  }
}

module.exports = PresentationAnalyzer;
