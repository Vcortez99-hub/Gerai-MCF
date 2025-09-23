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

    console.log('📝 Prompt length:', prompt.length, 'characters');

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 8000, // Aumentado para permitir respostas mais completas
      temperature: 0.3, // Reduzido para mais consistência
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
          promptTemplate = promptTemplate.replace(/\{\{duration\}\}/g, config.duration || '15');
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
    const { templateType, company, audience, duration, slideCount, tone } = config;

    return `Você é um especialista em criação de apresentações corporativas de alta qualidade, com capacidade de gerar conteúdo específico, detalhado e relevante. Analise o briefing fornecido e crie uma apresentação completa e profissional.

BRIEFING DO CLIENTE:
${briefing}

CONFIGURAÇÕES DA APRESENTAÇÃO:
- Empresa: ${company || 'Cliente'}
- Público-alvo: ${audience || 'Executivos'}
- Duração: ${duration || '15'} minutos
- Número de slides: ${slideCount || '6'}
- Tom: ${tone || 'profissional'}
- Tipo: ${templateType || 'comercial'}

INSTRUÇÕES CRÍTICAS:
1. ANALISE PROFUNDAMENTE o briefing - extraia insights específicos, dados relevantes e contexto
2. GERE CONTEÚDO ÚNICO baseado no briefing real, não templates genéricos
3. SEJA ESPECÍFICO - use dados, números, exemplos concretos quando possível
4. ADAPTE a linguagem para o público-alvo e tom especificados
5. CRIE uma narrativa coesa que conecte todos os slides
6. INCLUA detalhes técnicos e comerciais relevantes
7. SUGIRA elementos visuais específicos para cada slide

MÓDULOS OBRIGATÓRIOS (todos devem ser preenchidos):
Gere TODOS os módulos com conteúdo rico e específico:

1. CAPA - Título impactante e específico do briefing
2. AGENDA - Estrutura clara baseada no conteúdo
3. PROBLEMA/CONTEXTO - Desafio específico identificado no briefing
4. SOLUÇÃO - Proposta detalhada e específica
5. COMPARATIVO - Antes vs Depois ou análise competitiva
6. CASES - Exemplos práticos relevantes
7. MÉTRICAS - KPIs e resultados mensuráveis
8. TIMELINE - Cronograma de implementação
9. CONCLUSÃO - Próximos passos específicos

FORMATO DE RESPOSTA (JSON válido e completo):
{
  "title": "Título específico baseado no briefing (não genérico)",
  "slideCount": ${slideCount || 9},
  "modules": {
    "capa": {
      "title": "Título da apresentação específico para o briefing",
      "content": "Subtítulo que resume a proposta principal",
      "subtitle": "Linha de apoio com empresa e data"
    },
    "agenda": {
      "title": "Agenda da Apresentação",
      "content": "Estrutura planejada para atingir os objetivos",
      "bullets": ["Tópico específico 1", "Tópico específico 2", "Tópico específico 3", "Próximos passos"]
    },
    "problema": {
      "title": "Desafio/Oportunidade Identificada",
      "content": "Análise detalhada do contexto e problema específico do briefing",
      "bullets": ["Ponto crítico 1 baseado no briefing", "Ponto crítico 2 específico", "Impacto nos resultados"],
      "stats": "Estatística ou dado relevante do setor/problema"
    },
    "solucao": {
      "title": "Nossa Proposta de Solução",
      "content": "Descrição detalhada da solução específica para o problema identificado",
      "bullets": ["Benefício específico 1", "Benefício específico 2", "Diferencial competitivo", "Valor agregado"]
    },
    "comparativo": {
      "title": "Análise Comparativa",
      "content": "Comparação entre situação atual e futura ou vs concorrência",
      "bullets": ["Situação atual: problema específico", "Com nossa solução: melhoria específica", "Vantagem competitiva clara"]
    },
    "cases": {
      "title": "Cases de Sucesso Relevantes",
      "content": "Exemplos práticos de implementação similar",
      "bullets": ["Case 1: empresa similar - resultado específico", "Case 2: mesmo setor - métrica concreta", "Case 3: implementação recente - ROI alcançado"]
    },
    "metricas": {
      "title": "Resultados e Indicadores",
      "content": "KPIs mensuráveis e específicos esperados",
      "metrics": [
        {"label": "Métrica principal", "value": "Valor específico", "description": "Explicação do impacto"},
        {"label": "ROI", "value": "Porcentagem realista", "description": "Retorno sobre investimento"},
        {"label": "Eficiência", "value": "Melhoria específica", "description": "Ganho operacional"},
        {"label": "Satisfação", "value": "Meta específica", "description": "Indicador de qualidade"}
      ]
    },
    "timeline": {
      "title": "Cronograma de Implementação",
      "content": "Planejamento detalhado das etapas",
      "bullets": ["Fase 1: Análise e planejamento (prazo específico)", "Fase 2: Implementação piloto (prazo específico)", "Fase 3: Rollout completo (prazo específico)", "Fase 4: Monitoramento e otimização"]
    },
    "conclusao": {
      "title": "Próximos Passos",
      "content": "Resumo dos benefícios e ações específicas",
      "bullets": ["Aprovação da proposta específica", "Definição de cronograma detalhado", "Início da implementação", "Acompanhamento de resultados"]
    }
  },
  "suggestedAssets": {
    "colorPalette": ["#2563eb", "#059669", "#dc2626"],
    "icons": ["analytics", "growth", "solution", "success"],
    "imageSearch": ["business transformation", "digital innovation", "team collaboration"]
  },
  "narrative": {
    "hook": "Frase de abertura específica e impactante baseada no briefing",
    "cta": "Call to action específico e actionable",
    "keyMessage": "Mensagem principal que conecta problema, solução e resultados"
  }
}

CRÍTICO: Responda APENAS com o JSON válido, sem formatação markdown. O JSON deve ser completo com TODOS os módulos preenchidos com conteúdo específico e relevante.`;
  }

  parseAIResponse(response, config) {
    try {
      console.log('🔍 Raw AI Response:', response.substring(0, 500) + '...');

      // Limpeza mais robusta da resposta
      let cleanResponse = response
        .replace(/```json\n?|```\n?/g, '')
        .replace(/^[^{]*/, '') // Remove texto antes do primeiro {
        .replace(/[^}]*$/, '') // Remove texto depois do último }
        .trim();

      // Se não encontrou JSON válido, tentar extrair de outra forma
      if (!cleanResponse.startsWith('{')) {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanResponse = jsonMatch[0];
        }
      }

      console.log('🧹 Cleaned Response:', cleanResponse.substring(0, 200) + '...');

      const parsed = JSON.parse(cleanResponse);

      // Validar se tem a estrutura mínima necessária
      if (!parsed.modules || Object.keys(parsed.modules).length === 0) {
        throw new Error('Resposta AI não contém módulos válidos');
      }

      const result = {
        ...parsed,
        generatedAt: new Date().toISOString(),
        config,
        provider: this.provider,
        model: this.model
      };

      console.log('✅ AI Response parsed successfully with', Object.keys(result.modules).length, 'modules');
      return result;

    } catch (error) {
      console.error('❌ Erro ao parsear resposta do Claude:', error.message);
      console.log('📄 Original response:', response);

      // Fallback mais inteligente
      console.log('🔄 Usando geração fallback melhorada...');
      return this.generateEnhancedFallback(config.aiPrompt || '', config);
    }
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

    return {
      title,
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