// services/AIService.js
const VisualPromptBuilder = require('./VisualPromptBuilder');

class AIService {
  async generatePresentation(briefing, config) {
    const provider = process.env.AI_PROVIDER || 'openai';
    
    // 🔥 CRITICAL: Configurações corretas para geração longa
    const generationConfig = {
      temperature: 0.7,        // Criatividade moderada
      max_tokens: 16000,       // 🚨 AUMENTAR! Era muito baixo
      top_p: 0.9,
      frequency_penalty: 0.3,  // Reduz repetição
      presence_penalty: 0.2    // Incentiva novos tópicos
    };

    if (provider === 'openai') {
      return this.generateWithOpenAI(briefing, config, generationConfig);
    } else if (provider === 'ollama') {
      return this.generateWithOllama(briefing, config, generationConfig);
    }
  }

  async generateWithOpenAI(briefing, config, genConfig) {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = await VisualPromptBuilder.build(briefing, config);

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um designer visual expert especializado em criar apresentações HTML impactantes.

REGRAS ABSOLUTAS:
1. Retorne APENAS código HTML completo (de <!DOCTYPE html> até </html>)
2. NÃO use markdown (sem \`\`\`html ou \`\`\`)
3. NÃO adicione explicações antes ou depois do código
4. SIGA EXATAMENTE as instruções do prompt do usuário
5. CSS e JavaScript devem estar INLINE no HTML
6. Use encoding UTF-8 correto
7. NUNCA inclua datas
8. Gere apresentações COMPLETAS e FUNCIONAIS`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: genConfig.temperature,
        max_tokens: genConfig.max_tokens,
        top_p: genConfig.top_p,
        frequency_penalty: genConfig.frequency_penalty,
        presence_penalty: genConfig.presence_penalty
      });

      let html = completion.choices[0].message.content;
      
      // 🔧 Limpeza e validação
      html = VisualPromptBuilder.cleanResponse(html);
      html = this.fixEncoding(html);
      html = this.removeDates(html);
      
      const validation = VisualPromptBuilder.validateResponse(html);
      
      if (!validation.valid) {
        console.warn('⚠️ Validação falhou:', validation);
        
        // 🔄 RETRY com prompt mais direto
        if (validation.score < 50) {
          console.log('🔄 Tentando regenerar com prompt simplificado...');
          return this.retryWithSimplifiedPrompt(briefing, config);
        }
      }

      return {
        html,
        validation,
        metadata: {
          model: process.env.OPENAI_MODEL,
          tokens: completion.usage.total_tokens,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Erro OpenAI:', error);
      throw error;
    }
  }

  async generateWithOllama(briefing, config, genConfig) {
    const axios = require('axios');
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';

    const prompt = await VisualPromptBuilder.build(briefing, config);

    try {
      const response = await axios.post(`${baseUrl}/api/generate`, {
        model,
        prompt: `Você é um designer visual expert. Crie uma apresentação HTML completa seguindo EXATAMENTE as instruções abaixo.

RETORNE APENAS HTML VÁLIDO. SEM MARKDOWN. SEM EXPLICAÇÕES.

${prompt}`,
        stream: false,
        options: {
          temperature: genConfig.temperature,
          num_predict: genConfig.max_tokens,
          top_p: genConfig.top_p,
          frequency_penalty: genConfig.frequency_penalty,
          presence_penalty: genConfig.presence_penalty
        }
      }, {
        timeout: 180000 // 3 minutos
      });

      let html = response.data.response;
      html = VisualPromptBuilder.cleanResponse(html);
      html = this.fixEncoding(html);
      html = this.removeDates(html);

      const validation = VisualPromptBuilder.validateResponse(html);

      return {
        html,
        validation,
        metadata: {
          model,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Erro Ollama:', error);
      throw error;
    }
  }

  // 🔧 Corrige encoding UTF-8
  fixEncoding(html) {
    const fixes = {
      'Ã§Ã£o': 'ção',
      'Ã§': 'ç',
      'Ã£': 'ã',
      'Ã©': 'é',
      'Ã­': 'í',
      'Ã³': 'ó',
      'Ãº': 'ú',
      'Ã¡': 'á',
      'Ã': 'õ',
      'Ãª': 'ê',
      'Ã¢': 'â',
      '&lt;': '<',
      '&gt;': '>'
    };

    let fixed = html;
    Object.entries(fixes).forEach(([bad, good]) => {
      fixed = fixed.replaceAll(bad, good);
    });

    return fixed;
  }

  // 🔧 Remove datas
  removeDates(html) {
    // Remove padrões de data comuns
    html = html.replace(/<p>(\d{2}\/\d{2}\/\d{4})<\/p>/g, '');
    html = html.replace(/\d{2}\/\d{2}\/\d{4}/g, '');
    html = html.replace(/\d{4}-\d{2}-\d{2}/g, '');
    return html;
  }

  // 🔄 Retry com prompt mais agressivo
  async retryWithSimplifiedPrompt(briefing, config) {
    console.log('🔄 Executando retry...');
    
    const directPrompt = `IMPORTANTE: Retorne APENAS código HTML. Sem markdown, sem explicações.

Crie uma apresentação profissional com:
- 6 slides com layouts VARIADOS
- CSS INLINE completo e profissional
- JavaScript de navegação funcional
- Cores Darede: #1e5c3f (verde), #ff9500 (laranja)
- Logo: https://i.ibb.co/QvP3HK6n/logo-darede.png
- Animações suaves
- Design moderno e impactante

Briefing: ${briefing}

Empresa: ${config.company || 'Cliente'}
Público: ${config.audience || 'Executivos'}

GERE O HTML COMPLETO AGORA:`;

    // Chamar novamente com prompt simplificado
    // (implementar lógica de retry)
  }
}

module.exports = new AIService();