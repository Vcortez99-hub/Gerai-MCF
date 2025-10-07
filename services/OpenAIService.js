const OpenAI = require('openai');
const VisualPromptBuilder = require('./VisualPromptBuilder');

class OpenAIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';

    if (this.provider === 'openai' && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.model = process.env.OPENAI_MODEL || 'gpt-4o';
      console.log('OpenAI Service inicializado:', this.model);
    } else {
      this.provider = 'simple';
      console.warn('OpenAI não configurado');
    }
  }

  async generateContent(briefing, config) {
    try {
      console.log('Gerando apresentação...');

      if (this.provider === 'simple') {
        return this.generateSimpleFallback(briefing, config);
      }

      const result = await this.generateWithOpenAI(briefing, config);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('\n❌ ERRO FATAL:', error.message);
      throw error;
    }
  }

  async generateWithOpenAI(briefing, config) {
    console.log('\n━━━ INICIANDO GERAÇÃO COM OPENAI ━━━');

    const prompt = await VisualPromptBuilder.build(briefing, config);
    const slideCount = parseInt(config.slideCount) || 6;

    console.log('📤 Slides solicitados:', slideCount);
    console.log('📤 Tamanho do prompt:', prompt.length, 'chars');

    const systemMessage = `Você é um designer expert de apresentações HTML.

🎯 MISSÃO CRÍTICA: Criar EXATAMENTE ${slideCount} slides completos.

REGRAS:
1. Criar TODOS os ${slideCount} slides (não apenas 1!)
2. Cada slide: <section class="slide" data-slide="N"> onde N = 1 até ${slideCount}
3. Retornar APENAS HTML de <!DOCTYPE html> até </html>
4. SEM markdown, SEM explicações
5. Cores: #1e5c3f, #ff9500
6. SEM datas

IMPORTANTE: Use todos os tokens disponíveis!`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 16384
    });

    const rawContent = response.choices[0].message.content;

    console.log('📥 Resposta:', rawContent.length, 'chars');
    console.log('📥 Finish:', response.choices[0].finish_reason);
    console.log('📥 Tokens:', response.usage.completion_tokens, '/', response.usage.total_tokens);

    const cleanedHTML = VisualPromptBuilder.cleanResponse(rawContent);
    const slideCountGenerated = (cleanedHTML.match(/<section[^>]*class="slide"/gi) || []).length;

    console.log('📊 Slides gerados:', slideCountGenerated, '/', slideCount);

    if (slideCountGenerated < slideCount) {
      console.error(`❌ PROBLEMA: ${slideCountGenerated} slides de ${slideCount}!`);
    }

    const validation = VisualPromptBuilder.validateResponse(cleanedHTML);
    console.log('📊 Validação:', validation.score + '%\n');

    return {
      html: cleanedHTML,
      htmlContent: cleanedHTML,
      title: this.extractTitleFromHTML(cleanedHTML),
      type: 'complete-html',
      generatedAt: new Date().toISOString(),
      config,
      provider: this.provider,
      model: this.model,
      validation,
      slideCountGenerated
    };
  }

  extractTitleFromHTML(html) {
    try {
      const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      return match ? match[1] : 'Apresentação Darede';
    } catch {
      return 'Apresentação Darede';
    }
  }

  generateSimpleFallback(briefing, config) {
    return {
      success: true,
      data: this.generateHTMLFallback(config)
    };
  }

  generateHTMLFallback(config) {
    const slideCount = parseInt(config.slideCount) || 6;
    const company = config.company || 'Cliente';
    const briefing = config.briefing || '';

    const html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Apresentação ' + company + '</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: Inter, sans-serif; background: #f5f5f5; overflow: hidden; } .slide { width: 100vw; height: 100vh; position: absolute; display: none; padding: 60px; } .slide.active { display: flex; flex-direction: column; justify-content: center; align-items: center; } .slide-cover { background: linear-gradient(135deg, #1e5c3f 0%, #2d8659 100%); color: white; text-align: center; } .slide-cover h1 { font-size: 3rem; margin: 30px 0; } .navigation { position: fixed; bottom: 30px; right: 30px; } .nav-btn { background: #1e5c3f; color: white; border: none; width: 50px; height: 50px; border-radius: 50%; margin: 0 5px; cursor: pointer; } .nav-btn:hover { background: #ff9500; }</style></head><body><div class="slide slide-cover active" data-slide="1"><img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" width="200"><h1>Apresentação ' + company + '</h1><p>' + new Date().toLocaleDateString('pt-BR') + '</p></div><div class="navigation"><button class="nav-btn">←</button><button class="nav-btn">→</button></div></body></html>';

    return {
      html,
      htmlContent: html,
      title: 'Apresentação ' + company,
      type: 'complete-html',
      generatedAt: new Date().toISOString(),
      config,
      provider: 'fallback'
    };
  }
}

module.exports = OpenAIService;
