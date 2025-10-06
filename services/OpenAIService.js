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
      console.error('Erro:', error.message);

      return {
        success: true,
        data: this.generateHTMLFallback(config)
      };
    }
  }

  async generateWithOpenAI(briefing, config) {
    console.log('Gerando com OpenAI...');

    const prompt = await VisualPromptBuilder.build(briefing, config);

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "Você é especialista em criar apresentações HTML profissionais. Retorne APENAS código HTML válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 16000
    });

    const rawContent = response.choices[0].message.content;
    console.log('Resposta:', rawContent.length, 'chars');

    const cleanedHTML = VisualPromptBuilder.cleanResponse(rawContent);
    const validation = VisualPromptBuilder.validateResponse(cleanedHTML);

    console.log('Validação:', validation.score + '%');

    if (validation.errors.length > 0) {
      console.warn('Erros:', validation.errors);
    }

    return {
      html: cleanedHTML,
      htmlContent: cleanedHTML,
      title: this.extractTitleFromHTML(cleanedHTML),
      type: 'complete-html',
      generatedAt: new Date().toISOString(),
      config,
      provider: this.provider,
      model: this.model,
      validation
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
