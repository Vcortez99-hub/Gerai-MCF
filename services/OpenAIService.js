const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');
const ConsistencyEngine = require('./ConsistencyEngine');

class OpenAIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';

    // Inicializar Consistency Engine (baseado no benchmark presentations.ai)
    this.consistencyEngine = new ConsistencyEngine();

    if (this.provider === 'openai' && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    } else {
      // Fallback to simple AI if no OpenAI key
      this.provider = 'simple';
    }
  }

  async generateContent(briefing, config) {
    try {
      console.log('🎯 MODO ENTERPRISE: Gerando com ConsistencyEngine');

      // Usar ConsistencyEngine para garantir apresentações como presentations.ai
      const result = await this.consistencyEngine.generateConsistentPresentation(briefing, config);

      if (result.success) {
        console.log(`✅ Apresentação gerada com score de consistência: ${result.consistencyScore}%`);
        return {
          success: true,
          data: {
            type: 'complete-html',
            html: result.htmlContent,
            htmlContent: result.htmlContent,
            title: 'Apresentação Enterprise',
            template: 'darede-enterprise',
            metadata: result.metadata,
            consistencyScore: result.consistencyScore,
            qualityScore: result.qualityScore,
            qualityStatus: result.qualityStatus
          }
        };
      } else {
        // Fallback para método original se ConsistencyEngine falhar
        console.log('⚠️ Fallback para geração OpenAI direta');
        const fallbackResult = await this.generateWithOpenAI(briefing, config);
        return {
          success: true,
          data: fallbackResult
        };
      }
    } catch (error) {
      console.error('❌ Erro crítico na geração de conteúdo:', error);
      return {
        success: false,
        error: `Erro na geração enterprise: ${error.message}`
      };
    }
  }

  async generateWithOpenAI(briefing, config) {
    console.log('🤖 Gerando com OpenAI para briefing:', briefing.substring(0, 100) + '...');
    console.log('🎯 Modelo sendo usado:', this.model);

    const prompt = await this.buildPrompt(briefing, config);

    // Adicionar o briefing ao config para o parsing
    config.briefing = briefing;

    console.log('📝 Prompt length:', prompt.length, 'characters');

    // GPT-5 com configurações mínimas para funcionamento
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are an advanced AI model. Create exceptional HTML presentations with complete, valid HTML documents. Generate full HTML structure with embedded CSS and JavaScript. Focus on ultra-modern design, responsive layout, interactive elements, and enterprise-grade business presentations with advanced animations and data visualizations."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    console.log('📦 OpenAI response received, length:', response.choices[0].message.content.length);

    const content = response.choices[0].message.content;
    return this.parseAIResponse(content, config);
  }

  async buildPrompt(briefing, config) {
    const {
      templateType,
      company,
      audience,
      slideCount,
      tone,
      slideTopics,
      attachments,
      logoUrls
    } = config;

    // Estrutura específica e obrigatória dos slides
    const totalSlides = parseInt(slideCount) || 6;
    let slideStructure = '\n\n**ESTRUTURA OBRIGATÓRIA DOS SLIDES:**\n';

    // Slide 1 - SEMPRE Capa
    slideStructure += `- Slide 1 (CAPA): Título principal, subtítulo, ${company || 'Empresa'}, logo e data\n`;

    // Slides de conteúdo (2 até N-1)
    if (slideTopics && slideTopics.length > 0) {
      slideTopics.forEach(topic => {
        const slideNum = parseInt(topic.slideNumber) + 1; // +1 porque capa é slide 1
        slideStructure += `- Slide ${slideNum}: ${topic.topic}\n`;
      });
    } else {
      // Estrutura padrão se não tiver tópicos específicos
      for (let i = 2; i < totalSlides; i++) {
        slideStructure += `- Slide ${i}: Conteúdo ${i - 1}\n`;
      }
    }

    // Último slide - SEMPRE Contracapa
    slideStructure += `- Slide ${totalSlides} (CONTRACAPA): Contato comercial da Darede (SEM agradecimentos)\n`;
    slideStructure += '\n⚠️ IMPORTANTE: Siga EXATAMENTE esta estrutura. Cada slide deve ser numerado sequencialmente.\n';

    // Informações sobre anexos
    let attachmentInfo = '';
    if (attachments && attachments.length > 0) {
      attachmentInfo = '\n\n**DADOS ANEXADOS PARA ANÁLISE:**\n';
      attachments.forEach((attachment, index) => {
        attachmentInfo += `${index + 1}. Arquivo de dados (${attachment.type})\n`;
        if (attachment.url && attachment.url.startsWith('data:')) {
          attachmentInfo += `   - Conteúdo: ${attachment.url.substring(0, 300)}...\n`;
        }
      });
      attachmentInfo += '🎯 IMPORTANTE: \n- Analise TODOS os dados com MÁXIMA PRECISÃO matemática\n- Some valores CORRETAMENTE sem erros - VERIFIQUE TODAS AS PLANILHAS E ABAS\n- Para Excel: examine cada célula, linha e coluna com TOTAL PRECISÃO\n- DUPLA VERIFICAÇÃO: Confira todas as somas e cálculos duas vezes\n- NÃO mencione nomes de arquivos na apresentação\n- Use apenas os DADOS e INSIGHTS dos arquivos\n';
    }

    // URLs de logos
    let logoInfo = '';
    if (logoUrls && logoUrls.length > 0) {
      logoInfo = '\n\n**LOGOS PARA INCLUIR:**\n';
      logoUrls.forEach((url, index) => {
        logoInfo += `- Logo ${index + 1}: ${url}\n`;
      });
      logoInfo += 'Inclua estes logos como parceiros/clientes na apresentação.\n';
    }

    // Build the prompt in logical chunks for better maintainability
    const objective = '🎯 OBJETIVO: Crie uma apresentação HTML PROFISSIONAL usando o TEMPLATE DAREDE com ' + totalSlides + ' slides.\n\n';

    const briefingSection = 'BRIEFING DO PROJETO:\n' + briefing + '\n\n';

    const configSection = 'CONFIGURAÇÃO:\n' +
      '- Público-alvo: ' + (audience || 'Executivos') + '\n' +
      '- Total de slides: ' + totalSlides + slideStructure + attachmentInfo + logoInfo + '\n\n';

    const templateHeader = '🎨 **TEMPLATE DAREDE - VERSÃO PROFISSIONAL:**\n\n' +
      'Gere uma apresentação HTML completa usando:\n' +
      '- Font: Inter, sans-serif\n' +
      '- Cores: Verde (#1e5c3f), Laranja (#ff9500)\n' +
      '- Background: #ffffff\n' +
      '- Logo: https://i.ibb.co/QvP3HK6n/logo-darede.png\n\n' +
      '⚠️ **CONTRASTE OBRIGATÓRIO:**\n' +
      '- Fundos brancos = texto escuro (#2c2c2c)\n' +
      '- Fundos coloridos = texto branco (#ffffff)\n' +
      '- NUNCA texto branco em fundo branco\n\n' +
      '📋 **ESTRUTURA DOS SLIDES:**\n' +
      'Slide 1: Capa com título e logo\n' +
      'Slides 2-N: Conteúdo baseado no briefing\n' +
      'Slide final: Contato Darede\n\n' +
      '🚀 **FORMATO FINAL:**\n' +
      'Retorne APENAS HTML completo válido, sem markdown, usando o template Darede com navegação e estilos responsivos.';

    return objective + briefingSection + configSection + templateHeader;
  }

  // Função parseAIResponse está implementada na linha 1692

  // Função generateSimple implementada na linha 1815

  // As funções parseAIResponse, extractTitleFromHTML, generateHTMLFallback estão implementadas abaixo

  // [CÓDIGO HTML TEMPLATE REMOVIDO POR ESTAR CAUSANDO ERRO DE SINTAXE]

  // Todas as funções duplicadas foram removidas
  // As implementações corretas estão no final do arquivo

  // parseAIResponse implementado na linha 1692
  // extractTitleFromHTML implementado na linha 1737
  // generateHTMLFallback implementado na linha 1746
  // generateSimple implementado na linha 1815

  // Implementação completa da função buildPrompt estava corrompida
  // Versão simplificada para evitar erros:
  async buildPrompt(briefing, config) {
    const slideCount = parseInt(config.slideCount) || 6;
    const audience = config.audience || 'Executivos';
    const company = config.company || 'Cliente';

    const prompt = `🏛️ **C-SUITE EXECUTIVE PRESENTATION CREATION**

You are creating a **BOARD-LEVEL EXECUTIVE PRESENTATION** for Fortune 500 standards.
Target audience: CEOs, CFOs, CTOs, Board Members, Senior Executives.

**📊 EXECUTIVE BRIEFING:**
${briefing}

**🎯 EXECUTIVE SPECIFICATIONS:**
- Audience: ${audience} (C-Suite Level)
- Client: ${company}
- Presentation Scope: ${slideCount} slides
- Quality Standard: McKinsey/BCG/Bain Level

**🏢 CORPORATE DESIGN STANDARDS (DAREDE):**
- Primary Palette: Deep Forest (#1e5c3f), Executive Orange (#ff9500), Pure White (#ffffff)
- Corporate Logo: https://i.ibb.co/QvP3HK6n/logo-darede.png
- Typography: 'Inter' (Enterprise font stack)
- Design Philosophy: Ultra-sophisticated, boardroom-ready, institutional-grade

**💼 EXECUTIVE-GRADE REQUIREMENTS:**
1. **Sophisticated Animations**: Subtle, professional transitions worthy of boardrooms
2. **Premium Microinteractions**: Refined hover states, executive-level feedback
3. **Enterprise Data Visualization**: McKinsey-style charts, BCG-quality analytics
4. **C-Suite Dashboard**: Executive KPIs, financial metrics, strategic indicators
5. **Professional SVG Graphics**: Investment-grade charts with institutional styling
6. **Responsive Excellence**: Flawless rendering on executive devices (iPad Pro, Surface)
7. **Executive Navigation**: Intuitive, sophisticated, boardroom-appropriate
8. **Corporate Visual Elements**: Institutional gradients, executive shadows, premium depth
9. **Professional Typography**: C-Suite hierarchy, perfect readability, executive spacing
10. **Strategic Data Stories**: Insights that drive executive decision-making

**📊 SLIDE STRUCTURE:**
- Slide 1: Capa impactante com animação de entrada
- Slides 2-${slideCount-1}: Conteúdo baseado no briefing com visualizações
- Slide ${slideCount}: Contato estilizado (comercial@darede.com.br, +55 11 3090-1115)

**📊 EXECUTIVE ANALYTICS SPECIFICATIONS:**
- **Enterprise Sankey Diagrams**: Investment-grade flow visualizations with institutional styling
- **Executive Donut Charts**: Boardroom-quality circular analytics with sophisticated animations
- **Strategic Bar Charts**: C-Suite level comparative analysis with professional gradients
- **Executive Metric Cards**: Financial KPIs with institutional icons and premium styling
- **Corporate Dashboard**: McKinsey-style grid layouts with executive-grade spacing
- **Professional SVG Elements**: Investment-banking quality filters, shadows, gradients
- **Strategic Data Integration**: Real financial data with executive-level insights
- **Institutional Color Palette**: Conservative, professional, trustworthy color schemes
- **Executive Typography**: Perfect hierarchy, institutional font weights, C-Suite readability

**🏛️ INSTITUTIONAL TECHNICAL STANDARDS:**
- **Enterprise HTML5**: Semantic, accessible, boardroom-grade markup
- **Investment-Grade CSS3**: Custom properties, institutional design systems
- **Executive JavaScript**: Sophisticated interactions, professional user experience
- **C-Suite Performance**: Optimized for executive devices and presentation systems
- **Corporate Accessibility**: Full ARIA compliance for inclusive boardrooms
- **Professional SVG**: Institutional definitions, executive gradients, corporate filters
- **Strategic Layouts**: CSS Grid and Flexbox for executive-level precision
- **Boardroom Animations**: Sophisticated keyframes, professional transitions

**🎯 EXECUTIVE DELIVERABLE REQUIREMENTS:**
- **NO amateur emoji icons** - Use professional SVG icons only
- **NO casual language** - Executive terminology and business vocabulary
- **NO bright/playful colors** - Conservative, institutional color palette
- **NO cartoon-style graphics** - Investment-grade, professional visualizations
- **CONSERVATIVE typography** - Institutional font weights and hierarchies
- **SOPHISTICATED animations** - Subtle, boardroom-appropriate transitions
- **EXECUTIVE data presentation** - Financial-grade accuracy and professionalism

**🏢 FINAL OUTPUT SPECIFICATION:**
Return ONLY complete, valid HTML code without markdown or explanations.
Create a **BOARD-LEVEL PRESENTATION** that would be appropriate for:
- Fortune 500 board meetings
- C-Suite strategic presentations
- Institutional investor briefings
- McKinsey/BCG/Bain consulting standards

Use your full capability to create something of **INSTITUTIONAL EXCELLENCE**!`;

    return prompt;
  }

  parseAIResponse(response, config) {
    try {
      console.log('🔍 Raw AI Response length:', response.length);

      // Limpar a resposta HTML - remover markdown se houver
      let cleanHTML = response
        .replace(/```html\n?|```\n?/g, '')
        .trim();

      // Verificar se é HTML válido
      if (!cleanHTML.startsWith('<!DOCTYPE html>') && !cleanHTML.startsWith('<html')) {
        // Tentar extrair HTML de dentro da resposta
        const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        if (htmlMatch) {
          cleanHTML = htmlMatch[0];
        } else {
          throw new Error('HTML não encontrado na resposta');
        }
      }

      // Validar estrutura HTML básica
      if (!cleanHTML.includes('<html') || !cleanHTML.includes('</html>')) {
        throw new Error('Estrutura HTML inválida');
      }

      console.log('✅ HTML válido recebido, tamanho:', cleanHTML.length);

      // Retornar o HTML diretamente com metadata
      const result = {
        html: cleanHTML,
        title: this.extractTitleFromHTML(cleanHTML),
        generatedAt: new Date().toISOString(),
        config,
        provider: this.provider,
        model: this.model,
        type: 'complete-html'
      };

      return result;

    } catch (error) {
      console.error('❌ Erro ao parsear resposta HTML do OpenAI:', error.message);
      console.log('📄 Original response preview:', response.substring(0, 500) + '...');

      // Fallback para geração HTML simples
      console.log('🔄 Usando fallback HTML...');
      return this.generateHTMLFallback(config);
    }
  }

  extractTitleFromHTML(html) {
    try {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return titleMatch ? titleMatch[1] : 'Apresentação Gerada';
    } catch {
      return 'Apresentação Gerada';
    }
  }

  generateHTMLFallback(config) {
    const { company, audience, briefing } = config;
    const title = `Apresentação - ${company || 'Cliente'}`;

    const fallbackHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Darede</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0A4F2C 0%, #11713F 50%, #1A8F4F 100%);
            color: #ffffff;
            margin: 0;
            padding: 40px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            max-width: 1200px;
            text-align: center;
        }
        h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .content {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 40px;
            margin-top: 30px;
        }
        .logo {
            height: 60px;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede" class="logo">
        <h1>${title}</h1>
        <div class="content">
            <h2>Apresentação OpenAI em Desenvolvimento</h2>
            <p>Esta é uma apresentação personalizada gerada com OpenAI GPT-4o.</p>
            <p><strong>Empresa:</strong> ${company || 'Cliente'}</p>
            <p><strong>Público:</strong> ${audience || 'Executivos'}</p>
            ${briefing ? `<p><strong>Briefing:</strong> ${briefing.substring(0, 200)}...</p>` : ''}
        </div>
    </div>
</body>
</html>`;

    return {
      html: fallbackHTML,
      title,
      generatedAt: new Date().toISOString(),
      config,
      provider: 'openai-fallback',
      type: 'complete-html'
    };
  }

  generateSimple(briefing, config) {
    console.log('🤖 Gerando conteúdo com OpenAI simples para:', briefing.substring(0, 100));

    const words = briefing.toLowerCase().split(' ');
    const slideCount = parseInt(config.slideCount) || 6;

    // Análise inteligente do briefing para gerar título específico
    let title = "Apresentação Personalizada";

    // Detecta temas específicos no briefing
    if (words.includes('vendas') || words.includes('comercial')) {
      title = "Estratégia Comercial Inovadora";
    } else if (words.includes('marketing') || words.includes('digital')) {
      title = "Estratégia de Marketing Digital";
    } else if (words.includes('tecnologia') || words.includes('transformação')) {
      title = "Transformação Digital Empresarial";
    } else {
      // Usa as primeiras palavras significativas do briefing
      const significantWords = briefing.split(' ').filter(word =>
        word.length > 3 &&
        !['para', 'sobre', 'como', 'quando', 'onde', 'porque', 'esta', 'esse', 'essa'].includes(word.toLowerCase())
      ).slice(0, 3);

      if (significantWords.length > 0) {
        title = significantWords.join(' ') + ' - Estratégia Empresarial';
      }
    }

    console.log('📝 Título gerado:', title);

    // Para compatibilidade, retornar formato de HTML gerado
    const fallbackHTML = this.generateHTMLFallback({
      company: config.company,
      audience: config.audience,
      briefing: briefing
    });

    return {
      title: fallbackHTML.title,
      html: fallbackHTML.html,
      type: 'complete-html',
      slideCount,
      generatedAt: new Date().toISOString(),
      config,
      provider: 'openai-simple-fallback'
    };
  }
}

module.exports = OpenAIService;