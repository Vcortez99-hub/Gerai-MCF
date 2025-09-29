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
      this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
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
          content: "You are GPT-4o-mini, an advanced AI model. Create professional HTML presentations with complete, valid HTML documents. Generate full HTML structure with embedded CSS and JavaScript. Focus on modern design, responsive layout, and professional business presentations."
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
      '- Logo: https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png\n\n' +
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

    return objective + briefingSection + configSection + templateHeader;
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
        <img src="https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png" alt="Darede" class="logo">
        <h1>${title}</h1>
        <div class="content">
            <h2>Apresentação OpenAI em Desenvolvimento</h2>
            <p>Esta é uma apresentação personalizada gerada com OpenAI GPT-4o-mini.</p>
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