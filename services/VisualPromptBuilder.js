/**
 * VisualPromptBuilder v2.0 - Geração Inteligente e Criativa
 * Inspirado em presentations.ai
 */

class VisualPromptBuilder {
  static async build(briefing, config) {
    const slideCount = parseInt(config.slideCount) || 6;
    const company = config.company || 'Cliente';
    const audience = config.audience || 'Executivos';

    // Processar dados Excel
    let excelDataSection = '';
    let dataInsights = '';

    if (config.attachments && config.attachments.length > 0) {
      const processedData = await ExcelProcessor.processAttachments(config.attachments);
      if (processedData.hasData) {
        excelDataSection = '\n\n' + processedData.summary;
        dataInsights = this.generateDataInsights(processedData);
      }
    }

    const prompt = `Você é um DESIGNER DE EXPERIÊNCIAS VISUAIS e STORYTELLER ESTRATÉGICO especializado em criar apresentações que convertem e engajam.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 MISSÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Criar uma apresentação HTML ÚNICA e MEMORÁVEL que:
1. Conte uma história envolvente (não apenas liste fatos)
2. Use design inovador e inesperado (não templates genéricos)
3. Gere impacto emocional e racional
4. Diferencie-se de qualquer outra apresentação
5. Seja visualmente surpreendente em CADA slide

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CONTEXTO DO CLIENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${briefing}
${excelDataSection}
${dataInsights}

Empresa: ${company}
Público: ${audience}
Slides: ${slideCount}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 ANÁLISE ESTRATÉGICA OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANTES de criar os slides, você DEVE:

1. **IDENTIFICAR O PROBLEMA CENTRAL**
   - Qual a DOR real do cliente?
   - Qual o custo de NÃO resolver isso?
   - Por que isso importa AGORA?

2. **EXTRAIR INSIGHTS DOS DADOS**
   ${dataInsights ? '- Você tem DADOS REAIS. Analise-os profundamente!' : '- Use o contexto do briefing para inferir insights'}
   - Qual a história que os números contam?
   - Que padrões ou anomalias existem?
   - Qual o impacto financeiro/estratégico?

3. **DEFINIR A NARRATIVA**
   Escolha UMA das estruturas abaixo (varie entre apresentações):
   
   A) **Jornada do Herói** (Problema → Desafio → Solução → Transformação)
   B) **Antes vs Depois** (Situação Atual → Visão → Caminho → Resultado)
   C) **Revelação Progressiva** (Pergunta → Dados → Insight → Ação)
   D) **Comparação Disruptiva** (Status Quo → Alternativa → Vantagem → Prova)
   E) **História de Sucesso** (Cliente Similar → Desafio → Solução → ROI)

4. **ESCOLHER ESTILO VISUAL**
   Cada apresentação deve ter identidade única. Varie entre:
   
   A) **Minimalista Bold** (espaços brancos + tipografia gigante + 1 cor vibrante)
   B) **Data-Driven** (gráficos dominantes + números grandes + insights destacados)
   C) **Editorial Moderno** (layouts de revista + hierarquia tipográfica + imagens conceituais)
   D) **Tech Futurista** (gradientes + glassmorphism + animações suaves + dark mode opcional)
   E) **Impacto Executivo** (contraste forte + mensagens diretas + visualizações ousadas)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 PRINCÍPIOS DE DESIGN INOVADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ **HIERARQUIA VISUAL EXTREMA**
  - Números: 5-10rem (gigantes, impossíveis de ignorar)
  - Títulos: 3-4rem (bold, statement claro)
  - Corpo: 1.2-1.5rem (legível mas secundário)

✓ **CONTRASTE DRAMÁTICO**
  - Fundos: alternar entre claro/escuro entre slides
  - Cores: usar paleta Darede (#1e5c3f, #ff9500) de forma OUSADA
  - Espaços: não ter medo de áreas vazias (respiro visual)

✓ **LAYOUTS ÚNICOS POR SLIDE**
  - Slide 1: Full-screen impactante
  - Slide 2: Grid assimétrico
  - Slide 3: Split 60/40 com visual dominante
  - Slide 4: Centralizado com foco laser
  - Slide 5: Comparação lado-a-lado
  - Slide N: Call-to-action imersivo

✓ **VISUALIZAÇÕES CRIATIVAS**
  - Não apenas gráficos de barras padrão
  - Use: comparações visuais, ícones grandes, progress circles, timelines horizontais
  - Animações: revelar dados progressivamente, não tudo de uma vez

✓ **TIPOGRAFIA COMO ARTE**
  - Misture pesos: 300 (light) para contexto, 900 (black) para impacto
  - Use line-height generoso (1.6-1.8) para respirar
  - Kerning e tracking para palavras-chave (letter-spacing: 2-3px)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VISUALIZAÇÃO DE DADOS INTELIGENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.getDataVisualizationGuidelines(excelDataSection)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ COPYWRITING QUE VENDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ **TÍTULOS MAGNÉTICOS**
  ❌ Evite: "Análise de Resultados"
  ✅ Use: "R$ 2.4M em Economia: Como?"
  
  ❌ Evite: "Nossa Solução"
  ✅ Use: "O Sistema que Eliminou 87% dos Erros"

✓ **INSIGHTS CONSULTIVOS** (use <p class="slide-insight">)
  - Não apenas descreva, INTERPRETE
  - Quantifique o impacto: "Isso representa 23% de redução em custos operacionais"
  - Projete o futuro: "Em 12 meses, potencial de R$ 840K em savings"
  - Compare: "3x mais rápido que o processo atual"

✓ **VERBOS DE AÇÃO**
  - Transforme, Elimine, Acelere, Automatize, Otimize
  - Reduza, Aumente, Simplifique, Integre, Escale

✓ **PROVA SOCIAL E CREDIBILIDADE**
  - Números específicos (não arredondados)
  - Percentuais de melhoria
  - Timeframes realistas
  - Comparações com benchmarks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 ESTRUTURA NARRATIVA (escolha uma)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**OPÇÃO 1: Problem-Solution-Impact**
1. Cover: Pergunta provocativa
2. Problem: Dor atual com dados
3. Cost: Quanto custa não resolver?
4. Solution: Nossa abordagem
5. Proof: Resultados e evidências
6. Action: Próximos passos
7. Contact

**OPÇÃO 2: Data-Driven Story**
1. Cover: Número impactante
2. Context: Por que isso importa?
3. Analysis: Deep dive nos dados
4. Insight: O que descobrimos
5. Opportunity: Como capturar valor
6. Roadmap: Jornada de implementação
7. Contact

**OPÇÃO 3: Transformation Journey**
1. Cover: Visão inspiradora
2. Current State: Onde estamos
3. Gap Analysis: O que falta
4. Future State: Onde queremos estar
5. Path: Como chegar lá
6. Timeline: Marcos importantes
7. Contact

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💎 CSS FOUNDATION (adapte ao estilo escolhido)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Base sempre incluir:
- Reset completo
- Variáveis CSS para tema
- Tipografia Inter ou sistema fonts
- Transições suaves (cubic-bezier)
- Animações sutis mas impactantes
- Responsividade
- Navegação elegante
- Progress bar

Cores Darede:
--primary: #1e5c3f
--primary-light: #2d8659
--accent: #ff9500
--accent-light: #ffb347

Use gradientes, não cores chapadas:
linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 ELEMENTOS VISUAIS OBRIGATÓRIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Logo header: <div class="slide-logo-header"><img src="https://i.ibb.co/QvP3HK6n/logo-darede.png"></div>
  (em TODOS os slides exceto cover e contact)

✓ Variação de layouts: cada slide deve ter estrutura diferente

✓ Pelo menos 2 tipos de visualização:
  - Stats cards (números grandes)
  - Gráficos (bars, donuts, lines)
  - Comparações (before/after)
  - Timelines
  - Progress indicators

✓ Insights contextuais: <p class="slide-insight"> em slides com dados

✓ Animações de entrada: stagger nos elementos (delay progressivo)

✓ Micro-interações: hover states, transitions suaves

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ REGRAS ABSOLUTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 NUNCA FAÇA:
- Inventar dados ou estatísticas
- Usar templates genéricos
- Criar slides idênticos visualmente
- Títulos vagos ou corporatês vazio
- Gráficos sem insights
- Textos longos sem hierarquia
- Cores fora da paleta Darede
- Esquecer logo header
- Incluir datas
- Usar markdown no output

✅ SEMPRE FAÇA:
- Analise profundamente o briefing
- Crie narrativa coesa
- Varie layouts entre slides
- Use dados REAIS quando disponíveis
- Gere insights valiosos
- Quantifique impactos
- Design ousado e memorável
- HTML válido e completo
- Código limpo e comentado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 OUTPUT ESPERADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **CRÍTICO: VOCÊ DEVE CRIAR EXATAMENTE ${slideCount} SLIDES!**

NÃO crie apenas 1 slide de capa! CRIE TODOS OS ${slideCount} SLIDES SOLICITADOS!

Estrutura HTML obrigatória:
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Apresentação</title>
  <style>
    /* CSS aqui */
  </style>
</head>
<body>
  <section class="slide" data-slide="1">
    <!-- SLIDE 1: COVER -->
  </section>

  <section class="slide" data-slide="2">
    <!-- SLIDE 2: Conteúdo 1 -->
  </section>

  <section class="slide" data-slide="3">
    <!-- SLIDE 3: Conteúdo 2 -->
  </section>

  <!-- Continue criando slides até ${slideCount} -->

  <section class="slide" data-slide="${slideCount}">
    <!-- SLIDE ${slideCount}: FINAL/CONTACT -->
  </section>

  <script>
    // Sistema de navegação entre slides
    let currentSlide = 1;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    function showSlide(n) {
      if (n > totalSlides) currentSlide = 1;
      if (n < 1) currentSlide = totalSlides;

      slides.forEach(s => s.style.display = 'none');
      slides[currentSlide - 1].style.display = 'flex';
    }

    function nextSlide() { currentSlide++; showSlide(currentSlide); }
    function prevSlide() { currentSlide--; showSlide(currentSlide); }

    // Navegação: setas, espaço, clique
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
    });

    document.addEventListener('click', (e) => {
      e.clientX > window.innerWidth / 2 ? nextSlide() : prevSlide();
    });

    showSlide(currentSlide);
  </script>
</body>
</html>

CHECKLIST ANTES DE RETORNAR:
✓ Criar exatamente ${slideCount} tags <section class="slide">
✓ Cada slide tem data-slide="N" de 1 até ${slideCount}
✓ Cada slide tem conteúdo único e relevante
✓ Narrativa faz sentido do início ao fim
✓ HTML completo de <!DOCTYPE> até </html>

PASSOS:
1. Analise o briefing e dados
2. Escolha narrativa e estilo visual
3. **CRIE TODOS OS ${slideCount} SLIDES** únicos e impactantes
4. Retorne APENAS HTML completo
5. De <!DOCTYPE html> até </html>
6. SEM markdown, SEM explicações, SEM texto antes/depois do HTML
7. Código pronto para uso imediato

CRIE UMA APRESENTAÇÃO COM ${slideCount} SLIDES QUE FAÇA O CLIENTE DIZER:
"WOW, isso é diferente de tudo que já vi!"

GO! 🚀`;

    return prompt;
  }

  static getDataVisualizationGuidelines(hasData) {
    if (hasData) {
      return `
✓ **VOCÊ TEM DADOS REAIS - USE-OS COM MAESTRIA**

1. **Bar Charts** - Para comparações
   - Ordene por valor (maior → menor ou vice-versa)
   - Destaque o maior/menor com cor diferente
   - Adicione labels apenas nos valores importantes
   - Anime a revelação progressiva

2. **Big Numbers** - Para KPIs principais
   - 1 número = 1 mensagem
   - Use unidades claras (R$, %, dias, x)
   - Contextualize com benchmark ou meta
   - Adicione micro-texto explicativo

3. **Progress Indicators** - Para metas
   - Circular para %
   - Linear para tempo/progresso
   - Cores: verde (bom), laranja (alerta), vermelho (crítico)

4. **Comparisons** - Para antes/depois
   - Split screen 50/50
   - Contraste visual forte
   - Números grandes + delta
   - Setas ou ícones para direção

**INSIGHTS OBRIGATÓRIOS:**
- "O que isso SIGNIFICA?"
- "Por que isso IMPORTA?"
- "Qual a OPORTUNIDADE?"`;
    } else {
      return `
✓ **SEM DADOS DIRETOS - FOQUE EM CONTEXTO**

Use:
- Comparações conceituais (antes/depois)
- Benefícios quantificados por pesquisa
- Timelines de implementação
- Frameworks visuais (matrices, diagramas)
- Case studies simplificados

**NÃO invente estatísticas.** Use o briefing para:
- Identificar problemas
- Propor soluções
- Mostrar benefícios qualitativos
- Apresentar processo/metodologia`;
    }
  }

  static generateDataInsights(processedData) {
    let insights = '\n\n━━━ INSIGHTS DOS DADOS ━━━\n\n';
    
    processedData.structuredData.forEach(data => {
      if (data.type === 'excel' && data.numericAnalysis) {
        Object.entries(data.numericAnalysis).forEach(([sheet, stats]) => {
          insights += `📊 ${sheet}:\n`;
          Object.entries(stats).slice(0, 3).forEach(([col, values]) => {
            const trend = values.max > values.average * 2 ? 'alta variação' : 'distribuição uniforme';
            insights += `  • ${col}: ${trend} (média: ${values.average.toFixed(1)}, máx: ${values.max})\n`;
          });
        });
      }
    });
    
    return insights;
  }

  // Manter métodos de validação existentes...
  static validateResponse(html) {
    const validations = {
      hasDoctype: html.trim().toLowerCase().startsWith('<!doctype html'),
      hasHtmlTag: html.includes('<html') && html.includes('</html>'),
      hasVariedLayouts: this.checkLayoutVariety(html),
      hasInsights: html.includes('slide-insight'),
      hasBigNumbers: html.includes('stat-number') || /font-size:\s*[5-9]rem/.test(html),
      hasAnimations: html.includes('@keyframes') || html.includes('animation:'),
      hasDaredeColors: html.includes('#1e5c3f') && html.includes('#ff9500'),
      hasLogoHeader: html.includes('slide-logo-header'),
      minLength: html.length > 10000,
      noMarkdown: !html.includes('```'),
      noDate: !html.includes(new Date().toLocaleDateString('pt-BR')),
    };

    const score = (Object.values(validations).filter(v => v).length / Object.keys(validations).length) * 100;

    return {
      valid: score >= 85,
      score: Math.round(score),
      details: validations
    };
  }

  static checkLayoutVariety(html) {
    const layouts = [
      html.includes('slide-hero'),
      html.includes('slide-chart'),
      html.includes('slide-comparison'),
      html.includes('grid-template-columns'),
      html.includes('flex-direction')
    ];
    return layouts.filter(l => l).length >= 3;
  }

  static cleanResponse(response) {
    let cleaned = response.replace(/```html\n?/gi, '').replace(/```\n?/g, '');
    const htmlMatch = cleaned.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    return htmlMatch ? htmlMatch[0].trim() : cleaned.trim();
  }
}

module.exports = VisualPromptBuilder;