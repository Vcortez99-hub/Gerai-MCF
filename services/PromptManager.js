/**
 * PromptManager - Sistema centralizado de gerenciamento de prompts
 * Carrega prompts do arquivo consolidado PROMPTS_CONSOLIDADOS.md
 */

const fs = require('fs-extra');
const path = require('path');

class PromptManager {
  constructor() {
    this.consolidatedFile = path.join(__dirname, '..', 'PROMPTS_CONSOLIDADOS.md');
    this.cache = new Map();
    this.initialized = false;

    console.log('📝 PromptManager inicializado');
    console.log(`📂 Caminho do arquivo consolidado: ${this.consolidatedFile}`);
  }

  /**
   * Inicializa o sistema carregando todos os prompts
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔄 Carregando prompts do arquivo consolidado...');
      await this.loadAllPrompts();
      this.initialized = true;
      console.log(`✅ ${this.cache.size} prompts carregados com sucesso`);
    } catch (error) {
      console.error('❌ Erro ao carregar prompts:', error);
      throw error;
    }
  }

  /**
   * Carrega todos os prompts do arquivo consolidado
   */
  async loadAllPrompts() {
    const fileContent = await fs.readFile(this.consolidatedFile, 'utf8');

    // Regex para encontrar blocos JSON
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = jsonBlockRegex.exec(fileContent)) !== null) {
      try {
        const jsonContent = match[1];
        const promptData = JSON.parse(jsonContent);

        // Determinar categoria e nome baseado na estrutura do prompt
        let category, name;

        // Se o prompt tem um nome definido, usar para determinar categoria e nome
        if (promptData.name) {
          // Mapear nomes conhecidos para suas categorias
          const nameToCategory = {
            'briefing_analysis': 'analysis',
            'data_analysis_generator': 'analysis',
            'data_insights_generator': 'analysis',
            'determine_visualization_type': 'analysis',
            'visualization_type_selector': 'analysis',
            'chart_metrics_generator': 'generation',
            'content_slide_generator': 'generation',
            'cover_slide_generator': 'generation',
            'hidden_opportunity_generator': 'generation',
            'insights_no_attachments_generator': 'generation',
            'perspective_shift_generator': 'generation',
            'shock_reveal_generator': 'generation',
            'slide_structure_generator': 'generation',
            'contextual_visualization_generator': 'visualization'
          };

          category = nameToCategory[promptData.name] || 'generation';

          // Converter nome para formato de arquivo (remover sufixos)
          name = promptData.name
            .replace('_generator', '')
            .replace('_selector', '')
            .replace('_analysis', '');

          // Casos especiais de mapeamento
          if (promptData.name === 'briefing_analysis') name = 'briefing-analysis';
          if (promptData.name === 'data_analysis_generator') name = 'data-analysis';
          if (promptData.name === 'data_insights_generator') name = 'data-insights';
          if (promptData.name === 'determine_visualization_type') name = 'determine-visualization';
          if (promptData.name === 'visualization_type_selector') name = 'visualization-type';
          if (promptData.name === 'chart_metrics_generator') name = 'chart-metrics';
          if (promptData.name === 'content_slide_generator') name = 'content-slide';
          if (promptData.name === 'cover_slide_generator') name = 'cover-slide';
          if (promptData.name === 'hidden_opportunity_generator') name = 'hidden-opportunity';
          if (promptData.name === 'insights_no_attachments_generator') name = 'insights-no-attachments';
          if (promptData.name === 'perspective_shift_generator') name = 'perspective-shift';
          if (promptData.name === 'shock_reveal_generator') name = 'shock-reveal';
          if (promptData.name === 'slide_structure_generator') name = 'slide-structure';
          if (promptData.name === 'contextual_visualization_generator') name = 'contextual-visualization';

        } else {
          // Fallback para prompts sem nome definido
          category = 'generation';
          name = 'unknown-' + Math.random().toString(36).substr(2, 9);
        }

        const key = `${category}/${name}`;
        this.cache.set(key, promptData);

        console.log(`📄 Carregado: ${key}`);

      } catch (parseError) {
        console.warn(`⚠️ Erro ao fazer parse do JSON: ${parseError.message}`);
        continue;
      }
    }
  }

  /**
   * Obtém um prompt específico
   * @param {string} category - Categoria do prompt (analysis, generation, visualization)
   * @param {string} name - Nome do arquivo sem .json
   * @returns {Object} Dados do prompt
   */
  getPrompt(category, name) {
    const key = `${category}/${name}`;
    const prompt = this.cache.get(key);

    if (!prompt) {
      console.warn(`⚠️ Prompt não encontrado: ${key}`);
      console.log(`🔍 Chaves disponíveis no cache: ${Array.from(this.cache.keys()).join(', ')}`);
      throw new Error(`Prompt não encontrado: ${key}`);
    }

    return prompt;
  }

  /**
   * Constrói mensagens para OpenAI baseado no prompt
   * @param {string} category - Categoria do prompt
   * @param {string} name - Nome do prompt
   * @param {Object} variables - Variáveis para substituir no template
   * @returns {Array} Array de mensagens para OpenAI
   */
  buildMessages(category, name, variables = {}) {
    const prompt = this.getPrompt(category, name);

    // Processar system prompt
    let systemContent = prompt.system_prompt.content;

    // Substituir variáveis no system prompt se necessário
    for (const [key, value] of Object.entries(variables)) {
      systemContent = systemContent.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Processar user prompt
    let userContent = prompt.user_template;
    for (const [key, value] of Object.entries(variables)) {
      userContent = userContent.replace(new RegExp(`\\{${key}\\}`, 'g'), value || 'Não especificado');
    }

    return [
      {
        role: prompt.system_prompt.role,
        content: systemContent
      },
      {
        role: "user",
        content: userContent
      }
    ];
  }

  /**
   * Obtém lista de prompts disponíveis
   */
  getAvailablePrompts() {
    return Array.from(this.cache.keys());
  }

  /**
   * Recarrega prompts (útil para desenvolvimento)
   */
  async reload() {
    console.log('🔄 Recarregando prompts...');
    this.cache.clear();
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Verifica se um prompt existe
   */
  hasPrompt(category, name) {
    const key = `${category}/${name}`;
    return this.cache.has(key);
  }

  /**
   * Obtém estatísticas dos prompts carregados
   */
  getStats() {
    const stats = {
      total: this.cache.size,
      categories: {}
    };

    for (const key of this.cache.keys()) {
      const [category] = key.split('/');
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    }

    return stats;
  }
}

// Singleton instance
const promptManager = new PromptManager();

module.exports = promptManager;