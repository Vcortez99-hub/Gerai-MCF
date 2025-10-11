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

    const systemMessage = `Você é um DESIGNER DE EXPERIÊNCIAS VISUAIS expert especializado em criar apresentações HTML impactantes e memoráveis.

🎯 MISSÃO CRÍTICA:
Criar EXATAMENTE ${slideCount} slides completos, cada um ÚNICO e IMPACTANTE.

⚠️ REGRA ABSOLUTA:
VOCÊ DEVE GERAR **TODOS OS ${slideCount} SLIDES** NO HTML.
NÃO pare após 1 ou 2 slides! Continue até completar TODOS os ${slideCount} slides!

FORMATO DE SAÍDA:
- Retorne APENAS código HTML válido
- De <!DOCTYPE html> até </html>
- SEM markdown (\`\`\`), SEM explicações
- TODOS os ${slideCount} slides devem estar no mesmo arquivo HTML
- Cada slide: <section class="slide" data-slide="N"> onde N vai de 1 até ${slideCount}

IMPORTANTE:
- Você tem 16384 tokens disponíveis - USE TODOS!
- Não economize! Crie os ${slideCount} slides completos!
- Siga EXATAMENTE as diretrizes de design do prompt do usuário!`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 16384
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
      console.log('🔄 Tentando regenerar com prompt mais enfático...');

      // Retry com prompt mais direto
      return this.retryGeneration(briefing, config, slideCount);
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

  async retryGeneration(briefing, config, slideCount) {
    console.log('🔄 RETRY: Gerando novamente com prompt COMPLETO...');

    // Usar o prompt completo do VisualPromptBuilder novamente
    const fullPrompt = await VisualPromptBuilder.build(briefing, config);

    const enhancedSystemMessage = `Você é um DESIGNER DE EXPERIÊNCIAS VISUAIS expert.

⚠️⚠️⚠️ ATENÇÃO CRÍTICA ⚠️⚠️⚠️

Você FALHOU na primeira tentativa porque gerou apenas ${slideCount < 6 ? slideCount : 1} slide(s).

AGORA você DEVE gerar TODOS OS ${slideCount} SLIDES!

ANTES de começar a escrever o HTML, PLANEJE mentalmente:
1. Slide 1: Capa impactante
2. Slide 2: [baseado no briefing]
3. Slide 3: [baseado no briefing]
... continue até o slide ${slideCount}

DEPOIS, escreva o HTML COMPLETO com TODOS os ${slideCount} slides.

NÃO pare de escrever até ter criado TODOS os ${slideCount} slides!

Use TODOS os 16384 tokens disponíveis!

Siga EXATAMENTE as diretrizes visuais e de design do prompt!`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: enhancedSystemMessage },
        { role: "user", content: fullPrompt }
      ],
      temperature: 0.8,
      max_completion_tokens: 16384
    });

    const cleanedHTML = VisualPromptBuilder.cleanResponse(response.choices[0].message.content);
    const generatedCount = (cleanedHTML.match(/<section[^>]*class="slide"/gi) || []).length;

    console.log('🔄 RETRY Resultado:', generatedCount, '/', slideCount, 'slides');

    return {
      html: cleanedHTML,
      htmlContent: cleanedHTML,
      title: this.extractTitleFromHTML(cleanedHTML),
      type: 'complete-html',
      generatedAt: new Date().toISOString(),
      config,
      provider: this.provider,
      model: this.model,
      slideCountGenerated: generatedCount,
      wasRetry: true,
      validation: VisualPromptBuilder.validateResponse(cleanedHTML)
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
