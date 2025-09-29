const OpenAI = require('openai');
const fs = require('fs-extra');
const path = require('path');

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'openai';

    if (this.provider === 'openai') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    this.ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = this.provider === 'openai'
      ? (process.env.OPENAI_MODEL || 'gpt-4o-mini')
      : (process.env.OLLAMA_MODEL || 'llama3.1:8b');
  }

  async generateContent(briefing, config) {
    try {
      const prompt = this.buildPrompt(briefing, config);

      let response;
      if (this.provider === 'openai') {
        response = await this.generateWithOpenAI(prompt);
      } else {
        response = await this.generateWithOllama(prompt);
      }

      return this.parseAIResponse(response, config);
    } catch (error) {
      throw new Error(`Erro na geração de conteúdo: ${error.message}`);
    }
  }

  buildPrompt(briefing, config) {
    const { templateType, company, audience, duration, tone } = config;

    return `
Você é um especialista em criação de apresentações corporativas. Com base no briefing fornecido,
gere conteúdo estruturado para uma apresentação ${templateType || 'comercial'}.

BRIEFING:
${briefing}

CONFIGURAÇÕES:
- Empresa: ${company || 'Nossa empresa'}
- Público-alvo: ${audience || 'Executivos'}
- Duração: ${duration || '15'} minutos
- Tom: ${tone || 'profissional'}

INSTRUÇÕES:
1. Gere conteúdo para cada módulo da apresentação
2. Mantenha consistência com a identidade da empresa
3. Adapte a linguagem para o público-alvo
4. Sugira imagens/ícones relevantes para cada seção
5. Inclua dados específicos quando possível

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título principal da apresentação",
  "modules": {
    "agenda": {
      "title": "Título da agenda",
      "content": "Conteúdo detalhado",
      "bullets": ["Item 1", "Item 2", "Item 3"],
      "suggestedImage": "descrição da imagem sugerida",
      "icons": ["ícone1", "ícone2"]
    },
    "problema": {
      "title": "Título do problema",
      "content": "Descrição do problema",
      "bullets": ["Ponto 1", "Ponto 2"],
      "suggestedImage": "descrição da imagem",
      "stats": "estatística relevante"
    },
    "solucao": {
      "title": "Título da solução",
      "content": "Descrição da solução",
      "bullets": ["Benefício 1", "Benefício 2"],
      "suggestedImage": "descrição da imagem"
    },
    "metricas": {
      "title": "Resultados e Métricas",
      "content": "Descrição dos resultados",
      "metrics": [
        {"label": "ROI", "value": "300%", "description": "Retorno sobre investimento"},
        {"label": "Economia", "value": "R$ 500k", "description": "Economia anual"}
      ],
      "suggestedChart": "tipo de gráfico sugerido"
    }
  },
  "suggestedAssets": {
    "colorPalette": ["#primary", "#secondary", "#accent"],
    "icons": ["icon-growth", "icon-security", "icon-automation"],
    "imageSearch": ["business growth", "team collaboration", "technology"]
  },
  "narrative": {
    "hook": "Frase de abertura impactante",
    "cta": "Call to action final",
    "keyMessage": "Mensagem principal"
  }
}

Responda APENAS com o JSON válido, sem explicações adicionais.
    `.trim();
  }

  async generateWithOpenAI(prompt) {
    const completion = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "Você é um especialista em apresentações corporativas. Sempre responda em JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // temperature: 0.7, // GPT-5 only supports default temperature (1)
      max_tokens: 4000
    });

    return completion.choices[0].message.content;
  }

  async generateWithOllama(prompt) {
    const fetch = require('node-fetch');

    const response = await fetch(`${this.ollamaBase}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          // temperature: 0.7, // GPT-5 only supports default temperature (1)
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  parseAIResponse(response, config) {
    try {
      const cleanResponse = response.replace(/```json\n?|```\n?/g, '');
      const parsed = JSON.parse(cleanResponse);

      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
        config,
        provider: this.provider,
        model: this.model
      };
    } catch (error) {
      console.warn('Erro ao parsear resposta da IA:', error.message);

      return this.createFallbackContent(config);
    }
  }

  createFallbackContent(config) {
    return {
      title: `Apresentação ${config.company || 'Corporativa'}`,
      modules: {
        agenda: {
          title: "Agenda",
          content: "Agenda da apresentação será definida com base nos objetivos.",
          bullets: ["Introdução", "Contexto", "Proposta", "Próximos passos"]
        },
        problema: {
          title: "Desafio Atual",
          content: "Identificação dos principais desafios e oportunidades de melhoria."
        },
        solucao: {
          title: "Nossa Proposta",
          content: "Solução customizada para atender às necessidades específicas."
        },
        metricas: {
          title: "Resultados Esperados",
          content: "Métricas e KPIs que demonstram o valor da proposta."
        }
      },
      suggestedAssets: {
        icons: ["growth", "solution", "metrics"],
        imageSearch: ["business", "technology", "success"]
      },
      narrative: {
        hook: "Uma oportunidade única de transformação.",
        cta: "Vamos começar essa jornada juntos?",
        keyMessage: "Resultados mensuráveis através de soluções inovadoras."
      },
      generatedAt: new Date().toISOString(),
      config,
      fallback: true
    };
  }

  async generateImageSuggestions(context, keywords = []) {
    try {
      const searchTerms = [
        ...keywords,
        context.includes('problem') ? ['challenge', 'issue', 'pain-point'] : [],
        context.includes('solution') ? ['innovation', 'technology', 'progress'] : [],
        context.includes('metrics') ? ['growth', 'chart', 'success'] : [],
        context.includes('team') ? ['collaboration', 'teamwork', 'people'] : []
      ].flat();

      return {
        primary: searchTerms.slice(0, 3),
        alternative: searchTerms.slice(3, 6),
        style: 'professional, clean, modern',
        avoid: 'clipart, low-quality, watermarks'
      };
    } catch (error) {
      return {
        primary: ['business', 'professional', 'corporate'],
        alternative: ['technology', 'growth', 'success'],
        style: 'professional, clean, modern'
      };
    }
  }

  async generateNarrativeFlow(modules, config) {
    const prompt = `
Com base nos módulos de apresentação fornecidos, crie um fluxo narrativo coeso para uma apresentação de ${config.duration || 15} minutos.

MÓDULOS: ${JSON.stringify(modules, null, 2)}

Gere:
1. Transições entre slides
2. Tempos sugeridos para cada seção
3. Frases de conexão
4. Momentos de interação com a audiência

Responda em JSON:
{
  "flow": [
    {
      "module": "agenda",
      "duration": "2 minutos",
      "transition": "frase de transição",
      "tips": "dicas de apresentação"
    }
  ],
  "totalDuration": "15 minutos",
  "interactionPoints": ["momento 1", "momento 2"],
  "keyPhrases": ["frase impacto 1", "frase impacto 2"]
}
    `;

    try {
      let response;
      if (this.provider === 'openai') {
        response = await this.generateWithOpenAI(prompt);
      } else {
        response = await this.generateWithOllama(prompt);
      }

      return JSON.parse(response.replace(/```json\n?|```\n?/g, ''));
    } catch (error) {
      return this.createFallbackFlow(modules, config);
    }
  }

  createFallbackFlow(modules, config) {
    const moduleNames = Object.keys(modules);
    const duration = parseInt(config.duration || 15);
    const timePerSlide = Math.floor(duration / moduleNames.length);

    return {
      flow: moduleNames.map((module, index) => ({
        module,
        duration: `${timePerSlide} minutos`,
        transition: index < moduleNames.length - 1
          ? `"Agora, vamos falar sobre ${moduleNames[index + 1]}..."`
          : '"Para concluir..."',
        tips: `Enfatize os pontos principais e mantenha o engajamento da audiência.`
      })),
      totalDuration: `${duration} minutos`,
      interactionPoints: ["Início: pergunta para a audiência", "Meio: momento de reflexão"],
      keyPhrases: ["O que isso significa para vocês?", "Vamos ver como isso se aplica na prática"]
    };
  }
}

module.exports = new AIService();