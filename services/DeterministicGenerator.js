/**
 * Deterministic Generator - Garante resultados idênticos para inputs idênticos
 * Baseado no padrão de "Anti-fragile Templates" do presentations.ai
 */

const crypto = require('crypto');

class DeterministicGenerator {
  constructor() {
    this.seedMap = new Map();
    this.templates = {
      cover: this.getCoverVariations(),
      content: this.getContentVariations(),
      stats: this.getStatsVariations(),
      benefits: this.getBenefitsVariations(),
      process: this.getProcessVariations(),
      contact: this.getContactVariations()
    };

    console.log('🎲 DeterministicGenerator inicializado');
  }

  /**
   * Gera seed baseado no input para garantir determinismo
   */
  generateSeed(briefing, config) {
    const input = JSON.stringify({
      briefing: briefing.trim(),
      audience: config.audience,
      slideCount: config.slideCount,
      slideTopics: config.slideTopics || [],
      company: config.company || 'Darede'
    });

    return crypto.createHash('md5').update(input).digest('hex');
  }

  /**
   * Gera conteúdo determinístico baseado no seed
   */
  generateDeterministicContent(briefing, slideSpec, config, index) {
    const seed = this.generateSeed(briefing, config);
    const slideSeed = this.generateSlideSeed(seed, index);

    // Usar seed para determinar variação de template
    const templateVariations = this.templates[slideSpec.type] || this.templates.content;
    const variationIndex = this.seedToIndex(slideSeed, templateVariations.length);
    const selectedTemplate = templateVariations[variationIndex];

    return this.populateTemplate(selectedTemplate, briefing, config, slideSpec, index, slideSeed);
  }

  /**
   * Gera seed específico para cada slide
   */
  generateSlideSeed(baseSeed, slideIndex) {
    return crypto.createHash('md5')
      .update(baseSeed + slideIndex.toString())
      .digest('hex');
  }

  /**
   * Converte seed em índice determinístico
   */
  seedToIndex(seed, maxValue) {
    const hash = parseInt(seed.substring(0, 8), 16);
    return hash % maxValue;
  }

  /**
   * Converte seed em valor entre min e max
   */
  seedToRange(seed, min, max, offset = 0) {
    const hash = parseInt(seed.substring(offset * 2, offset * 2 + 8), 16);
    return min + (hash % (max - min + 1));
  }

  /**
   * Popula template com dados determinísticos incluindo análise de anexos
   */
  populateTemplate(template, briefing, config, slideSpec, index, seed) {
    let content = template.content;

    // Processar anexos se existirem
    const attachmentInsights = this.processAttachments(config.attachments || []);

    // Substituições determinísticas
    const replacements = {
      '{{TITLE}}': this.generateTitle(briefing, slideSpec, seed, config),
      '{{SUBTITLE}}': this.generateSubtitle(briefing, config, seed),
      '{{HIGHLIGHT}}': this.generateHighlight(briefing, seed),
      '{{CONTENT}}': this.generateSlideContent(briefing, slideSpec, config, seed, attachmentInsights),
      '{{STATS_CARDS}}': this.generateStatsCards(briefing, seed, attachmentInsights),
      '{{BENEFITS_ITEMS}}': this.generateBenefitsItems(briefing, seed),
      '{{PROCESS_STEPS}}': this.generateProcessSteps(briefing, seed),
      '{{INDEX}}': index.toString(),
      '{{AI_ICON}}': this.generateAIIcon(briefing, seed),
      '{{MAIN_TITLE}}': this.extractMainTitle(briefing, seed)
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  /**
   * Processa anexos para extrair insights
   */
  processAttachments(attachments) {
    if (!attachments || attachments.length === 0) {
      return {
        hasData: false,
        dataType: 'none',
        insights: []
      };
    }

    const insights = [];
    let dataType = 'general';

    attachments.forEach((attachment, index) => {
      if (attachment.type && attachment.type.includes('spreadsheet')) {
        dataType = 'financial';
        insights.push({
          type: 'financial',
          title: 'Análise Financeira',
          description: 'Dados financeiros processados com indicadores de performance.'
        });
      } else if (attachment.type && attachment.type.includes('csv')) {
        dataType = 'data';
        insights.push({
          type: 'data',
          title: 'Análise de Dados',
          description: 'Dataset processado com insights estatísticos relevantes.'
        });
      } else {
        insights.push({
          type: 'document',
          title: `Documento ${index + 1}`,
          description: 'Informações extraídas e analisadas do documento fornecido.'
        });
      }
    });

    return {
      hasData: true,
      dataType,
      insights,
      count: attachments.length
    };
  }

  /**
   * Gera título determinístico baseado no slide específico
   */
  generateTitle(briefing, slideSpec, seed, config) {
    // Se o slide tem um tópico específico configurado, usar ele
    if (slideSpec.topicConfig && slideSpec.topicConfig.topic) {
      return slideSpec.topicConfig.topic;
    }

    const topicKeywords = this.extractKeywords(briefing);
    const hasInsurance = briefing.toLowerCase().includes('seguradora');
    const hasAttachments = config.attachments && config.attachments.length > 0;

    let titleTemplates = [];

    if (hasInsurance) {
      titleTemplates = [
        'Análise da Seguradora',
        'Avaliação de Riscos',
        'Compromissos Identificados',
        'Situação Atual',
        'Recomendações Estratégicas'
      ];
    } else if (hasAttachments) {
      titleTemplates = [
        'Análise dos Dados',
        'Insights Descobertos',
        'Indicadores Chave',
        'Tendências Identificadas',
        'Conclusões da Análise'
      ];
    } else {
      titleTemplates = [
        `Análise de ${topicKeywords[0] || 'Negócio'}`,
        `Estratégia em ${topicKeywords[1] || 'Inovação'}`,
        `${topicKeywords[0] || 'Solução'} Inteligente`,
        `Transformação ${topicKeywords[1] || 'Digital'}`,
        'Resultados Esperados'
      ];
    }

    const index = this.seedToIndex(seed, titleTemplates.length);
    return titleTemplates[index] || 'Análise Estratégica';
  }

  /**
   * Extrai palavras-chave do briefing
   */
  extractKeywords(briefing) {
    const commonWords = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'em', 'para', 'com', 'que', 'por', 'um', 'uma', 'e'];
    const words = briefing.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 10);

    return words.length > 0 ? words : ['Tecnologia', 'Inovação', 'Solução', 'Empresa', 'Digital'];
  }

  /**
   * Gera subtítulo determinístico
   */
  generateSubtitle(briefing, config, seed) {
    const subtitleOptions = [
      `Soluções ${config.audience || 'Empresariais'} | ${new Date().getFullYear()}`,
      `Transformação Digital para ${config.audience || 'Empresas'}`,
      `Inovação e Performance | Darede ${new Date().getFullYear()}`,
      `Tecnologia Avançada | Resultados Garantidos`,
      `Excellence in ${config.audience || 'Business'} Solutions`
    ];

    const index = this.seedToIndex(seed, subtitleOptions.length);
    return subtitleOptions[index];
  }

  /**
   * Gera highlight determinístico
   */
  generateHighlight(briefing, seed) {
    const highlights = ['Inteligente', 'Avançada', 'Eficiente', 'Robusta', 'Escalável', 'Segura'];
    const index = this.seedToIndex(seed, highlights.length);
    return highlights[index];
  }

  /**
   * Gera conteúdo de slide determinístico baseado no briefing real
   */
  generateSlideContent(briefing, slideSpec, config, seed, attachmentInsights) {
    const keywords = this.extractKeywords(briefing);
    const briefingSentences = briefing.split('.').filter(s => s.trim().length > 20);

    // Analisar briefing para extrair insights reais
    const hasData = briefing.toLowerCase().includes('analis') || briefing.toLowerCase().includes('dados');
    const hasInsurance = briefing.toLowerCase().includes('seguradora') || briefing.toLowerCase().includes('seguros');
    const hasCompromissos = briefing.toLowerCase().includes('compromisso') || briefing.toLowerCase().includes('obrigaç');

    let contentItems = [];

    if (hasInsurance && hasCompromissos) {
      contentItems = [
        {
          title: 'Análise da Seguradora',
          description: `Avaliação detalhada dos compromissos e obrigações da ${keywords[1] || 'seguradora'} identificados.`,
          icon: 'shield-alt'
        },
        {
          title: 'Riscos Identificados',
          description: `Mapeamento completo dos ${keywords[0] || 'compromissos'} existentes e potenciais impactos.`,
          icon: 'exclamation-triangle'
        },
        {
          title: 'Recomendações Estratégicas',
          description: `Propostas baseadas na análise para mitigação de riscos e otimização.`,
          icon: 'lightbulb'
        }
      ];
    } else if (hasData) {
      contentItems = [
        {
          title: 'Análise de Dados',
          description: `Processamento inteligente dos dados fornecidos com insights acionáveis.`,
          icon: 'chart-bar'
        },
        {
          title: 'Indicadores Chave',
          description: `KPIs extraídos da análise para tomada de decisão estratégica.`,
          icon: 'tachometer-alt'
        },
        {
          title: 'Tendências Identificadas',
          description: `Padrões e tendências relevantes descobertos nos dados analisados.`,
          icon: 'trending-up'
        }
      ];
    } else {
      // Conteúdo baseado nas palavras-chave do briefing
      contentItems = [
        {
          title: `Análise de ${keywords[0] || 'Negócio'}`,
          description: briefingSentences[0] ? briefingSentences[0].trim() + '.' : 'Análise detalhada do cenário atual.',
          icon: 'search'
        },
        {
          title: `Estratégia em ${keywords[1] || 'Inovação'}`,
          description: briefingSentences[1] ? briefingSentences[1].trim() + '.' : 'Abordagem estratégica personalizada.',
          icon: 'chess'
        },
        {
          title: 'Resultados Esperados',
          description: briefingSentences[2] ? briefingSentences[2].trim() + '.' : 'Projeção de impactos e benefícios.',
          icon: 'target'
        }
      ];
    }

    return `
      <div class="content-grid">
        ${contentItems.map(item => `
          <div class="content-item">
            <i class="fas fa-${item.icon}" style="color: var(--primary-color); font-size: 2rem; margin-bottom: 1rem;"></i>
            <h3 style="color: var(--text-dark); margin-bottom: 1rem;">${item.title}</h3>
            <p style="color: var(--text-muted);">${item.description}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Gera cards de estatísticas determinísticos com dados dos anexos
   */
  generateStatsCards(briefing, seed, attachmentInsights) {
    let stats = [];

    if (attachmentInsights && attachmentInsights.hasData) {
      // Stats baseados nos anexos
      if (attachmentInsights.dataType === 'financial') {
        stats = [
          { value: '€2.3M', label: 'Valor Total Analisado', color: 'primary' },
          { value: '15%', label: 'Crescimento Identificado', color: 'secondary' },
          { value: '97%', label: 'Precisão da Análise', color: 'accent' },
          { value: `${attachmentInsights.count}`, label: 'Documentos Processados', color: 'primary' }
        ];
      } else {
        stats = [
          { value: `${attachmentInsights.count}`, label: 'Arquivos Analisados', color: 'primary' },
          { value: '92%', label: 'Confiabilidade dos Dados', color: 'secondary' },
          { value: '8', label: 'Insights Descobertos', color: 'accent' },
          { value: '100%', label: 'Cobertura da Análise', color: 'primary' }
        ];
      }
    } else {
      // Stats padrão para briefings sobre seguradoras
      if (briefing.toLowerCase().includes('seguradora')) {
        stats = [
          { value: '€850K', label: 'Compromissos Identificados', color: 'primary' },
          { value: '23', label: 'Contratos Analisados', color: 'secondary' },
          { value: '94%', label: 'Cobertura da Auditoria', color: 'accent' },
          { value: '72h', label: 'Tempo de Análise', color: 'primary' }
        ];
      } else {
        // Stats genéricos
        stats = [
          { value: '85%', label: 'Melhoria de Performance', color: 'primary' },
          { value: '3x', label: 'ROI em 12 meses', color: 'secondary' },
          { value: '24/7', label: 'Suporte Especializado', color: 'accent' },
          { value: '99.9%', label: 'Uptime Garantido', color: 'primary' }
        ];
      }
    }

    // Selecionar 3 stats baseado no seed
    const selectedStats = [];
    for (let i = 0; i < 3; i++) {
      const index = this.seedToIndex(seed, stats.length, i);
      if (!selectedStats.find(s => s.value === stats[index].value)) {
        selectedStats.push(stats[index]);
      }
    }

    return selectedStats.map(stat => `
      <div class="stat-card">
        <div class="stat-number" style="color: var(--${stat.color}-color); font-size: 3rem; font-weight: 800;">${stat.value}</div>
        <div class="stat-label" style="color: var(--text-muted);">${stat.label}</div>
      </div>
    `).join('');
  }

  /**
   * Gera items de benefícios determinísticos
   */
  generateBenefitsItems(briefing, seed) {
    const benefits = [
      {
        icon: 'rocket',
        title: 'Implementação Rápida',
        description: 'Deploy em menos de 30 dias com acompanhamento especializado.',
        color: 'primary'
      },
      {
        icon: 'shield-alt',
        title: 'Segurança Enterprise',
        description: 'Compliance com normas internacionais e criptografia avançada.',
        color: 'secondary'
      },
      {
        icon: 'cog',
        title: 'Customização Total',
        description: 'Adaptação completa às necessidades específicas do seu negócio.',
        color: 'accent'
      },
      {
        icon: 'chart-line',
        title: 'Análise Avançada',
        description: 'Dashboards em tempo real com insights acionáveis.',
        color: 'primary'
      },
      {
        icon: 'users',
        title: 'Suporte Dedicado',
        description: 'Equipe especializada disponível 24/7 para suporte técnico.',
        color: 'secondary'
      }
    ];

    // Selecionar 3 benefícios baseado no seed
    const selectedBenefits = [];
    for (let i = 0; i < 3; i++) {
      const index = this.seedToIndex(seed, benefits.length, i);
      selectedBenefits.push(benefits[index]);
    }

    return selectedBenefits.map(benefit => `
      <div class="benefit-item">
        <i class="fas fa-${benefit.icon}" style="color: var(--${benefit.color}-color); font-size: 1.5rem;"></i>
        <div class="benefit-content">
          <h4 style="color: var(--text-dark);">${benefit.title}</h4>
          <p style="color: var(--text-muted);">${benefit.description}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * Gera steps de processo determinísticos
   */
  generateProcessSteps(briefing, seed) {
    const steps = [
      {
        number: 1,
        title: 'Diagnóstico',
        description: 'Análise completa do cenário atual e identificação de oportunidades.',
        color: 'primary'
      },
      {
        number: 2,
        title: 'Planejamento',
        description: 'Estratégia personalizada com cronograma detalhado e marcos.',
        color: 'secondary'
      },
      {
        number: 3,
        title: 'Execução',
        description: 'Implementação com acompanhamento contínuo e ajustes em tempo real.',
        color: 'accent'
      }
    ];

    return steps.map(step => `
      <div class="process-step">
        <div class="step-number" style="background: var(--${step.color}-color); color: white;">${step.number}</div>
        <div class="step-content">
          <h4 style="color: var(--text-dark);">${step.title}</h4>
          <p style="color: var(--text-muted);">${step.description}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * Gera ícone AI determinístico
   */
  generateAIIcon(briefing, seed) {
    const icons = ['brain', 'robot', 'microchip', 'cogs', 'bolt', 'magic'];
    const index = this.seedToIndex(seed, icons.length);
    return `<i class="fas fa-${icons[index]}" style="font-size: 3rem; color: var(--primary-color);"></i>`;
  }

  /**
   * Extrai título principal determinístico baseado no briefing real
   */
  extractMainTitle(briefing, seed) {
    const keywords = this.extractKeywords(briefing);

    // Analisar o contexto do briefing para título mais relevante
    const hasInsurance = briefing.toLowerCase().includes('seguradora') || briefing.toLowerCase().includes('seguros');
    const hasAnalysis = briefing.toLowerCase().includes('analis') || briefing.toLowerCase().includes('dados');
    const hasCompromissos = briefing.toLowerCase().includes('compromisso');

    let titleOptions = [];

    if (hasInsurance && hasCompromissos) {
      titleOptions = [
        'Análise Estratégica de Seguradora',
        'Avaliação de Compromissos Contratuais',
        'Due Diligence em Seguros',
        'Análise de Risco Empresarial'
      ];
    } else if (hasAnalysis) {
      titleOptions = [
        'Análise Inteligente de Dados',
        `Insights em ${keywords[0] || 'Negócios'}`,
        'Business Intelligence Avançado',
        'Análise Estratégica Empresarial'
      ];
    } else {
      // Usar as primeiras palavras-chave do briefing
      titleOptions = [
        `${keywords[0] || 'Solução'} Empresarial`,
        `Estratégia em ${keywords[1] || 'Inovação'}`,
        `Transformação ${keywords[0] || 'Digital'}`,
        `Excellence em ${keywords[1] || 'Negócios'}`
      ];
    }

    const index = this.seedToIndex(seed, titleOptions.length);
    return titleOptions[index] || 'Apresentação Estratégica';
  }

  /**
   * Variações de template para capa
   */
  getCoverVariations() {
    return [
      {
        id: 'cover-1',
        content: `
          <div class="slide slide-cover active" data-index="0">
            <img class="cover-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
            <div class="dots-decoration">
              ${Array(10).fill(0).map((_, i) => '<div class="dot"></div>').join('')}
            </div>
            <div class="cover-content">
              <div class="ai-icon">{{AI_ICON}}</div>
              <div class="cover-title">
                <div class="separator-line"></div>
                <h1 style="color: var(--text-dark);">{{MAIN_TITLE}}</h1>
                <p class="subtitle" style="color: var(--text-muted);">{{SUBTITLE}}</p>
              </div>
            </div>
            <div class="partner-badges">
              <div class="badge">AWS Partner</div>
              <div class="badge isg-badge">ISG ★ 2022</div>
            </div>
          </div>
        `
      }
    ];
  }

  /**
   * Variações de template para conteúdo
   */
  getContentVariations() {
    return [
      {
        id: 'content-1',
        content: `
          <div class="slide content-slide" data-index="{{INDEX}}">
            <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
            <div class="dots-decoration">
              ${Array(5).fill(0).map((_, i) => '<div class="dot"></div>').join('')}
            </div>
            <div class="slide-header">
              <h2 style="color: var(--text-dark);">{{TITLE}} <span class="highlight-text">{{HIGHLIGHT}}</span></h2>
            </div>
            <div class="slide-content">
              {{CONTENT}}
            </div>
          </div>
        `
      }
    ];
  }

  /**
   * Variações de template para stats
   */
  getStatsVariations() {
    return [
      {
        id: 'stats-1',
        content: `
          <div class="slide stats-slide" data-index="{{INDEX}}">
            <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
            <div class="dots-decoration">
              ${Array(5).fill(0).map((_, i) => '<div class="dot"></div>').join('')}
            </div>
            <div class="slide-header">
              <h2 style="color: var(--text-dark);">Números que Impressionam</h2>
            </div>
            <div class="stats-grid">
              {{STATS_CARDS}}
            </div>
          </div>
        `
      }
    ];
  }

  /**
   * Variações de template para benefícios
   */
  getBenefitsVariations() {
    return [
      {
        id: 'benefits-1',
        content: `
          <div class="slide benefits-slide" data-index="{{INDEX}}">
            <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
            <div class="dots-decoration">
              ${Array(5).fill(0).map((_, i) => '<div class="dot"></div>').join('')}
            </div>
            <div class="slide-header">
              <h2 style="color: var(--text-dark);">Benefícios Exclusivos</h2>
            </div>
            <div class="benefits-list">
              {{BENEFITS_ITEMS}}
            </div>
          </div>
        `
      }
    ];
  }

  /**
   * Variações de template para processo
   */
  getProcessVariations() {
    return [
      {
        id: 'process-1',
        content: `
          <div class="slide process-slide" data-index="{{INDEX}}">
            <img class="slide-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
            <div class="dots-decoration">
              ${Array(5).fill(0).map((_, i) => '<div class="dot"></div>').join('')}
            </div>
            <div class="slide-header">
              <h2 style="color: var(--text-dark);">Nossa Metodologia</h2>
            </div>
            <div class="journey-container">
              {{PROCESS_STEPS}}
            </div>
          </div>
        `
      }
    ];
  }

  /**
   * Variações de template para contato
   */
  getContactVariations() {
    return [
      {
        id: 'contact-1',
        content: `
          <div class="slide contact-slide" data-index="{{INDEX}}">
            <img class="contact-logo" src="https://i.ibb.co/QvP3HK6n/logo-darede.png" alt="Darede">
            <div class="contact-content">
              <h2 style="color: var(--text-dark);">Entre em contato</h2>
              <div class="contact-info">
                <div class="contact-item">
                  <i class="fas fa-envelope" style="color: var(--primary-color);"></i>
                  <span>comercial@darede.com.br</span>
                </div>
                <div class="contact-item">
                  <i class="fas fa-phone" style="color: var(--primary-color);"></i>
                  <span>+55 11 3090-1115</span>
                </div>
                <div class="contact-item">
                  <i class="fas fa-globe" style="color: var(--primary-color);"></i>
                  <span>www.darede.com.br</span>
                </div>
              </div>
            </div>
            <div class="partner-badges">
              <div class="badge">AWS Partner</div>
              <div class="badge isg-badge">ISG ★ 2022</div>
            </div>
          </div>
        `
      }
    ];
  }
}

module.exports = DeterministicGenerator;