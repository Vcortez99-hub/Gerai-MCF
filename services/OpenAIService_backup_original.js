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
      this.model = process.env.OPENAI_MODEL || 'gpt-5-mini';
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

    const templateHeader = '🎨 **TEMPLATE OBRIGATÓRIO - CONSISTÊNCIA MÁXIMA:**\n\n' +
      'USAR O PADRÃO EXATO:\n' +
      '- Font: \'Inter\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif\n'
- Cores: Verde (#1e5c3f), Laranja (#ff9500/#ffb700)
- Background: #ffffff (branco limpo)
- Navegação: Botões circulares com indicador de slide
- Logo: https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png

⚠️ **REGRAS CRÍTICAS DE CONTRASTE:**
- NUNCA use texto branco (#ffffff, #fff, white) em fundos brancos
- NUNCA use texto verde (#1e5c3f) em fundos verdes
- NUNCA use texto laranja (#ff9500) em fundos laranja
- FUNDOS BRANCOS: Use texto escuro (#2c2c2c, #1a1a1a, #333333)
- FUNDOS VERDES: Use texto branco (#ffffff) ou amarelo claro (#ffeb3b)
- FUNDOS COLORIDOS: Sempre contraste alto (claro em escuro, escuro em claro)
- IMAGENS: Nunca brancas em fundo branco - use bordas ou sombras se necessário

📋 **ESTRUTURA EXATA DOS SLIDES:**

**SLIDE 1 (CAPA):**
<div class="slide slide-cover active">
    <img class="cover-logo" src="https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png" alt="Darede">
    <div class="dots-decoration">[grid 5x2 dots]</div>
    <div class="cover-content">
        <div class="ai-icon">[ícone SVG relacionado ao tema]</div>
        <div class="cover-title">
            <div class="separator-line"></div>
            <h1>[TÍTULO PRINCIPAL]</h1>
        </div>
    </div>
    <div class="partner-badges">
        <div class="badge">AWS Partner</div>
        <div class="badge isg-badge">ISG ★ 2022</div>
    </div>
</div>

**SLIDES DE CONTEÚDO (2 até N-1):**
<div class="slide content-slide">
    <img class="slide-logo" src="https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png" alt="Darede" style="filter: none;">
    <div class="dots-decoration">[5 dots]</div>
    <div class="slide-header">
        <h2>[TÍTULO] <span class="highlight-text">[DESTAQUE]</span></h2>
    </div>

    <!-- ESCOLHER LAYOUT APROPRIADO: -->
    <!-- Para pilares/tópicos: -->
    <div class="pillars-grid">[pillar-cards com ícones SVG]</div>
    <!-- Para benefícios: -->
    <div class="benefits-list">[benefit-items com ícones]</div>
    <!-- Para estatísticas: -->
    <div class="stats-grid">[stat-cards com números grandes]</div>
    <!-- Para processos: -->
    <div class="journey-container">[journey-phases]</div>
    <!-- GRÁFICOS SEMPRE QUE PERTINENTE (DIMENSÕES CONTROLADAS): -->
    <!-- Gráfico de Barras: -->
    <div class="chart-container">
        <h3 class="chart-title">Título do Gráfico</h3>
        <svg class="chart-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="gradBar" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#1e5c3f"/>
                    <stop offset="100%" stop-color="#ff9500"/>
                </linearGradient>
            </defs>
            <rect class="bar-smooth" x="50" y="150" width="30" height="80" rx="6" fill="url(#gradBar)"/>
        </svg>
    </div>
    <!-- Gráfico de Pizza: -->
    <div class="chart-container">
        <h3 class="chart-title">Distribuição</h3>
        <svg class="chart-svg" viewBox="0 0 300 250" preserveAspectRatio="xMidYMid meet">
            <circle class="pie-slice" cx="150" cy="125" r="60" fill="url(#gradBar)"/>
        </svg>
    </div>
    <!-- Sankey (fluxos): -->
    <div class="sankey-container">
        <h3 class="chart-title">Fluxo de Recursos</h3>
        <svg class="sankey-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="sankeyFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#1e5c3f"/>
                    <stop offset="100%" stop-color="#ff9500"/>
                </linearGradient>
            </defs>
        </svg>
    </div>
</div>

**SLIDE FINAL (CONTATO) - COPIAR EXATAMENTE:**
<div class="slide slide-cover">
    <img class="cover-logo" src="https://lps-geral.s3.us-east-1.amazonaws.com/agente-ia-empresas/assets/logo-darede-white.png" alt="Darede">
    <div class="dots-decoration">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
    <div class="cover-content">
        <div class="contact-header">
            <div class="contact-icon-main">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="#1e5c3f">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
            </div>
            <h2 style="font-size: 3.5rem; font-weight: 700; color: #2c2c2c; margin: 20px 0;">COMERCIAL</h2>
            <div style="width: 80px; height: 5px; background: #ffa500; margin: 20px auto;"></div>
        </div>

        <div style="margin-top: 60px; display: flex; flex-direction: column; gap: 25px; align-items: center;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 45px; height: 45px; background: #1e5c3f; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                </div>
                <span style="font-size: 1.1rem; color: #2c2c2c;">comercial@darede.com.br</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 45px; height: 45px; background: #1e5c3f; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                </div>
                <span style="font-size: 1.1rem; color: #2c2c2c;">+55 (11) 3900-1010</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 45px; height: 45px; background: #1e5c3f; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                </div>
                <span style="font-size: 1.1rem; color: #2c2c2c;">linkedin.com/company/darede</span>
            </div>
        </div>
    </div>
</div>

🚀 **CSS OBRIGATÓRIO DO TEMPLATE DAREDE - COPIE EXATAMENTE:**

IMPORTANTE: Use EXATAMENTE este CSS (não modifique cores, fontes ou estruturas):

<head>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
    background: #0a0a0a;
}

.presentation-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    background: #ffffff;
}

.slide {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    opacity: 0;
    transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide.active {
    display: flex;
    opacity: 1;
}

.slide.transitioning {
    display: flex;
}

/* Slide Cover */
.slide-cover {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    position: relative;
    overflow: hidden;
    align-items: center;
    justify-content: center;
}

.slide-cover::before {
    content: '';
    position: absolute;
    top: -10%;
    left: -5%;
    width: 30%;
    height: 70%;
    background: #1e5c3f;
    border-radius: 0 0 50% 0;
}

.slide-cover::after {
    content: '';
    position: absolute;
    bottom: -10%;
    right: -5%;
    width: 40%;
    height: 55%;
    background: #1e5c3f;
    border-radius: 50% 0 0 0;
}

.cover-logo {
    position: absolute;
    top: 3rem;
    left: 3rem;
    height: 3rem;
    z-index: 10;
    filter: brightness(0) invert(1);
}

.cover-content {
    position: relative;
    z-index: 10;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 0 2rem;
    max-width: 1200px;
}

.ai-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #ff9500, #ffb700);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(255, 149, 0, 0.25);
}

.cover-title h1 {
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.1;
    margin-bottom: 0.5rem;
    max-width: 75%;
    text-align: center;
}

.cover-subtitle {
    font-size: clamp(1rem, 2vw, 1.3rem);
    font-weight: 500;
    color: #4a4a4a;
    margin-bottom: 0.5rem;
}

.cover-date {
    font-size: 1rem;
    color: #666;
    font-weight: 400;
}

.separator-line {
    width: 4px; height: clamp(60px, 10vh, 100px);
    background: linear-gradient(180deg, #ffa500, #ffcc00);
}

.partner-badges {
    position: absolute;
    bottom: 3rem;
    right: 3rem;
    display: flex;
    gap: 1rem;
    z-index: 10;
}

.badge {
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    font-size: 0.875rem;
    font-weight: 600;
    color: #2c2c2c;
}

/* Content Slides */
.content-slide {
    background: #ffffff;
    padding: 3rem 4rem;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.slide-logo {
    position: absolute;
    top: 2rem;
    right: 3rem;
    height: 2.5rem;
    z-index: 15;
}

.slide-header {
    margin-bottom: 2.5rem;
    position: relative;
    z-index: 5;
}

.slide-header h2 {
    font-size: clamp(1.75rem, 3vw, 2.25rem);
    font-weight: 700;
    color: #1a1a1a;
    line-height: 1.2;
}

.highlight-text {
    color: #ff9500;
}

.green-text {
    color: #1e5c3f;
}

.dots-decoration {
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    display: grid;
    grid-template-columns: repeat(3, 6px);
    grid-template-rows: repeat(3, 6px);
    gap: 6px;
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff9500;
    opacity: 0.4;
}

/* Pillars Grid */
.pillars-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 18px; margin-top: 40px;
    position: relative; z-index: 5;
}

.pillar-card {
    background: #1e5c3f; border-radius: 18px;
    padding: 35px 25px; text-align: center;
    color: white; position: relative;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 10px 25px rgba(30, 92, 63, 0.2);
}

.pillar-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 35px rgba(30, 92, 63, 0.3);
}

.pillar-icon {
    width: clamp(50px, 8vw, 70px);
    height: clamp(50px, 8vw, 70px);
    background: #ffa500; border-radius: 50%;
    margin: clamp(-50px, -8vw, -70px) auto clamp(15px, 2vh, 20px);
    display: flex; align-items: center; justify-content: center;
    font-size: clamp(24px, 4vw, 30px);
    color: white; box-shadow: 0 5px 20px rgba(255, 165, 0, 0.3);
}

.pillar-card h3 {
    font-size: clamp(0.9rem, 1.5vw, 1.1rem);
    font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* GRÁFICOS PROFISSIONAIS TIPO POWERPOINT */
.chart-container {
    margin: 20px 0; padding: 20px; background: white;
    border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.06);
    position: relative; overflow: hidden;
    transition: all 0.3s ease;
    max-width: 100%; width: 100%;
}
.chart-container:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }

.chart-svg {
    width: 100%; height: auto; max-height: 300px;
    filter: drop-shadow(0 3px 6px rgba(0,0,0,0.08));
    transition: all 0.3s ease;
}

/* Gráfico de Barras Suaves */
.bar-smooth {
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
    transition: all 0.3s ease;
}
.bar-smooth:hover { filter: drop-shadow(0 6px 12px rgba(0,0,0,0.2)); }

/* Gráfico de Pizza 3D */
.pie-slice {
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.2));
    transition: all 0.3s ease;
}

/* Sankey Diagram Melhorado */
.sankey-container {
    margin: 25px 0; padding: 20px; background: white;
    border-radius: 12px; box-shadow: 0 6px 20px rgba(30, 92, 63, 0.08);
    position: relative; overflow: hidden;
    max-width: 100%; width: 100%;
}

.sankey-svg {
    width: 100%; height: 250px; max-height: 250px;
    filter: drop-shadow(0 3px 8px rgba(0,0,0,0.08));
}

/* Gradientes PowerPoint */
.gradient-bar { fill: url(#gradientBar); }
.gradient-pie { fill: url(#gradientPie); }

/* ANIMAÇÕES PROFISSIONAIS MELHORADAS */

/* Transições de slides mais impactantes */
.slide {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: none;
    opacity: 0;
    transform: translateX(100px) scale(0.98);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    filter: blur(1px);
}

.slide.active {
    display: flex;
    opacity: 1;
    transform: translateX(0) scale(1);
    filter: blur(0);
}

.slide.transitioning {
    display: flex;
}

/* Animações de entrada para elementos internos */
@keyframes slideInFromRight {
    0% {
        opacity: 0;
        transform: translateX(60px) scale(0.9);
        filter: blur(2px);
    }
    100% {
        opacity: 1;
        transform: translateX(0) scale(1);
        filter: blur(0);
    }
}

@keyframes slideInFromLeft {
    0% {
        opacity: 0;
        transform: translateX(-60px) scale(0.9);
        filter: blur(2px);
    }
    100% {
        opacity: 1;
        transform: translateX(0) scale(1);
        filter: blur(0);
    }
}

@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
        filter: blur(1px);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}

@keyframes fadeInDown {
    0% {
        opacity: 0;
        transform: translateY(-40px) scale(0.95);
        filter: blur(1px);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}

@keyframes scaleIn {
    0% {
        opacity: 0;
        transform: scale(0.8) rotate(-2deg);
        filter: blur(2px);
    }
    100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
        filter: blur(0);
    }
}

@keyframes chartFadeIn {
    0% {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
        filter: blur(1px);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
}

/* Aplicar animações aos elementos */
.slide-header h2 {
    animation: slideInFromLeft 1.2s ease-out 0.2s both;
}

.slide-header .highlight-text {
    animation: slideInFromRight 1.2s ease-out 0.4s both;
}

.pillar-card {
    animation: fadeInUp 1.0s ease-out both;
}

.pillar-card:nth-child(1) { animation-delay: 0.3s; }
.pillar-card:nth-child(2) { animation-delay: 0.5s; }
.pillar-card:nth-child(3) { animation-delay: 0.7s; }

.stat-card {
    animation: scaleIn 0.8s ease-out both;
}

.stat-card:nth-child(1) { animation-delay: 0.2s; }
.stat-card:nth-child(2) { animation-delay: 0.4s; }
.stat-card:nth-child(3) { animation-delay: 0.6s; }

.chart-container {
    animation: chartFadeIn 1.2s ease-out 0.4s both;
}

.benefit-item {
    animation: slideInFromLeft 0.8s ease-out both;
}

.benefit-item:nth-child(1) { animation-delay: 0.1s; }
.benefit-item:nth-child(2) { animation-delay: 0.3s; }
.benefit-item:nth-child(3) { animation-delay: 0.5s; }
.benefit-item:nth-child(4) { animation-delay: 0.7s; }

.journey-phase {
    animation: fadeInUp 1.0s ease-out both;
}

.journey-phase:nth-child(1) { animation-delay: 0.2s; }
.journey-phase:nth-child(2) { animation-delay: 0.4s; }
.journey-phase:nth-child(3) { animation-delay: 0.6s; }
.journey-phase:nth-child(4) { animation-delay: 0.8s; }

/* Efeitos hover mais sofisticados */
.pillar-card {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.pillar-card:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 20px 40px rgba(30, 92, 63, 0.3);
    filter: brightness(1.05);
}

.chart-container {
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.chart-container:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 30px rgba(0,0,0,0.15);
}

/* Animações para elementos SVG */
.bar-smooth {
    animation: slideInFromBottom 1.2s ease-out both;
    transition: all 0.3s ease;
}

.bar-smooth:hover {
    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.25));
    transform: scaleY(1.05);
}

.pie-slice {
    animation: rotateIn 1.5s ease-out both;
    transition: all 0.3s ease;
}

@keyframes slideInFromBottom {
    0% {
        opacity: 0;
        transform: translateY(50px) scaleY(0.1);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scaleY(1);
    }
}

@keyframes rotateIn {
    0% {
        opacity: 0;
        transform: rotate(-180deg) scale(0.5);
    }
    100% {
        opacity: 1;
        transform: rotate(0deg) scale(1);
    }
}

/* Animação para logos e ícones */
.cover-logo, .slide-logo {
    animation: fadeInDown 1.0s ease-out 0.1s both;
    transition: all 0.3s ease;
}

.cover-logo:hover, .slide-logo:hover {
    transform: scale(1.05) rotate(2deg);
}

.ai-icon {
    animation: scaleIn 1.2s ease-out 0.6s both;
    transition: all 0.3s ease;
}

.ai-icon:hover {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 15px 35px rgba(255, 149, 0, 0.4);
}

/* Animação para dots decoration */
.dot {
    animation: fadeIn 0.5s ease-out both;
}

.dot:nth-child(1) { animation-delay: 0.1s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.3s; }
.dot:nth-child(4) { animation-delay: 0.4s; }
.dot:nth-child(5) { animation-delay: 0.5s; }

@keyframes fadeIn {
    0% { opacity: 0; transform: scale(0.3); }
    100% { opacity: 0.4; transform: scale(1); }
}

/* Animações para badges e elementos de contato */
.badge {
    animation: slideInFromRight 0.8s ease-out 1.0s both;
}

.badge:nth-child(2) { animation-delay: 1.2s; }

.contact-item {
    animation: slideInFromLeft 0.8s ease-out both;
}

.contact-item:nth-child(1) { animation-delay: 0.3s; }
.contact-item:nth-child(2) { animation-delay: 0.5s; }
.contact-item:nth-child(3) { animation-delay: 0.7s; }

/* Efeito de pulsação para elementos importantes */
.highlight-text {
    animation: slideInFromRight 1.2s ease-out 0.4s both, pulse 2s infinite 2s;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

/* Transições suaves para navegação */
.nav-btn {
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.nav-btn:hover:not(:disabled) {
    background: #ffa500;
    transform: scale(1.15) rotate(5deg);
    box-shadow: 0 8px 20px rgba(255, 165, 0, 0.3);
}

/* MELHORIAS EXTRAS PARA APRESENTAÇÕES PROFISSIONAIS */

/* Efeitos de profundidade e camadas */
.slide::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 0%, rgba(255, 165, 0, 0.02) 50%, transparent 100%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.6s ease;
    z-index: 1;
}

.slide.active::before {
    opacity: 1;
}

/* Micro-interações para cards */
.pillar-card, .stat-card, .driver-card {
    cursor: pointer;
    user-select: none;
}

.pillar-card:active, .stat-card:active, .driver-card:active {
    transform: scale(0.98);
}

/* Efeito parallax sutil nos backgrounds */
.slide-cover::before,
.slide-cover::after {
    transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-cover.active::before {
    transform: translateX(-5px) translateY(-3px);
}

.slide-cover.active::after {
    transform: translateX(3px) translateY(5px);
}

/* Animações de entrada escalonadas para listas */
.opportunities-list .opportunity-item {
    animation: slideInFromLeft 0.6s ease-out both;
}

.opportunities-list .opportunity-item:nth-child(1) { animation-delay: 0.1s; }
.opportunities-list .opportunity-item:nth-child(2) { animation-delay: 0.2s; }
.opportunities-list .opportunity-item:nth-child(3) { animation-delay: 0.3s; }
.opportunities-list .opportunity-item:nth-child(4) { animation-delay: 0.4s; }
.opportunities-list .opportunity-item:nth-child(5) { animation-delay: 0.5s; }

/* Indicador de progressão visual melhorado */
.progress-indicator {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 8px 12px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-dot:hover {
    transform: scale(1.3);
    box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
}

/* Efeitos de typing para títulos dinâmicos */
@keyframes typing {
    0% { width: 0; }
    100% { width: 100%; }
}

@keyframes blinkCaret {
    0%, 50% { border-color: #ffa500; }
    51%, 100% { border-color: transparent; }
}

.cover-title h1.typing-effect {
    overflow: hidden;
    white-space: nowrap;
    border-right: 3px solid #ffa500;
    animation: typing 2s steps(40, end) 1s both, blinkCaret 1s step-end 3s infinite;
    max-width: none;
}

/* Melhorias em gráficos - efeitos 3D sutis */
.bar-smooth:hover {
    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.25)) drop-shadow(0 0 8px rgba(255, 165, 0, 0.3));
    transform: scaleY(1.05) perspective(100px) rotateX(2deg);
}

.pie-slice:hover {
    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.2)) drop-shadow(0 0 15px rgba(30, 92, 63, 0.4));
    transform: scale(1.02) perspective(100px) rotateY(2deg);
}

/* Animações de carregamento para elementos pesados */
.chart-container.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #ffa500;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Estados de foco aprimorados para acessibilidade */
.nav-btn:focus-visible {
    outline: 2px solid #ffa500;
    outline-offset: 2px;
}

/* Otimizações para diferentes tamanhos de tela */
@media (max-width: 768px) {
    /* Reduzir animações em telas menores para performance */
    .slide {
        transition: all 0.5s ease;
    }

    .pillar-card, .stat-card, .chart-container {
        animation-duration: 0.6s;
    }

    /* Simplificar efeitos hover em touch devices */
    .pillar-card:hover {
        transform: translateY(-6px) scale(1.01);
    }
}

@media (prefers-reduced-motion: reduce) {
    /* Respeitar preferência de usuários por menos movimento */
    .slide,
    .pillar-card,
    .stat-card,
    .chart-container,
    .benefit-item,
    .journey-phase {
        animation: none !important;
        transition: opacity 0.3s ease !important;
    }

    .slide.active {
        opacity: 1;
    }
}

/* Efeitos especiais para momentos de destaque */
.highlight-moment {
    position: relative;
}

.highlight-moment::after {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(45deg, #ffa500, #1e5c3f, #ffa500);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    filter: blur(10px);
    animation: highlightPulse 3s ease-in-out infinite;
}

@keyframes highlightPulse {
    0%, 100% { opacity: 0; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(1.02); }
}

/* Transições entre diferentes tipos de slide */
.slide[data-slide-type="intro"] {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.slide[data-slide-type="content"] {
    background: #ffffff;
}

.slide[data-slide-type="conclusion"] {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

/* Legendas e Títulos */
.chart-title {
    font-size: 1.3rem; font-weight: 600; color: #2c2c2c;
    text-align: center; margin-bottom: 15px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Responsividade para Gráficos */
@media (max-width: 768px) {
    .chart-container {
        margin: 15px 0; padding: 15px;
        max-width: 100%; box-sizing: border-box;
    }
    .chart-svg {
        max-height: 220px;
    }
    .sankey-svg {
        height: 200px; max-height: 200px;
    }
    .chart-title {
        font-size: 1.1rem; margin-bottom: 10px;
    }
}

@media (max-width: 480px) {
    .chart-container {
        margin: 10px 0; padding: 12px;
    }
    .chart-svg {
        max-height: 180px;
    }
    .sankey-svg {
        height: 160px; max-height: 160px;
    }
}

/* Navigation */
.navigation {
    position: fixed; bottom: 2rem; right: 2rem;
    z-index: 100; display: flex; gap: 0.5rem;
    background: rgba(255, 255, 255, 0.95);
    padding: 0.5rem;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.nav-btn {
    width: 40px; height: 40px; border: none;
    background: rgba(30, 92, 63, 0.8);
    color: white; border-radius: 50%;
    cursor: pointer; font-size: 16px;
    transition: all 0.3s ease;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(5px);
}

.nav-btn:hover:not(:disabled) {
    background: #ffa500; transform: scale(1.1);
}

.nav-btn:disabled {
    opacity: 0.3; cursor: not-allowed;
}

/* Stats Cards */
.stats-container {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    flex: 1;
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid #e9ecef;
}

.stat-label {
    font-size: 0.875rem;
    color: #6c757d;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.stat-value {
    font-size: clamp(1.5rem, 2.5vw, 2rem);
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.stat-description {
    font-size: 0.75rem;
    color: #6c757d;
    line-height: 1.4;
}

/* Driver Cards */
.drivers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
}

.driver-card {
    background: #1e5c3f;
    border-radius: 12px;
    padding: 1.5rem;
    color: white;
    position: relative;
    transition: transform 0.2s ease;
}

.driver-card:hover {
    transform: translateY(-2px);
}

.driver-icon {
    width: 50px;
    height: 50px;
    background: #ff9500;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.driver-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.driver-card p {
    font-size: 0.875rem;
    line-height: 1.4;
    opacity: 0.95;
}

/* Opportunities List */
.opportunities-list {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1.5rem;
}

.opportunity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
}

.opportunity-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.opportunity-indicator {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-top: 0.25rem;
    flex-shrink: 0;
}

.opportunity-content {
    flex: 1;
}

.opportunity-title {
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
}

.opportunity-details {
    font-size: 0.875rem;
    color: #6c757d;
}

.complexity-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
}

.complexity-easy {
    background: #d4f4dd;
    color: #1e5c3f;
}

.complexity-medium {
    background: #fff3cd;
    color: #856404;
}

.complexity-hard {
    background: #f8d7da;
    color: #721c24;
}

/* Contact Slide */
.contact-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
    color: white;
    z-index: 10;
}

.contact-title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    letter-spacing: -1px;
}

.contact-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.contact-icon {
    width: 45px;
    height: 45px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.contact-text {
    font-size: 1.125rem;
    font-weight: 400;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .content-slide {
        padding: 2rem 1.5rem;
    }

    .stats-container {
        flex-direction: column;
    }

    .drivers-grid {
        grid-template-columns: 1fr;
    }

    .slide-logo {
        height: 2rem;
        right: 1.5rem;
    }
}
</style>
</head>

⚡ **JAVASCRIPT PROFISSIONAL MELHORADO:**
Sistema completo de navegação com animações sequenciadas:

<script>
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
let isTransitioning = false;
let animationTimeouts = [];

// Função principal de mudança de slides
function changeSlide(direction) {
    if (isTransitioning) return;
    const newSlide = currentSlide + direction;
    if (newSlide < 0 || newSlide >= totalSlides) return;

    isTransitioning = true;
    clearAllAnimationTimeouts();

    // Transição suave entre slides
    slides[currentSlide].classList.add('transitioning');
    slides[newSlide].classList.add('transitioning');
    slides[currentSlide].classList.remove('active');

    // Delay para permitir transição visual
    setTimeout(() => {
        slides[newSlide].classList.add('active');
        triggerSlideAnimations(newSlide);
    }, 100);

    // Finalizar transição
    setTimeout(() => {
        slides[currentSlide].classList.remove('transitioning');
        slides[newSlide].classList.remove('transitioning');
        currentSlide = newSlide;
        updateButtons();
        isTransitioning = false;
    }, 1000);
}

// Sistema de animações sequenciadas para elementos internos
function triggerSlideAnimations(slideIndex) {
    const slide = slides[slideIndex];
    if (!slide) return;

    // Reset todas as animações do slide
    const animatedElements = slide.querySelectorAll('[data-animate], .pillar-card, .stat-card, .chart-container, .benefit-item, .journey-phase');
    animatedElements.forEach(element => {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = null;
    });

    // Animar elementos específicos com delays sequenciados
    animateSlideElements(slide);
}

// Animar elementos do slide de forma sequenciada
function animateSlideElements(slide) {
    const elements = {
        headers: slide.querySelectorAll('.slide-header h2'),
        highlights: slide.querySelectorAll('.highlight-text'),
        pillars: slide.querySelectorAll('.pillar-card'),
        stats: slide.querySelectorAll('.stat-card'),
        charts: slide.querySelectorAll('.chart-container'),
        benefits: slide.querySelectorAll('.benefit-item'),
        journey: slide.querySelectorAll('.journey-phase'),
        contacts: slide.querySelectorAll('.contact-item'),
        badges: slide.querySelectorAll('.badge')
    };

    // Headers aparecem primeiro
    elements.headers.forEach((el, i) => {
        el.style.animationDelay = (0.2 + i * 0.1) + 's';
    });

    // Highlights em seguida
    elements.highlights.forEach((el, i) => {
        el.style.animationDelay = (0.4 + i * 0.1) + 's';
    });

    // Cards e elementos principais
    elements.pillars.forEach((el, i) => {
        el.style.animationDelay = (0.3 + i * 0.2) + 's';
    });

    elements.stats.forEach((el, i) => {
        el.style.animationDelay = (0.2 + i * 0.2) + 's';
    });

    elements.benefits.forEach((el, i) => {
        el.style.animationDelay = (0.1 + i * 0.2) + 's';
    });

    elements.journey.forEach((el, i) => {
        el.style.animationDelay = (0.2 + i * 0.2) + 's';
    });

    // Charts aparecem por último para máximo impacto
    elements.charts.forEach((el, i) => {
        el.style.animationDelay = (0.6 + i * 0.1) + 's';
    });

    // Elementos de contato
    elements.contacts.forEach((el, i) => {
        el.style.animationDelay = (0.3 + i * 0.2) + 's';
    });

    elements.badges.forEach((el, i) => {
        el.style.animationDelay = (1.0 + i * 0.2) + 's';
    });
}

// Limpar timeouts de animação
function clearAllAnimationTimeouts() {
    animationTimeouts.forEach(timeout => clearTimeout(timeout));
    animationTimeouts = [];
}

// Atualizar botões de navegação
function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
}

// Navegação por teclado aprimorada
document.addEventListener('keydown', (e) => {
    if (isTransitioning) return;

    switch(e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
            if (currentSlide > 0) changeSlide(-1);
            break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ': // Espaço
            if (currentSlide < totalSlides - 1) changeSlide(1);
            break;
        case 'Home':
            if (currentSlide !== 0) {
                currentSlide = 0;
                changeSlide(0);
            }
            break;
        case 'End':
            if (currentSlide !== totalSlides - 1) {
                currentSlide = totalSlides - 2;
                changeSlide(1);
            }
            break;
    }
});

// Navegação por touch/swipe para mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Detectar swipe horizontal
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && currentSlide < totalSlides - 1) {
            changeSlide(1); // Swipe left = próximo
        } else if (diffX < 0 && currentSlide > 0) {
            changeSlide(-1); // Swipe right = anterior
        }
    }

    touchStartX = 0;
    touchStartY = 0;
});

// Auto-play opcional (desabilitado por padrão)
let autoPlayInterval = null;
function startAutoPlay(intervalMs = 8000) {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
        if (currentSlide < totalSlides - 1) {
            changeSlide(1);
        } else {
            currentSlide = -1;
            changeSlide(1); // Volta ao início
        }
    }, intervalMs);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

// Pausar auto-play quando usuário interage
document.addEventListener('keydown', stopAutoPlay);
document.addEventListener('touchstart', stopAutoPlay);

// Indicador de progresso visual
function createProgressIndicator() {
    const nav = document.querySelector('.navigation');
    if (!nav || totalSlides <= 1) return;

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-indicator';
    progressContainer.style.cssText = 'display: flex; gap: 8px; margin-left: 15px; align-items: center;';

    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        dot.style.cssText = 'width: 8px; height: 8px; border-radius: 50%; background: ' + (i === 0 ? '#ffa500' : 'rgba(255, 255, 255, 0.4)') + '; transition: all 0.3s ease; cursor: pointer;';

        dot.addEventListener('click', () => {
            if (i !== currentSlide) {
                const direction = i > currentSlide ? 1 : -1;
                currentSlide = i - direction;
                changeSlide(direction);
            }
        });

        progressContainer.appendChild(dot);
    }

    nav.appendChild(progressContainer);

    // Atualizar indicadores quando slide muda
    const originalUpdateButtons = updateButtons;
    updateButtons = function() {
        originalUpdateButtons();
        const dots = progressContainer.querySelectorAll('.progress-dot');
        dots.forEach((dot, i) => {
            dot.style.background = (i === currentSlide) ? '#ffa500' : 'rgba(255, 255, 255, 0.4)';
        });
    };
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateButtons();
    createProgressIndicator();

    // Animar primeiro slide
    if (slides[0]) {
        triggerSlideAnimations(0);
    }

    // Preload próximo slide para performance
    if (slides[1]) {
        slides[1].style.display = 'none';
    }
});

// Performance: Preload slides adjacentes
function preloadAdjacentSlides() {
    const prevSlide = currentSlide - 1;
    const nextSlide = currentSlide + 1;

    if (slides[prevSlide]) {
        slides[prevSlide].style.display = 'none';
    }
    if (slides[nextSlide]) {
        slides[nextSlide].style.display = 'none';
    }
}

// Atualizar preload após mudança de slide
const originalChangeSlide = changeSlide;
changeSlide = function(direction) {
    originalChangeSlide(direction);
    setTimeout(preloadAdjacentSlides, 1100);
};
</script>

🚀 **FORMATO FINAL:** Retorne APENAS HTML completo usando EXATAMENTE este CSS e JavaScript, adaptando apenas o CONTEÚDO ao briefing solicitado.

⚠️ **REGRAS ESSENCIAIS PARA MÁXIMA CONSISTÊNCIA:**

0. **CONTRASTE OBRIGATÓRIO**:
   - JAMAIS texto branco em fundo branco
   - JAMAIS texto verde em fundo verde
   - JAMAIS cores similares juntas
   - Fundos brancos = texto escuro (#2c2c2c)
   - Fundos coloridos = contraste alto sempre

1. **FONTE**: SEMPRE use 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
2. **CORES**: Verde (#1e5c3f), Laranja (#ff9500), cinza (#1a1a1a) para textos
3. **SLIDE FINAL**: EXATAMENTE igual à referência com SVG icons e layout de contato
4. **ESPAÇAMENTO**: Headers com margin-bottom: 2.5rem, padding consistente 3rem 4rem
5. **DOTS**: 3x3 grid com 6px cada, gap 6px, opacity 0.4, cor #ff9500
6. **STATS CARDS**: Use .stat-card, .stat-label, .stat-value com cores e tamanhos corretos
7. **GRÁFICOS OBRIGATÓRIOS (DIMENSÕES CONTROLADAS)**: SEMPRE gere gráficos visuais quando pertinente aos dados:
   - **DIMENSÕES**: Use viewBox="0 0 400 250" para barras, "0 0 300 250" para pizza, "0 0 400 200" para Sankey
   - **PRESERVAR ASPECTO**: Sempre adicione preserveAspectRatio="xMidYMid meet" nos SVGs
   - **SANKEY**: Para fluxos (custos, processos, recursos) usando SVG com gradientes #1e5c3f → #ff9500
   - **BARRAS**: Para comparações, altura máxima 80px, bordas rx="6", gradientes verticais
   - **PIZZA**: Para proporções, raio máximo 60px, centro ajustado ao viewBox
   - **LINHAS**: Para tendências, pontos suaves, stroke-width="2"
   - **ÁREA**: Para volumes, preenchimento gradiente sutil
   - **TÍTULOS**: Sempre incluir <h3 class="chart-title"> antes do SVG
   - Todos responsivos, com max-height CSS controlado, profissionais tipo PowerPoint
8. **NAVIGATION**: Botões circulares com indicador de slide centralizado
9. **RESPONSIVE**: Media queries para mobile com padding 2rem 1.5rem
10. **LAYOUT**: Content sempre centralizado, sem elementos grudados no topo da tela

🎯 **ESTRUTURA OBRIGATÓRIA FINAL:**
Slide de contato DEVE ter:
- Fundo com formas geométricas verdes
- Ícone de pessoa centralizado
- Título "COMERCIAL" grande
- Linha laranja separadora
- Três contatos: email, telefone, LinkedIn
- SVG icons exatos da referência

✅ **VALIDAÇÃO**: Cada slide DEVE ter:
- Logo Darede posicionado corretamente
- Dots decoration no canto superior esquerdo
- Espaçamento adequado entre elementos
- Cores consistentes com a paleta definida
- Tipografia Inter aplicada em todos os textos`;
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