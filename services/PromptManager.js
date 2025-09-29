/**
 * PromptManager - Sistema centralizado de gerenciamento de prompts
 * Carrega prompts de arquivos JSON externos para facilitar manutenção
 */

const fs = require('fs-extra');
const path = require('path');

class PromptManager {
  constructor() {
    this.promptsPath = path.join(__dirname, '..', 'prompts');
    this.cache = new Map();
    this.initialized = false;

    console.log('📝 PromptManager inicializado');
    console.log(`📂 Caminho dos prompts: ${this.promptsPath}`);
  }

  /**
   * Inicializa o sistema carregando todos os prompts
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔄 Carregando prompts externos...');
      await this.loadAllPrompts();
      this.initialized = true;
      console.log(`✅ ${this.cache.size} prompts carregados com sucesso`);
    } catch (error) {
      console.error('❌ Erro ao carregar prompts:', error);
      throw error;
    }
  }

  /**
   * Carrega todos os prompts de todos os diretórios
   */
  async loadAllPrompts() {
    const categories = ['analysis', 'generation', 'visualization'];

    for (const category of categories) {
      const categoryPath = path.join(this.promptsPath, category);

      if (await fs.pathExists(categoryPath)) {
        const files = await fs.readdir(categoryPath);

        for (const file of files) {
          if (file.endsWith('.json')) {
            const promptPath = path.join(categoryPath, file);
            const promptData = await fs.readJson(promptPath);

            const key = `${category}/${file.replace('.json', '')}`;
            this.cache.set(key, promptData);

            console.log(`📄 Carregado: ${key}`);
          }
        }
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