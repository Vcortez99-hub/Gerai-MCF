/**
 * Quality Assurance System - Baseado no padrão presentations.ai
 * Garante que cada apresentação gerada atenda aos padrões enterprise
 */

class QualityAssurance {
  constructor() {
    this.qualityRules = {
      // Regras de Branding
      branding: [
        {
          name: 'Logo Presence',
          check: (html) => html.includes('logo-darede-white.png'),
          severity: 'critical',
          message: 'Logo da Darede deve estar presente'
        },
        {
          name: 'Brand Colors',
          check: (html) => html.includes('#1e5c3f') && html.includes('#ff9500'),
          severity: 'critical',
          message: 'Cores da marca devem ser utilizadas'
        }
      ],

      // Regras de Consistência Visual
      visual: [
        {
          name: 'Font Family',
          check: (html) => html.includes('Inter'),
          severity: 'high',
          message: 'Fonte Inter deve ser utilizada'
        },
        {
          name: 'Color Contrast',
          check: (html) => !this.hasContrastIssues(html),
          severity: 'critical',
          message: 'Contraste de cores deve ser adequado'
        },
        {
          name: 'Responsive Design',
          check: (html) => html.includes('@media') && html.includes('max-width'),
          severity: 'high',
          message: 'Design deve ser responsivo'
        }
      ],

      // Regras de Estrutura
      structure: [
        {
          name: 'Cover Slide',
          check: (html) => html.includes('slide-cover'),
          severity: 'critical',
          message: 'Slide de capa é obrigatório'
        },
        {
          name: 'Contact Slide',
          check: (html) => html.includes('contact-slide') || html.includes('comercial@darede.com.br'),
          severity: 'critical',
          message: 'Slide de contato é obrigatório'
        },
        {
          name: 'Navigation System',
          check: (html) => html.includes('nav-dot') && html.includes('nav-btn'),
          severity: 'high',
          message: 'Sistema de navegação deve estar presente'
        }
      ],

      // Regras de Conteúdo
      content: [
        {
          name: 'Title Hierarchy',
          check: (html) => this.checkTitleHierarchy(html),
          severity: 'medium',
          message: 'Hierarquia de títulos deve ser consistente'
        },
        {
          name: 'Content Balance',
          check: (html) => this.checkContentBalance(html),
          severity: 'medium',
          message: 'Slides devem ter conteúdo equilibrado'
        }
      ],

      // Regras Técnicas
      technical: [
        {
          name: 'Valid HTML',
          check: (html) => this.isValidHTML(html),
          severity: 'critical',
          message: 'HTML deve ser válido'
        },
        {
          name: 'CSS Variables',
          check: (html) => html.includes('--primary-color') && html.includes('--secondary-color'),
          severity: 'high',
          message: 'CSS variables devem ser utilizadas'
        },
        {
          name: 'Accessibility',
          check: (html) => this.checkAccessibility(html),
          severity: 'high',
          message: 'Deve seguir padrões de acessibilidade'
        }
      ]
    };

    console.log('🛡️ QualityAssurance inicializado - Padrões Enterprise');
  }

  /**
   * Executa auditoria completa da apresentação
   */
  auditPresentation(htmlContent, metadata = {}) {
    console.log('🔍 Iniciando auditoria de qualidade...');

    const results = {
      score: 100,
      status: 'passed',
      issues: [],
      warnings: [],
      passed: [],
      summary: {},
      metadata: {
        auditDate: new Date().toISOString(),
        version: '2.0.0',
        ...metadata
      }
    };

    // Executar todas as categorias de regras
    Object.entries(this.qualityRules).forEach(([category, rules]) => {
      const categoryResults = this.runCategoryRules(htmlContent, rules, category);

      results.issues.push(...categoryResults.issues);
      results.warnings.push(...categoryResults.warnings);
      results.passed.push(...categoryResults.passed);
      results.summary[category] = categoryResults.summary;

      // Calcular impacto no score
      results.score -= categoryResults.penalty;
    });

    // Determinar status final
    results.score = Math.max(0, results.score);
    if (results.score >= 90) results.status = 'excellent';
    else if (results.score >= 80) results.status = 'good';
    else if (results.score >= 70) results.status = 'acceptable';
    else if (results.score >= 60) results.status = 'needs-improvement';
    else results.status = 'failed';

    console.log(`✅ Auditoria concluída - Score: ${results.score}% (${results.status})`);

    return results;
  }

  /**
   * Executa regras de uma categoria específica
   */
  runCategoryRules(htmlContent, rules, category) {
    const results = {
      issues: [],
      warnings: [],
      passed: [],
      penalty: 0,
      summary: { total: rules.length, passed: 0, failed: 0, warnings: 0 }
    };

    rules.forEach(rule => {
      try {
        const passed = rule.check(htmlContent);

        if (passed) {
          results.passed.push({
            category,
            rule: rule.name,
            message: `${rule.name} - OK`
          });
          results.summary.passed++;
        } else {
          const issue = {
            category,
            rule: rule.name,
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date().toISOString()
          };

          if (rule.severity === 'critical') {
            results.issues.push(issue);
            results.penalty += 15;
            results.summary.failed++;
          } else if (rule.severity === 'high') {
            results.issues.push(issue);
            results.penalty += 10;
            results.summary.failed++;
          } else if (rule.severity === 'medium') {
            results.warnings.push(issue);
            results.penalty += 5;
            results.summary.warnings++;
          } else {
            results.warnings.push(issue);
            results.penalty += 2;
            results.summary.warnings++;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao executar regra ${rule.name}:`, error.message);
        results.warnings.push({
          category,
          rule: rule.name,
          severity: 'medium',
          message: `Erro na verificação: ${error.message}`,
          timestamp: new Date().toISOString()
        });
        results.penalty += 5;
        results.summary.warnings++;
      }
    });

    return results;
  }

  /**
   * Verifica problemas de contraste
   */
  hasContrastIssues(html) {
    const badPatterns = [
      /#ffffff.*color:\s*#ffffff/gi,  // Branco em branco
      /#1e5c3f.*color:\s*#1e5c3f/gi,  // Verde em verde
      /#ff9500.*color:\s*#ff9500/gi   // Laranja em laranja
    ];

    return badPatterns.some(pattern => pattern.test(html));
  }

  /**
   * Verifica hierarquia de títulos
   */
  checkTitleHierarchy(html) {
    // Verifica se há pelo menos um H1 e que a hierarquia é lógica
    const h1Count = (html.match(/<h1[^>]*>/g) || []).length;
    const h2Count = (html.match(/<h2[^>]*>/g) || []).length;

    return h1Count >= 1 && h2Count >= 1;
  }

  /**
   * Verifica equilíbrio do conteúdo
   */
  checkContentBalance(html) {
    // Conta slides e verifica se têm conteúdo suficiente
    const slides = (html.match(/class="slide[^"]*"/g) || []).length;
    const contentElements = (html.match(/<(p|li|div)[^>]*>[^<]+<\/\1>/g) || []).length;

    return slides > 0 && contentElements > slides * 2; // Pelo menos 2 elementos de conteúdo por slide
  }

  /**
   * Validação básica de HTML
   */
  isValidHTML(html) {
    // Verificações básicas de HTML válido
    const hasDoctype = html.includes('<!DOCTYPE html>');
    const hasHtmlTags = html.includes('<html') && html.includes('</html>');
    const hasHeadBody = html.includes('<head>') && html.includes('<body>');

    return hasDoctype && hasHtmlTags && hasHeadBody;
  }

  /**
   * Verifica padrões básicos de acessibilidade
   */
  checkAccessibility(html) {
    // Verifica se há alt text em imagens e labels adequados
    const images = (html.match(/<img[^>]+>/g) || []);
    const imagesWithAlt = (html.match(/<img[^>]+alt="[^"]+"/g) || []);

    const buttons = (html.match(/<button[^>]*>/g) || []).length;
    const buttonsWithAria = (html.match(/<button[^>]*(aria-label|title)="[^"]+"/g) || []).length;

    return images.length === imagesWithAlt.length && (buttons === 0 || buttonsWithAria > 0);
  }

  /**
   * Gera relatório detalhado
   */
  generateReport(auditResults) {
    const report = {
      executive_summary: {
        score: auditResults.score,
        status: auditResults.status,
        total_issues: auditResults.issues.length,
        total_warnings: auditResults.warnings.length,
        compliance_level: this.getComplianceLevel(auditResults.score)
      },

      detailed_analysis: {
        categories: auditResults.summary,
        critical_issues: auditResults.issues.filter(i => i.severity === 'critical'),
        high_priority: auditResults.issues.filter(i => i.severity === 'high'),
        improvements: auditResults.warnings
      },

      recommendations: this.generateRecommendations(auditResults),

      next_steps: this.generateNextSteps(auditResults)
    };

    return report;
  }

  /**
   * Determina nível de compliance
   */
  getComplianceLevel(score) {
    if (score >= 95) return 'Enterprise Ready';
    if (score >= 90) return 'Production Ready';
    if (score >= 80) return 'Good Quality';
    if (score >= 70) return 'Acceptable';
    if (score >= 60) return 'Needs Improvement';
    return 'Major Issues';
  }

  /**
   * Gera recomendações baseadas nos resultados
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.issues.some(i => i.category === 'branding')) {
      recommendations.push({
        priority: 'high',
        category: 'branding',
        action: 'Corrigir problemas de marca para manter consistência visual'
      });
    }

    if (results.issues.some(i => i.category === 'visual')) {
      recommendations.push({
        priority: 'high',
        category: 'visual',
        action: 'Ajustar elementos visuais para melhor experiência do usuário'
      });
    }

    if (results.score < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'overall',
        action: 'Revisão geral recomendada antes de uso em ambiente de produção'
      });
    }

    return recommendations;
  }

  /**
   * Gera próximos passos
   */
  generateNextSteps(results) {
    if (results.status === 'excellent' || results.status === 'good') {
      return [
        'Apresentação aprovada para uso enterprise',
        'Realizar testes de usuário para validação final',
        'Considerar para template base do sistema'
      ];
    } else if (results.status === 'acceptable') {
      return [
        'Corrigir issues críticos antes do uso',
        'Revisar warnings para melhorar qualidade',
        'Re-executar auditoria após correções'
      ];
    } else {
      return [
        'Correção de issues críticos é obrigatória',
        'Não recomendado para uso até correções',
        'Considerar re-geração da apresentação'
      ];
    }
  }

  /**
   * Executa teste A/B de consistência
   */
  async runConsistencyTest(briefing, config, iterations = 3) {
    console.log(`🧪 Iniciando teste de consistência (${iterations} iterações)...`);

    const results = [];

    for (let i = 0; i < iterations; i++) {
      console.log(`📊 Executando iteração ${i + 1}/${iterations}`);

      // Simular geração (em produção, chamaria o ConsistencyEngine)
      const presentation = await this.simulateGeneration(briefing, config);
      const audit = this.auditPresentation(presentation.html, { iteration: i + 1 });

      results.push({
        iteration: i + 1,
        score: audit.score,
        issues: audit.issues.length,
        warnings: audit.warnings.length,
        html_length: presentation.html.length,
        generation_time: presentation.time
      });
    }

    const analysis = this.analyzeConsistencyResults(results);

    console.log(`✅ Teste concluído - Consistência: ${analysis.consistency_score}%`);

    return {
      test_results: results,
      analysis,
      recommendation: analysis.consistency_score >= 85 ? 'approved' : 'needs_improvement'
    };
  }

  /**
   * Analisa resultados do teste de consistência
   */
  analyzeConsistencyResults(results) {
    const scores = results.map(r => r.score);
    const avgScore = scores.reduce((a, b) => a + b) / scores.length;
    const scoreVariance = this.calculateVariance(scores);
    const consistencyScore = Math.max(0, 100 - (scoreVariance * 10));

    return {
      average_score: avgScore,
      score_variance: scoreVariance,
      consistency_score: consistencyScore,
      min_score: Math.min(...scores),
      max_score: Math.max(...scores),
      stable: scoreVariance < 5,
      recommendation: consistencyScore >= 85 ? 'Enterprise Ready' : 'Needs Stabilization'
    };
  }

  /**
   * Calcula variância dos scores
   */
  calculateVariance(scores) {
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  /**
   * Simula geração para testes
   */
  async simulateGeneration(briefing, config) {
    const startTime = Date.now();

    // Simulação de geração (em produção seria chamada real)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    return {
      html: `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="slide slide-cover"><img src="logo-darede-white.png" alt="Darede"></div></body></html>`,
      time: Date.now() - startTime
    };
  }
}

module.exports = QualityAssurance;