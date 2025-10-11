/**
 * VisualPromptBuilder v2.0 - Geração Inteligente e Criativa
 * Inspirado em presentations.ai
 */

const ExcelProcessor = require('./ExcelProcessor');

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

${excelDataSection ? `
⚠️ IMPORTANTE: Use EXATAMENTE as informações dos anexos acima (números, nomes de produtos, características). NÃO invente dados genéricos.
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 ANÁLISE ESTRATÉGICA OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANTES de criar os slides, você DEVE:

1. **IDENTIFICAR O PROBLEMA CENTRAL**
   - Qual a DOR real do cliente?
   - Por que isso importa AGORA?

2. **EXTRAIR INSIGHTS**
   ${dataInsights ? '- Use dados reais dos anexos' : '- Use o contexto do briefing'}
   - Conecte dados com a proposta
   - Quantifique o impacto

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

✓ **HIERARQUIA VISUAL CLARA E IMPACTANTE**
  - Números/Stats (.stat-number): 6rem (use classe específica!)
  - Títulos principais (h1): 2.5rem (consistente e legível)
  - Subtítulos (h2): 2rem (hierarquia clara)
  - Corpo (p): 1.1rem (legível e profissional)

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

✓ **CENTRALIZAÇÃO PERFEITA (OBRIGATÓRIO)**
  - TODOS os elementos devem estar perfeitamente centrados vertical e horizontalmente
  - Use display: flex com justify-content: center e align-items: center em containers
  - .slide-content SEMPRE com max-width: 1200px e margin: 0 auto
  - Padding moderado (60px) para manter conteúdo dentro da viewport
  - Evite elementos que ultrapassem os limites visuais da tela

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VISUALIZAÇÃO DE DADOS INTELIGENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.getDataVisualizationGuidelines(excelDataSection)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✍️ COPYWRITING QUE VENDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ **TÍTULOS MAGNÉTICOS**
  - Extraia informações específicas dos anexos quando disponíveis
  - Use números reais, não genéricos

✓ **INSIGHTS CONSULTIVOS** (use <p class="slide-insight">)
  - Interprete dados dos anexos quando fornecidos
  - Quantifique impacto com números reais

✓ **VERBOS DE AÇÃO**
  - Transforme, Elimine, Acelere, Automatize, Otimize

✓ **CREDIBILIDADE**
  - ${excelDataSection ? 'Use dados dos anexos - não invente!' : 'Números específicos (não arredondados)'}

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
💎 CSS FOUNDATION - ANIMAÇÕES E TRANSIÇÕES IMPACTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 **VARIÁVEIS CSS OBRIGATÓRIAS:**
:root {
  --primary: #1e5c3f;
  --primary-light: #2d8659;
  --primary-dark: #15482f;
  --accent: #ff9500;
  --accent-light: #ffb347;
  --accent-dark: #e68500;
  --text-dark: #1a1a1a;
  --text-light: #f5f5f5;
  --shadow-soft: 0 10px 40px rgba(0,0,0,0.1);
  --shadow-hard: 0 20px 60px rgba(0,0,0,0.3);
}

🎭 **ANIMAÇÕES OBRIGATÓRIAS (incluir todas):**

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(60px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-60px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(60px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes fillBar {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes drawCircle {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

🎬 **TRANSIÇÕES SUAVES (usar em todos os elementos interativos):**
transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

Para hover states:
transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;

📐 **ESTRUTURA BASE DO CSS:**

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
  background: #ffffff;
  color: var(--text-dark);
  line-height: 1.6;
}

.slide {
  position: absolute;
  width: 100vw;
  height: 100vh;
  display: none;
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
  padding: 60px;
  overflow: hidden;
  background: #ffffff;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.slide.active {
  display: flex;
  opacity: 1;
  animation: fadeIn 0.8s ease-out;
}

/* Animação stagger FASEADA - elementos aparecem em sequência */
.slide.active > * {
  animation: slideInUp 0.6s ease-out backwards;
}

.slide.active > *:nth-child(1) { animation-delay: 0s; }
.slide.active > *:nth-child(2) { animation-delay: 0.5s; }
.slide.active > *:nth-child(3) { animation-delay: 1s; }
.slide.active > *:nth-child(4) { animation-delay: 1.5s; }
.slide.active > *:nth-child(5) { animation-delay: 2s; }
.slide.active > *:nth-child(6) { animation-delay: 2.5s; }
.slide.active > *:nth-child(7) { animation-delay: 3s; }
.slide.active > *:nth-child(8) { animation-delay: 3.5s; }

/* Elementos dentro de grids também aparecem faseados */
.slide.active .grid-2 > *:nth-child(1) { animation: slideInUp 0.6s ease-out 1s backwards; }
.slide.active .grid-2 > *:nth-child(2) { animation: slideInUp 0.6s ease-out 1.5s backwards; }

.slide.active .grid-3 > *:nth-child(1) { animation: slideInUp 0.6s ease-out 1s backwards; }
.slide.active .grid-3 > *:nth-child(2) { animation: slideInUp 0.6s ease-out 1.5s backwards; }
.slide.active .grid-3 > *:nth-child(3) { animation: slideInUp 0.6s ease-out 2s backwards; }

🎨 **PALETA DE CORES E BACKGROUNDS:**

⚠️⚠️⚠️ REGRAS DE CORES ABSOLUTAS - NÃO DESVIAR! ⚠️⚠️⚠️

**SLIDE 1 (CAPA):**
- Background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)
- Cor do texto: white (#ffffff)
- Logo: branco ou versão normal

**TODOS OS OUTROS SLIDES (2 até N incluindo CONTATO):**
- Background: #ffffff (BRANCO PURO)
- Cor do texto: var(--text-dark) (#1a1a1a)
- Títulos: var(--primary) (#1e5c3f - verde Darede)
- Destaques: var(--accent) (#ff9500 - laranja, apenas em textos/ícones)

🚫 NUNCA USE:
- Fundo laranja em nenhum slide
- Fundo escuro/preto em nenhum slide
- Gradientes em slides de conteúdo
- Texto branco em fundo branco

✅ SEMPRE USE:
- Slide 1: fundo verde + texto branco
- Slides 2-N: fundo branco + texto escuro
- Cards: background branco com borda #e0e0e0
- Sombras suaves: box-shadow: 0 4px 20px rgba(0,0,0,0.08)

🔘 **NAVEGAÇÃO MODERNA (obrigatória):**

.navigation {
  position: fixed;
  bottom: 40px;
  right: 40px;
  display: flex;
  gap: 15px;
  z-index: 1000;
}

.nav-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-btn:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: var(--shadow-hard);
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
}

.nav-btn:active {
  transform: translateY(-2px) scale(1.05);
}

📊 **PROGRESS BAR (obrigatória):**

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: var(--accent);
  z-index: 1000;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px var(--accent);
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 ELEMENTOS VISUAIS OBRIGATÓRIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ **Logo header** (TODOS os slides exceto cover e contact):
.slide-logo-header {
  position: absolute;
  top: 40px;
  left: 40px;
  animation: fadeIn 1s ease-out;
  z-index: 100;
}
.slide-logo-header img {
  height: 50px;
  filter: drop-shadow(0 2px 10px rgba(0,0,0,0.2));
}

⚠️ IMPORTANTE: SEMPRE usar esta URL exata para o logo Darede:
<div class="slide-logo-header">
  <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
</div>

✓ **Números grandes impactantes:**
.stat-number {
  font-size: 6rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
  margin: 20px 0;
  animation: scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

✓ **Cards com hover effect (para slides de conteúdo):**
.stat-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 40px;
  border: 2px solid #e0e0e0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-card:hover {
  transform: translateY(-10px);
  border-color: var(--accent);
  box-shadow: 0 20px 60px rgba(255, 149, 0, 0.3);
}

✓ **Barra de progresso animada:**
.progress-indicator {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
  border-radius: 10px;
  animation: fillBar 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  box-shadow: 0 0 20px var(--accent);
}

✓ **Botões e CTAs impactantes:**
.cta-button {
  padding: 20px 50px;
  font-size: 1.2rem;
  font-weight: 700;
  border: none;
  border-radius: 50px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
  color: white;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(255, 149, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: pulse 2s infinite;
}

.cta-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 50px rgba(255, 149, 0, 0.6);
}

✓ **Glassmorphism para cards modernos:**
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 50px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

✓ **Insights contextuais destacados:**
.slide-insight {
  background: #fff9f0;
  border-left: 4px solid var(--accent);
  padding: 20px 25px;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  margin: 20px 0;
  line-height: 1.6;
  box-shadow: 0 2px 10px rgba(255, 149, 0, 0.1);
}

✓ **TIPOGRAFIA PROFISSIONAL (copie exatamente):**

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 20px;
  line-height: 1.2;
}

h2 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 15px;
  line-height: 1.3;
}

h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 10px;
}

p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
  margin-bottom: 15px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

✓ **ESTRUTURA DE LAYOUT PROFISSIONAL:**

.slide-content {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.slide-header {
  margin-bottom: 40px;
  text-align: center;
}

.slide-body {
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: center;
  width: 100%;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

/* SLIDE DE CAPA - Centralizado e impactante */
.slide-cover {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px;
}

.slide-cover img {
  height: 120px;
  margin-bottom: 60px;
  filter: brightness(0) invert(1);
}

.slide-cover h1 {
  color: white;
  font-size: 3rem;
  margin-bottom: 30px;
}

.slide-cover p {
  color: rgba(255,255,255,0.9);
  font-size: 1.3rem;
  max-width: 700px;
}

/* Ícones */
.icon-large {
  font-size: 5rem;
  color: var(--accent);
  margin: 30px 0;
}

.icon-medium {
  font-size: 3rem;
  color: var(--primary);
  margin: 20px 0;
}

/* SLIDE DE CONTATO - Elegante */
.slide-contact .slide-content {
  text-align: center;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 50px;
  margin-top: 30px;
  max-width: 900px;
}

.contact-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.contact-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(30, 92, 63, 0.2);
}

.contact-item p {
  font-size: 1rem;
  color: var(--text-dark);
  margin: 0;
  font-weight: 500;
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 ELEMENTOS VISUAIS OBRIGATÓRIOS - ÍCONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ REGRA CRÍTICA: CADA SLIDE DEVE TER ELEMENTOS VISUAIS!

**BIBLIOTECAS DE ÍCONES DISPONÍVEIS:**

1. **Font Awesome** (para ícones gerais):
   - <i class="fas fa-[nome] icon-large"></i>
   - Exemplos: fa-chart-line, fa-rocket, fa-users, fa-shield-alt, fa-lightbulb

2. **Flaticon Uicons** (para ícones específicos e contextuais):
   - Solid: <i class="fi fi-sr-[nome] icon-large"></i>
   - Regular: <i class="fi fi-rr-[nome] icon-large"></i>
   - Bold: <i class="fi fi-br-[nome] icon-large"></i>

**ESCOLHA O ÍCONE MAIS APROPRIADO PARA O CONTEXTO:**

📊 **Negócios/Analytics:**
- <i class="fi fi-sr-chart-histogram icon-large"></i> - Dados/Analytics
- <i class="fi fi-sr-analytics icon-large"></i> - Insights
- <i class="fi fi-sr-target icon-large"></i> - Objetivos
- <i class="fi fi-sr-business-time icon-large"></i> - Produtividade

💻 **Tecnologia:**
- <i class="fi fi-sr-cloud icon-large"></i> - Cloud/AWS
- <i class="fi fi-sr-database icon-large"></i> - Banco de dados
- <i class="fi fi-sr-laptop-code icon-large"></i> - Desenvolvimento
- <i class="fi fi-sr-shield-check icon-large"></i> - Segurança

💰 **Finanças:**
- <i class="fi fi-sr-piggy-bank icon-large"></i> - Economia
- <i class="fi fi-sr-money-bill-wave icon-large"></i> - Receita
- <i class="fi fi-sr-hand-holding-usd icon-large"></i> - Investimento
- <i class="fi fi-sr-sack-dollar icon-large"></i> - ROI

👥 **Pessoas/Time:**
- <i class="fi fi-sr-users-alt icon-large"></i> - Equipe
- <i class="fi fi-sr-user-graduate icon-large"></i> - Treinamento
- <i class="fi fi-sr-handshake icon-large"></i> - Parceria
- <i class="fi fi-sr-user-headset icon-large"></i> - Suporte

⚡ **Ação/Resultado:**
- <i class="fi fi-sr-rocket-lunch icon-large"></i> - Crescimento rápido
- <i class="fi fi-sr-check-circle icon-large"></i> - Sucesso
- <i class="fi fi-sr-flame icon-large"></i> - Performance
- <i class="fi fi-sr-bolt icon-large"></i> - Velocidade

🎯 **REGRA: USE O ÍCONE QUE MELHOR REPRESENTA O CONTEÚDO!**
- Analise o contexto do slide
- Escolha entre Font Awesome (fa-) ou Flaticon (fi fi-sr-)
- Flaticon tem ícones mais específicos e modernos
- Font Awesome para ícones clássicos/gerais

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
- Usar font-size inline muito grande (max 2.5rem para títulos)
- Usar style inline quando há classe CSS disponível
- Criar textos brancos em fundo branco

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
- Use as classes CSS fornecidas (h1, h2, p, .slide-content, .stat-card, etc)
- Mantenha tipografia profissional (máx 2.5rem)
- Garanta alto contraste para legibilidade
- Use .slide-content para centralizar e limitar largura
- Estruture com .slide-header e .slide-body
- Use grids (.grid-2, .grid-3) para layouts organizados
- **ADICIONE ÍCONES EM TODOS OS SLIDES DE CONTEÚDO**
- **SLIDE 1 SEMPRE COM CLASSE .slide-cover e logo centralizado**
- **Centralize todo conteúdo com flexbox**
- **Padding reduzido (60px) para evitar corte de conteúdo nas bordas**
- **Todos os elementos devem estar perfeitamente centrados e dentro da viewport**

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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css'>
  <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/2.6.0/uicons-regular-rounded/css/uicons-regular-rounded.css'>
  <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/2.6.0/uicons-bold-rounded/css/uicons-bold-rounded.css'>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    /* TODOS os estilos CSS fornecidos */
  </style>
</head>
<body>
  <!-- SLIDE 1: CAPA OBRIGATÓRIA COM LOGO CENTRALIZADO -->
  <section class="slide slide-cover" data-slide="1">
    <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
    <h1>Título Impactante</h1>
    <p>Subtítulo explicativo em 1-2 linhas</p>
  </section>

  <!-- SLIDE 2: Com ícone grande -->
  <section class="slide" data-slide="2">
    <div class="slide-logo-header">
      <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
    </div>
    <div class="slide-content">
      <i class="fas fa-chart-line icon-large"></i>
      <h2>Título</h2>
      <p>Texto breve</p>
    </div>
  </section>

  <!-- SLIDE 3: Cards com ícones em grid -->
  <section class="slide" data-slide="3">
    <div class="slide-logo-header">
      <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
    </div>
    <div class="slide-content">
      <h2>Título</h2>
      <div class="grid-3">
        <div class="stat-card">
          <i class="fas fa-rocket icon-medium"></i>
          <h3>Feature 1</h3>
          <p>Breve</p>
        </div>
        <div class="stat-card">
          <i class="fas fa-shield-alt icon-medium"></i>
          <h3>Feature 2</h3>
          <p>Breve</p>
        </div>
        <div class="stat-card">
          <i class="fas fa-cogs icon-medium"></i>
          <h3>Feature 3</h3>
          <p>Breve</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Continue até ${slideCount} com ícones em TODOS -->

  <!-- ÚLTIMO SLIDE: CONTATO - Elegante e profissional -->
  <section class="slide slide-contact" data-slide="${slideCount}">
    <div class="slide-logo-header">
      <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
    </div>
    <div class="slide-content">
      <h2>Vamos Conversar?</h2>
      <p style="margin-bottom: 50px;">Entre em contato conosco e descubra como podemos ajudar</p>

      <div class="contact-grid">
        <div class="contact-item">
          <i class="fas fa-envelope icon-medium"></i>
          <p>comercial@darede.com.br</p>
        </div>
        <div class="contact-item">
          <i class="fas fa-phone icon-medium"></i>
          <p>+55 11 3090-1115</p>
        </div>
        <div class="contact-item">
          <i class="fas fa-globe icon-medium"></i>
          <p>www.darede.com.br</p>
        </div>
      </div>
    </div>
  </section>

  <script>
    // Sistema de navegação APRIMORADO com transições suaves
    let currentSlide = 1;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const progressBar = document.querySelector('.progress-bar');

    function updateProgress() {
      const progress = (currentSlide / totalSlides) * 100;
      if (progressBar) progressBar.style.width = progress + '%';
    }

    function showSlide(n) {
      if (n > totalSlides) currentSlide = 1;
      if (n < 1) currentSlide = totalSlides;

      // Remove active de todos e adiciona fade out
      slides.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
        s.style.opacity = '0';
      });

      // Mostra slide atual com fade in
      const activeSlide = slides[currentSlide - 1];
      activeSlide.style.display = 'flex';

      setTimeout(() => {
        activeSlide.classList.add('active');
        activeSlide.style.opacity = '1';
      }, 50);

      updateProgress();
    }

    function nextSlide() {
      currentSlide++;
      showSlide(currentSlide);
    }

    function prevSlide() {
      currentSlide--;
      showSlide(currentSlide);
    }

    // Navegação: apenas setas do teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    });

    // Adiciona botões de navegação se não existirem
    if (!document.querySelector('.navigation')) {
      const nav = document.createElement('div');
      nav.className = 'navigation';
      nav.innerHTML = '<button class="nav-btn" onclick="prevSlide()">←</button><button class="nav-btn" onclick="nextSlide()">→</button>';
      document.body.appendChild(nav);
    }

    // Adiciona progress bar se não existir
    if (!progressBar) {
      const bar = document.createElement('div');
      bar.className = 'progress-bar';
      document.body.appendChild(bar);
    }

    // Inicializa
    showSlide(currentSlide);
  </script>
</body>
</html>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 ESTRUTURA OBRIGATÓRIA DE SLIDES RICOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**SLIDES 2-N (CONTEÚDO) DEVEM TER ESTA ESTRUTURA:**

<section class="slide" data-slide="X">
  <div class="slide-logo-header">
    <img src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
  </div>
  <div class="slide-content">
    <h2>Título do Slide</h2>
    ${excelDataSection ? '<p class="slide-insight">Insight ESPECÍFICO baseado nos dados do anexo</p>' : '<p class="slide-insight">Insight importante</p>'}

    <!-- ESCOLHA UMA DAS ESTRUTURAS ABAIXO PARA ENRIQUECER: -->

    <!-- OPÇÃO 1: Grid de cards com ícones (mínimo 3 cards) -->
    <div class="grid-3">
      <div class="stat-card">
        <i class="fas fa-[icone] icon-medium"></i>
        <h3>Título Item</h3>
        <p>${excelDataSection ? 'Descrição com dados do anexo' : 'Descrição detalhada'}</p>
      </div>
      <!-- Repetir para 3+ cards -->
    </div>

    <!-- OPÇÃO 2: Lista com ícones + estatísticas -->
    <div class="slide-body">
      <div class="stat-number">123+</div>
      <p>${excelDataSection ? 'Significado do número do anexo' : 'Significado do número'}</p>
      <ul style="text-align: left; max-width: 600px;">
        <li><i class="fas fa-check"></i> Benefício 1 ${excelDataSection ? '(do anexo)' : 'específico'}</li>
        <li><i class="fas fa-check"></i> Benefício 2 ${excelDataSection ? '(do anexo)' : 'específico'}</li>
        <li><i class="fas fa-check"></i> Benefício 3 ${excelDataSection ? '(do anexo)' : 'específico'}</li>
      </ul>
    </div>

    <!-- OPÇÃO 3: Gráfico Chart.js (quando há dados) -->
    <canvas id="chartX" width="800" height="400"></canvas>
    <script>/* código Chart.js */</script>
  </div>
</section>

⚠️ NUNCA crie slides com apenas: título + 1 parágrafo + 1 ícone!

CHECKLIST OBRIGATÓRIO:
✓ TODOS os ${slideCount} slides criados
✓ CSS copiado EXATAMENTE
✓ TODOS os slides de conteúdo (2-N) têm .slide-content
✓ TODOS os slides têm 3+ elementos informativos
✓ ${excelDataSection ? 'Dados REAIS dos anexos extraídos e usados' : 'Conteúdo rico'}
✓ Animações 0.5s configuradas (delays: 0s, 0.5s, 1s, 1.5s, 2s...)
✓ HTML completo <!DOCTYPE> até </html>

GO! 🚀`;

    return prompt;
  }

  static getDataVisualizationGuidelines(hasData) {
    if (hasData) {
      return `
✓ **VOCÊ TEM DADOS REAIS - CRIE GRÁFICOS IMPACTANTES COM CHART.JS**

⚠️⚠️⚠️ OBRIGATÓRIO: Chart.js está disponível! CRIE GRÁFICOS VISUAIS! ⚠️⚠️⚠️

**ESTRUTURA DE GRÁFICO:**
1. Crie um canvas: <canvas id="chartX" width="800" height="400"></canvas>
2. Adicione script após o canvas para criar o gráfico
3. Use as cores Darede: primary #1e5c3f, accent #ff9500

**EXEMPLO DE GRÁFICO DE BARRAS:**
<canvas id="chart1" width="800" height="400"></canvas>
<script>
new Chart(document.getElementById('chart1'), {
  type: 'bar',
  data: {
    labels: ['Label1', 'Label2', 'Label3'],
    datasets: [{
      label: 'Dados',
      data: [65, 59, 80],
      backgroundColor: ['#1e5c3f', '#2d8659', '#ff9500']
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true } }
  }
});
</script>

**EXEMPLO DE GRÁFICO DE LINHA:**
<canvas id="chart2" width="800" height="400"></canvas>
<script>
new Chart(document.getElementById('chart2'), {
  type: 'line',
  data: {
    labels: ['Jan', 'Fev', 'Mar', 'Abr'],
    datasets: [{
      label: 'Crescimento',
      data: [30, 45, 60, 75],
      borderColor: '#1e5c3f',
      backgroundColor: 'rgba(30, 92, 63, 0.1)',
      tension: 0.4
    }]
  },
  options: { responsive: true }
});
</script>

**EXEMPLO DE GRÁFICO DE PIZZA:**
<canvas id="chart3" width="400" height="400"></canvas>
<script>
new Chart(document.getElementById('chart3'), {
  type: 'doughnut',
  data: {
    labels: ['Categoria A', 'Categoria B', 'Categoria C'],
    datasets: [{
      data: [30, 50, 20],
      backgroundColor: ['#1e5c3f', '#2d8659', '#ff9500']
    }]
  }
});
</script>

🎯 **QUANDO USAR CADA TIPO:**
- **Bar Charts**: Comparações entre categorias, rankings
- **Line Charts**: Evolução temporal, trends, crescimento
- **Doughnut/Pie**: Distribuição percentual, composição
- **Big Numbers**: KPIs únicos e principais (use .stat-number)

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

      if (data.type === 'pdf') {
        insights += `📄 PDF "${data.name}" (${data.pageCount} páginas):\n`;
        insights += `  ⚠️ CONTEÚDO COMPLETO DO PDF ESTÁ DISPONÍVEL!\n`;
        insights += `  ⚠️ USE ESTE CONTEÚDO PARA CRIAR OS SLIDES!\n`;
        insights += `  • Total de caracteres: ${data.content.length}\n\n`;
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