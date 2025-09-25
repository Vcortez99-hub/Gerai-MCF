const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');

class OpenAIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';

    if (this.provider === 'openai' && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.model = process.env.OPENAI_MODEL || 'gpt-5-mini';
    } else {
      // Fallback to simple AI if no OpenAI key
      this.provider = 'simple';
    }
  }

  async generateContent(briefing, config) {
    try {
      let result;
      if (this.provider === 'openai' && this.openai) {
        console.log('🚀 Usando OpenAI com modelo:', this.model);
        result = await this.generateWithOpenAI(briefing, config);
      } else {
        console.log('⚠️ Fallback para geração simples');
        result = this.generateSimple(briefing, config);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Erro crítico na geração de conteúdo:', error);
      return {
        success: false,
        error: `Erro do GPT-5: ${error.message}`
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
          content: "You are GPT-5-mini, the most advanced AI model. Create professional HTML presentations with complete, valid HTML documents. Generate full HTML structure with embedded CSS and JavaScript. Focus on modern design, responsive layout, and professional business presentations."
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

    // Estrutura específica de tópicos se fornecida
    let slideStructure = '';
    if (slideTopics && slideTopics.length > 0) {
      slideStructure = '\n\n**ESTRUTURA OBRIGATÓRIA DOS SLIDES:**\n';
      slideTopics.forEach(topic => {
        slideStructure += `- Slide ${topic.slideNumber}: ${topic.topic}\n`;
      });
      slideStructure += '\nSiga EXATAMENTE esta estrutura fornecida.\n';
    }

    // Informações sobre anexos
    let attachmentInfo = '';
    if (attachments && attachments.length > 0) {
      attachmentInfo = '\n\n**ANEXOS DISPONÍVEIS:**\n';
      attachments.forEach(attachment => {
        attachmentInfo += `- ${attachment.name} (${attachment.type})\n`;
      });
      attachmentInfo += 'Use essas informações para criar conteúdo específico e dados.\n';
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

    return `Crie uma apresentação HTML completa e profissional com ${slideCount || '6'} slides.

BRIEFING DO PROJETO:
${briefing}

CONFIGURAÇÃO:
- Empresa: ${company || 'Cliente'}
- Público-alvo: ${audience || 'Executivos'}
- Total de slides: ${slideCount || '6'}${slideStructure}${attachmentInfo}${logoInfo}

INSTRUÇÕES PARA GPT-5:
1. Criar documento HTML completo e válido
2. Incluir logo: https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png
3. Design moderno com cores verde/dourado
4. Navegação funcional entre slides
5. Seguir exatamente a estrutura de tópicos fornecida
6. Usar dados dos anexos para criar conteúdo específico
7. IMPORTANTE: Adicionar botão "✏️ Editar" na navegação que redireciona para /editor.html
8. Tornar elementos de conteúdo editáveis adicionando data-editable="true" em textos, títulos e cards
9. Incluir script para habilitar edição inline quando em modo de edição

FORMATO DE SAÍDA:
Retorne exclusivamente o código HTML válido, iniciando com <!DOCTYPE html> e terminando com </html>.

IMPORTANTE: Este prompt é para GPT-5-mini, use toda sua capacidade avançada para gerar uma apresentação completa e profissional.`;
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
            <p>Esta é uma apresentação personalizada gerada com OpenAI o1-mini.</p>
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