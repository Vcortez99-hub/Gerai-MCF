const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs-extra');
const path = require('path');

class ClaudeAIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'anthropic';

    if (this.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    } else {
      // Fallback to simple AI if no Claude key
      this.provider = 'simple';
    }
  }

  async generateContent(briefing, config) {
    try {
      let result;
      if (this.provider === 'anthropic') {
        result = await this.generateWithClaude(briefing, config);
      } else {
        result = this.generateSimple(briefing, config);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Erro na geração de conteúdo:', error);
      // Fallback to simple generation on error
      const result = this.generateSimple(briefing, config);
      return {
        success: true,
        data: result
      };
    }
  }

  async generateWithClaude(briefing, config) {
    console.log('🤖 Gerando com Claude para briefing:', briefing.substring(0, 100) + '...');

    const prompt = await this.buildPrompt(briefing, config);

    // Adicionar o briefing ao config para o parsing
    config.briefing = briefing;

    console.log('📝 Prompt length:', prompt.length, 'characters');

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 8192, // Máximo permitido para Claude 3.5 Sonnet
      // temperature: 0.7, // GPT-5 only supports default temperature (1)
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    console.log('📦 Claude response received, length:', response.content[0].text.length);

    const content = response.content[0].text;
    return this.parseAIResponse(content, config);
  }

  async buildPrompt(briefing, config) {
    try {
      // Load external prompt if specified
      if (config.promptType) {
        const promptPath = path.join(__dirname, '..', 'prompts', `${config.promptType}.md`);
        if (await fs.pathExists(promptPath)) {
          let promptTemplate = await fs.readFile(promptPath, 'utf-8');

          // Replace template variables
          promptTemplate = promptTemplate.replace(/\{\{company\}\}/g, config.company || 'Cliente');
          promptTemplate = promptTemplate.replace(/\{\{audience\}\}/g, config.audience || 'Executivos');
          promptTemplate = promptTemplate.replace(/\{\{duration\}\}/g, '15');
          promptTemplate = promptTemplate.replace(/\{\{slideCount\}\}/g, config.slideCount || '6');
          promptTemplate = promptTemplate.replace(/\{\{tone\}\}/g, config.tone || 'profissional');
          promptTemplate = promptTemplate.replace(/\{\{briefing\}\}/g, briefing);

          return promptTemplate;
        }
      }

      // Fallback to default prompt
      return this.buildDefaultPrompt(briefing, config);
    } catch (error) {
      console.warn('Erro ao carregar prompt externo, usando padrão:', error.message);
      return this.buildDefaultPrompt(briefing, config);
    }
  }

  buildDefaultPrompt(briefing, config) {
    const { templateType, company, audience, slideCount, tone } = config;

    return `# Prompt do Sistema - Gerai-MCF Presentation Generator

Você é um especialista em criar apresentações HTML profissionais e completas. Sua função é gerar apresentações em formato de slides seguindo rigorosamente o template visual da Darede e retornando SEMPRE um HTML completo e funcional.

## REGRA FUNDAMENTAL
**SEMPRE retorne um documento HTML completo, válido e autossuficiente que funcione imediatamente quando aberto em um navegador.**

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
    <!-- SLIDES AQUI -->
    <script>
        // JAVASCRIPT COMPLETO AQUI
    </script>
</body>
</html>
\`\`\`

## ESTRUTURA DOS SLIDES (MÍNIMO 7 SLIDES)

### 1. Slide de Capa (OBRIGATÓRIO)
\`\`\`html
<div class="slide active">
    <div class="slide-content cover-slide">
        <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede" class="logo-large">
        <h1>[TÍTULO_PRINCIPAL]</h1>
        <p class="subtitle">[SUBTÍTULO_DESCRITIVO]</p>
        <div class="date-author">
            <span>[DATA_ATUAL]</span>
            <span>[DEPARTAMENTO/AUTOR]</span>
        </div>
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS Partner" class="aws-badge">
    </div>
</div>
\`\`\`

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

## CSS OBRIGATÓRIO (COPIAR INTEGRALMENTE)

\`\`\`css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: linear-gradient(135deg, #0A4F2C 0%, #11713F 50%, #1A8F4F 100%);
    overflow: hidden;
    color: #ffffff;
}

.slides-container {
    display: flex;
    transition: transform 0.5s ease;
    width: 100vw;
    height: 100vh;
}

.slide {
    min-width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    position: relative;
}

.slide-content {
    max-width: 1200px;
    width: 100%;
    animation: slideIn 0.8s ease;
}

.slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
}

.logo {
    height: 40px;
}

.slide-number {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
}

h1 {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 30px;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-top: 40px;
}

.card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    animation: fadeInUp 0.6s ease forwards;
    animation-delay: calc(var(--index) * 0.1s);
}

.card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
}

.metric-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: #FFC107;
}

.chart-container {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 30px;
    margin: 30px 0;
}

.data-table {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.data-table th {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    text-align: left;
    font-weight: 600;
}

.data-table td {
    padding: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
}

.badge-success {
    background: rgba(34, 197, 94, 0.2);
    color: #22C55E;
}

.badge-warning {
    background: rgba(251, 191, 36, 0.2);
    color: #FBBF24;
}

.badge-danger {
    background: rgba(239, 68, 68, 0.2);
    color: #EF4444;
}

.navigation {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    z-index: 1000;
}

.nav-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.nav-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 4px;
    background: #FFC107;
    transition: width 0.5s ease;
    z-index: 1001;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
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
        updateSlideNumbers();
    }
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

function updateProgress() {
    const progress = ((currentSlide + 1) / totalSlides) * 100;
    progressBar.style.width = progress + '%';
}

function updateSlideNumbers() {
    document.querySelectorAll('.slide-number').forEach(el => {
        el.textContent = \`\${currentSlide + 1} / \${totalSlides}\`;
    });
}

// Navegação por teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === ' ') {
        e.preventDefault();
        nextSlide();
    }
});

// Navegação por toque (mobile)
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) nextSlide();
        else prevSlide();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    updateSlideNumbers();

    // Inicializar gráficos
    initCharts();
});

function initCharts() {
    // Configuração dos gráficos Chart.js
    Chart.defaults.color = '#ffffff';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

    // [ADICIONAR INICIALIZAÇÃO DOS GRÁFICOS ESPECÍFICOS AQUI]
}
\`\`\`

## REGRAS DE GERAÇÃO DE CONTEÚDO

### Quando receber TEMA GENÉRICO (ex: "transformação digital"):
1. Pesquise dados reais e atualizados do setor
2. Crie métricas realistas (crescimento de mercado, ROI esperado, etc.)
3. Inclua tendências e projeções
4. Adicione cases de sucesso genéricos
5. Proponha um roadmap de implementação

### Quando receber DADOS ESPECÍFICOS:
1. Use TODOS os dados fornecidos
2. Organize em visualizações apropriadas
3. Adicione análises e insights
4. Mantenha fidelidade aos números fornecidos
5. Complemente com contexto de mercado

## ÍCONES FONT AWESOME (NUNCA USE EMOJIS)

### Por categoria de conteúdo:
- **Tecnologia**: fa-microchip, fa-server, fa-cloud, fa-code
- **Crescimento**: fa-chart-line, fa-rocket, fa-arrow-trend-up
- **Financeiro**: fa-dollar-sign, fa-coins, fa-chart-pie
- **Processos**: fa-cogs, fa-project-diagram, fa-sitemap
- **Pessoas**: fa-users, fa-user-tie, fa-people-group
- **Segurança**: fa-shield-halved, fa-lock, fa-fingerprint
- **Inovação**: fa-lightbulb, fa-brain, fa-flask
- **Performance**: fa-gauge-high, fa-trophy, fa-medal

## VALIDAÇÃO ANTES DE RETORNAR

Confirme que o HTML contém:
- [ ] DOCTYPE e estrutura HTML5 válida
- [ ] Meta tags de viewport para responsividade
- [ ] Link para Font Awesome 6.4.0
- [ ] Script do Chart.js
- [ ] Mínimo de 7 slides completos
- [ ] Logo da Darede em todos os slides necessários
- [ ] Navegação funcional (botões e teclado)
- [ ] Barra de progresso
- [ ] Pelo menos 2 gráficos diferentes
- [ ] Todos os estilos CSS inline
- [ ] JavaScript completo e funcional
- [ ] Dados coerentes e realistas

## FORMATO DA RESPOSTA

**IMPORTANTE**: Retorne APENAS o código HTML completo, sem explicações, comentários ou texto adicional. O HTML deve estar pronto para ser salvo como arquivo .html e aberto diretamente no navegador.

**SEM NENHUM TEXTO ANTES OU DEPOIS DO HTML**`;
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
      console.error('❌ Erro ao parsear resposta HTML do Claude:', error.message);
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
            <h2>Apresentação em Desenvolvimento</h2>
            <p>Esta é uma apresentação personalizada baseada no briefing fornecido.</p>
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
      provider: 'fallback',
      type: 'complete-html'
    };
  }

  generateEnhancedFallback(briefing, config) {
    console.log('🚀 Gerando fallback melhorado para:', briefing.substring(0, 100));
    return this.generateSimple(briefing, config);
  }

  generateSimple(briefing, config) {
    console.log('🤖 Gerando conteúdo com IA simples para:', briefing.substring(0, 100));

    const words = briefing.toLowerCase().split(' ');
    const slideCount = parseInt(config.slideCount) || 6;

    // Análise inteligente do briefing para gerar título específico
    let title = "Apresentação Personalizada";

    // Detecta temas específicos no briefing
    if (words.includes('contact center') || words.includes('atendimento')) {
      title = "Revolução no Contact Center: " + (config.company || 'Sua Empresa');
    } else if (words.includes('automação') || words.includes('automatizar')) {
      title = "Transformação Digital através da Automação";
    } else if (words.includes('vendas') || words.includes('comercial')) {
      title = "Estratégia Comercial Inovadora";
    } else if (words.includes('treinamento') || words.includes('capacitação')) {
      title = "Programa de Capacitação Avançada";
    } else if (words.includes('segurança') || words.includes('security')) {
      title = "Segurança e Compliance Empresarial";
    } else if (words.includes('marketing') || words.includes('digital')) {
      title = "Estratégia de Marketing Digital";
    } else if (words.includes('inovação') || words.includes('transformação')) {
      title = "Inovação e Transformação Empresarial";
    } else {
      // Usa as primeiras palavras significativas do briefing para criar um título
      const significantWords = briefing.split(' ').filter(word =>
        word.length > 3 &&
        !['para', 'sobre', 'como', 'quando', 'onde', 'porque', 'esta', 'esse', 'essa'].includes(word.toLowerCase())
      ).slice(0, 3);

      if (significantWords.length > 0) {
        title = significantWords.join(' ') + ' - Estratégia Empresarial';
      }
    }

    console.log('📝 Título gerado:', title);

    const allModules = {
      capa: {
        title: title,
        content: `Apresentação para ${config.audience || 'stakeholders'}`,
        subtitle: `${config.company || 'Nossa Empresa'} - ${new Date().getFullYear()}`
      },
      agenda: {
        title: "Agenda da Apresentação",
        content: "Estrutura da apresentação baseada no briefing fornecido",
        bullets: [
          "Contexto atual do negócio",
          "Desafios identificados",
          "Solução proposta",
          "Benefícios esperados",
          "Plano de implementação"
        ]
      },
      problema: {
        title: "Desafio Identificado",
        content: `Baseado no briefing fornecido: "${briefing.substring(0, 200)}...". Esta análise mostra a necessidade de uma abordagem estratégica para resolver os desafios apresentados.`,
        bullets: [
          `Análise específica: ${briefing.split(' ').slice(0, 8).join(' ')}`,
          "Impacto direto nos resultados operacionais",
          "Oportunidade de otimização identificada",
          "Necessidade de solução personalizada"
        ],
        stats: "Melhoria potencial significativa identificada"
      },
      solucao: {
        title: `Nossa Proposta para ${config.company || 'Sua Empresa'}`,
        content: `Solução personalizada desenvolvida especificamente para atender ao briefing: "${briefing.substring(0, 150)}...". Nossa abordagem foca em resultados mensuráveis e implementação eficiente.`,
        bullets: [
          `Estratégia customizada baseada em: ${briefing.split(' ').slice(0, 6).join(' ')}`,
          "Implementação gradual e monitorada",
          "Tecnologia adequada às necessidades específicas",
          "Suporte especializado durante todo o processo",
          "ROI mensurável desde o primeiro mês"
        ]
      },
      comparativo: {
        title: "Análise Comparativa",
        content: "Comparação entre situação atual e futura com nossa solução",
        bullets: [
          "Situação Atual: Processos manuais e demorados",
          "Com Nossa Solução: Automatização e eficiência",
          "Resultado: Ganhos significativos de produtividade"
        ]
      },
      cases: {
        title: "Cases de Sucesso",
        content: "Exemplos práticos de implementação bem-sucedida em empresas similares",
        bullets: [
          "Case 1: Empresa do mesmo setor - 80% redução de tempo",
          "Case 2: Implementação similar - 300% ROI em 12 meses",
          "Case 3: Cliente recente - 95% satisfação da equipe"
        ]
      },
      metricas: {
        title: "Resultados Esperados",
        content: "Indicadores de sucesso mensuráveis e tangíveis",
        metrics: [
          { label: "Eficiência", value: "+80%", description: "Melhoria nos processos operacionais" },
          { label: "ROI", value: "300%", description: "Retorno sobre investimento em 12 meses" },
          { label: "Satisfação", value: "95%", description: "Aprovação dos usuários finais" },
          { label: "Redução de Custos", value: "40%", description: "Economia operacional anual" }
        ]
      },
      timeline: {
        title: "Cronograma de Implementação",
        content: "Planejamento detalhado das etapas de implementação",
        bullets: [
          "Fase 1 (Mês 1): Análise detalhada e planejamento",
          "Fase 2 (Mês 2-3): Implementação piloto e ajustes",
          "Fase 3 (Mês 4-6): Rollout completo e treinamento das equipes"
        ]
      },
      conclusao: {
        title: "Próximos Passos",
        content: "Resumo dos benefícios e call-to-action para dar continuidade",
        bullets: [
          "Aprovação da proposta apresentada",
          "Definição do cronograma de implementação",
          "Início imediato do projeto de transformação"
        ]
      }
    };

    // Selecionar módulos baseado na quantidade de slides
    const moduleKeys = Object.keys(allModules);
    const selectedKeys = moduleKeys.slice(0, Math.min(slideCount, moduleKeys.length));
    const selectedModules = {};
    selectedKeys.forEach(key => {
      selectedModules[key] = allModules[key];
    });

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
      modules: selectedModules,
      suggestedAssets: {
        colorPalette: ["#007bff", "#28a745", "#ffc107"],
        icons: ["growth", "innovation", "success", "efficiency"],
        imageSearch: ["business growth", "team collaboration", "digital transformation"]
      },
      narrative: {
        hook: "Uma oportunidade única de transformação empresarial",
        cta: "Vamos começar essa jornada de transformação juntos?",
        keyMessage: "Resultados mensuráveis através de soluções inovadoras e personalizadas"
      },
      generatedAt: new Date().toISOString(),
      config,
      provider: 'simple-fallback'
    };
  }

  async generateImageSuggestions(context, keywords = []) {
    try {
      if (this.provider === 'anthropic') {
        const prompt = `Com base no contexto "${context}" e palavras-chave [${keywords.join(', ')}], sugira 5 termos de busca para imagens profissionais de apresentação. Responda apenas com os termos separados por vírgula.`;

        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }]
        });

        const suggestions = response.content[0].text.split(',').map(s => s.trim()).slice(0, 5);

        return {
          primary: suggestions.slice(0, 3),
          alternative: suggestions.slice(3, 5),
          style: 'professional, clean, modern business',
          avoid: 'clipart, cartoon, low-quality, watermarks'
        };
      } else {
        return this.generateSimpleImageSuggestions(context, keywords);
      }
    } catch (error) {
      return this.generateSimpleImageSuggestions(context, keywords);
    }
  }

  generateSimpleImageSuggestions(context, keywords = []) {
    const contextKeywords = {
      'problem': ['challenge', 'issue', 'obstacle', 'difficulty'],
      'solution': ['innovation', 'technology', 'progress', 'breakthrough'],
      'metrics': ['growth', 'chart', 'success', 'achievement'],
      'team': ['collaboration', 'teamwork', 'people', 'meeting'],
      'business': ['corporate', 'office', 'professional', 'enterprise']
    };

    let searchTerms = [...keywords];

    Object.keys(contextKeywords).forEach(key => {
      if (context.toLowerCase().includes(key)) {
        searchTerms.push(...contextKeywords[key]);
      }
    });

    if (searchTerms.length === 0) {
      searchTerms = ['business', 'professional', 'corporate', 'success'];
    }

    return {
      primary: searchTerms.slice(0, 3),
      alternative: searchTerms.slice(3, 6),
      style: 'professional, clean, modern business',
      avoid: 'clipart, cartoon, low-quality, watermarks'
    };
  }

  static async listAvailablePrompts() {
    try {
      const promptsDir = path.join(__dirname, '..', 'prompts');
      await fs.ensureDir(promptsDir);

      const files = await fs.readdir(promptsDir);
      const prompts = [];

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(promptsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');

          // Extract metadata from markdown
          const titleMatch = content.match(/# Prompt: (.+)/);
          const categoryMatch = content.match(/\*\*Categoria\*\*: (.+)/);
          const typeMatch = content.match(/\*\*Tipo\*\*: (.+)/);
          const audienceMatch = content.match(/\*\*Público-alvo\*\*: (.+)/);

          const promptId = path.parse(file).name;

          prompts.push({
            id: promptId,
            name: titleMatch ? titleMatch[1] : promptId,
            category: categoryMatch ? categoryMatch[1] : 'Geral',
            type: typeMatch ? typeMatch[1] : 'Apresentação',
            audience: audienceMatch ? audienceMatch[1] : 'Geral',
            filename: file
          });
        }
      }

      return prompts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Erro ao listar prompts:', error);
      return [];
    }
  }
}

module.exports = ClaudeAIService;