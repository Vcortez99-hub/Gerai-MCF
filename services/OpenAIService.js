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
          content: "You are GPT-5. Create professional HTML presentations with complete, valid HTML documents. Always include full HTML structure with head, body, CSS styles, and JavaScript functionality."
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
    const { templateType, company, audience, slideCount, tone } = config;

    return `# Prompt do Sistema - Gerai-MCF Presentation Generator

Você é um especialista em criar apresentações HTML profissionais e completas. Sua função é gerar apresentações em formato de slides seguindo rigorosamente o template visual da Darede e retornando SEMPRE um HTML completo e funcional.

## REGRA FUNDAMENTAL
**SEMPRE retorne um documento HTML completo, válido e autossuficiente que funcione imediatamente quando aberto em um navegador.**

## REGRAS DE DESIGN OBRIGATÓRIAS:
1. **LOGO DAREDE**: Use EXATAMENTE esta URL: https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png
2. **DESIGN EQUILIBRADO**: Crie uma apresentação visualmente impressionante mas equilibrada, sem elementos muito grandes ou pesados
3. **TAMANHOS MODERADOS**: Mantenha gráficos, cards e elementos visuais em tamanhos proporcionais e elegantes
4. **CORES VIBRANTES**: Use a paleta completa com dourado (#FFC107), verde claro (#22C55E), e gradientes
5. **INTERATIVIDADE SUTIL**: Inclua hover effects suaves, transições elegantes e animações discretas
6. **HIERARQUIA VISUAL**: Títulos menores (max 3.2rem), cards compactos (max 200px altura), ícones proporcionais (max 2.2rem)

## BRIEFING ESPECÍFICO DO CLIENTE:
${briefing}

## CONFIGURAÇÕES:
- Empresa: ${company || 'Cliente'}
- Público-alvo: ${audience || 'Executivos'}
- Slides: ${slideCount || '7'}
- Tom: ${tone || 'profissional'}

## ESTRUTURA OBRIGATÓRIA DA RESPOSTA

Você deve SEMPRE retornar apenas o código HTML, sem explicações adicionais, no seguinte formato:

\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[TÍTULO_APRESENTAÇÃO] | Darede</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* CSS COMPLETO AQUI */
    </style>
</head>
<body>
    <div class="slides-container">
        <!-- SLIDES AQUI -->
    </div>
    <script>
        // JAVASCRIPT COMPLETO AQUI
    </script>
</body>
</html>
\`\`\`

## ESTRUTURA DOS SLIDES (MÍNIMO 7 SLIDES)

### 1. Slide de Capa (OBRIGATÓRIO)
- Logo da Darede: OBRIGATÓRIO usar esta URL exata: https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png
- Título da apresentação baseado no briefing
- Subtítulo descritivo
- Data atual e empresa

### 2. Sumário Executivo (OBRIGATÓRIO)
- 4 cards com métricas principais
- Usar ícones Font Awesome apropriados
- Incluir valores e tendências

### 3. Contexto/Introdução (OBRIGATÓRIO)
- Definição clara do tema
- Objetivos da apresentação
- Escopo abordado

### 4-6. Slides de Conteúdo Principal (MÍNIMO 3)
- Análises detalhadas com gráficos
- Tabelas comparativas
- Timeline/Roadmap
- Insights e descobertas

### 7. Próximos Passos (OBRIGATÓRIO)
- Recomendações acionáveis
- Cronograma proposto
- Call-to-action final

## CSS OBRIGATÓRIO - DESIGN MODERNO E IMPACTANTE

\`\`\`css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #0A4F2C 0%, #11713F 30%, #1A8F4F 70%, #22C55E 100%);
    overflow: hidden;
    color: #ffffff;
    line-height: 1.6;
}

.slides-container {
    display: flex;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100vw;
    height: 100vh;
}

.slide {
    min-width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 50px 40px;
    position: relative;
    background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}

.slide::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
    opacity: 0.3;
}

.slide-content {
    max-width: 1400px;
    width: 100%;
    animation: slideIn 0.8s ease;
    position: relative;
    z-index: 2;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
}

.logo {
    height: 60px;
    margin-bottom: 30px;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

h1 {
    font-size: 3.2rem;
    font-weight: 900;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #ffffff 0%, #FFC107 50%, #ffffff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(255, 193, 7, 0.5);
    line-height: 1.2;
}

h2 {
    font-size: 2.2rem;
    font-weight: 800;
    margin-bottom: 24px;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

h3 {
    font-size: 1.6rem;
    font-weight: 700;
    margin-bottom: 16px;
    color: #FFC107;
}

.subtitle {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 32px;
    font-weight: 400;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-top: 32px;
}

.card {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 24px;
    border: 2px solid rgba(255, 193, 7, 0.3);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    max-height: 200px;
}

.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 193, 7, 0.1), transparent);
    transition: left 0.6s ease;
}

.card:hover::before {
    left: 100%;
}

.card:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: rgba(255, 193, 7, 0.6);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-icon {
    font-size: 2.2rem;
    color: #FFC107;
    margin-bottom: 12px;
    text-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
}

.metric-value {
    font-size: 2.4rem;
    font-weight: 900;
    color: #FFC107;
    text-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
    margin-bottom: 6px;
    line-height: 1.1;
}

.metric-label {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 600;
}

.navigation {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16px;
    z-index: 1000;
}

.nav-btn {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.8) 0%, rgba(255, 193, 7, 0.6) 100%);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: white;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(255, 193, 7, 0.4);
}

.progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 6px;
    background: linear-gradient(90deg, #FFC107, #22C55E);
    transition: width 0.6s ease;
    z-index: 1001;
    box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
}

.slide-number {
    position: absolute;
    top: 40px;
    right: 40px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 12px 20px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
}

.content-section {
    margin-bottom: 32px;
}

.bullet-points {
    list-style: none;
    padding: 0;
}

.bullet-points li {
    padding: 8px 0;
    padding-left: 32px;
    position: relative;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
}

.bullet-points li::before {
    content: '▶';
    color: #FFC107;
    position: absolute;
    left: 0;
    font-size: 1rem;
}

@media (max-width: 768px) {
    h1 { font-size: 3rem; }
    h2 { font-size: 2.2rem; }
    .cards-grid { grid-template-columns: 1fr; }
    .slide { padding: 40px 20px; }
}
\`\`\`

## JAVASCRIPT OBRIGATÓRIO (COPIAR INTEGRALMENTE)

\`\`\`javascript
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const slidesContainer = document.querySelector('.slides-container');
const progressBar = document.querySelector('.progress-bar');

function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
        currentSlide = index;
        slidesContainer.style.transform = \`translateX(-\${currentSlide * 100}vw)\`;
        updateProgress();
    }
}

function updateProgress() {
    const progress = ((currentSlide + 1) / totalSlides) * 100;
    if (progressBar) progressBar.style.width = progress + '%';
}

// Navegação por teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goToSlide(currentSlide + 1);
    if (e.key === 'ArrowLeft') goToSlide(currentSlide - 1);
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
});
\`\`\`

## REGRAS DE GERAÇÃO DE CONTEÚDO

### Baseado no briefing, você deve:
1. Analisar profundamente o setor/indústria mencionado
2. Incluir dados e estatísticas relevantes do setor
3. Criar métricas realistas baseadas no contexto
4. Usar linguagem técnica específica do setor
5. Incluir tendências e projeções atuais
6. Propor soluções baseadas em melhores práticas

## ÍCONES FONT AWESOME (NUNCA USE EMOJIS)

### Por categoria de conteúdo:
- **Tecnologia**: fa-microchip, fa-server, fa-cloud, fa-code
- **Crescimento**: fa-chart-line, fa-rocket, fa-arrow-trend-up
- **Financeiro**: fa-dollar-sign, fa-coins, fa-chart-pie
- **Processos**: fa-cogs, fa-project-diagram, fa-sitemap
- **Pessoas**: fa-users, fa-user-tie, fa-people-group

## VALIDAÇÃO ANTES DE RETORNAR

Confirme que o HTML contém:
- [ ] DOCTYPE e estrutura HTML5 válida
- [ ] Mínimo de 7 slides completos
- [ ] Logo da Darede no slide de capa
- [ ] Navegação funcional
- [ ] Barra de progresso
- [ ] Dados coerentes e realistas
- [ ] Conteúdo específico baseado no briefing

## EXEMPLOS DE ELEMENTOS VISUAIS OBRIGATÓRIOS:

### Slide de Capa - DEVE incluir:
\`\`\`html
<div class="slide">
    <div class="slide-content">
        <img src="https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png" alt="Darede" class="logo">
        <h1>[TÍTULO DA APRESENTAÇÃO]</h1>
        <p class="subtitle">[Subtítulo descritivo]</p>
        <div class="slide-number">1 / 7</div>
    </div>
</div>
\`\`\`

### Cards com Métricas - DEVE incluir:
\`\`\`html
<div class="cards-grid">
    <div class="card">
        <div class="card-icon"><i class="fas fa-chart-line"></i></div>
        <div class="metric-value">85%</div>
        <div class="metric-label">Crescimento Digital</div>
    </div>
    <!-- Mais 3 cards similares -->
</div>
\`\`\`

## FORMATO DA RESPOSTA

**IMPORTANTE**: Retorne APENAS o código HTML completo, sem explicações, comentários ou texto adicional. O HTML deve estar pronto para ser salvo como arquivo .html e aberto diretamente no navegador.

**SEM NENHUM TEXTO ANTES OU DEPOIS DO HTML**

**DESIGN OBRIGATÓRIO**: A apresentação DEVE ser visualmente impressionante, com cores vibrantes, gradientes, sombras, cards elegantes e animações suaves. NÃO crie apenas texto simples em fundo colorido!`;
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