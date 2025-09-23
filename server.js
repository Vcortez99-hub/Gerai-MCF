const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Directories setup
const directories = [
  './templates',
  './assets',
  './generated',
  './uploads'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || '.html,.htm,.css,.js,.png,.jpg,.jpeg,.svg').split(',');
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido. Extensões aceitas: ${allowedExtensions.join(', ')}`));
    }
  }
});

// Template Management Service
class TemplateService {
  static async listTemplates() {
    try {
      const templatesDir = path.join(__dirname, 'templates');

      if (!await fs.pathExists(templatesDir)) {
        return { success: true, templates: [] };
      }

      const files = await fs.readdir(templatesDir);
      const htmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.html');

      const templates = await Promise.all(
        htmlFiles.map(async (file) => {
          const templatePath = path.join(templatesDir, file);
          const stats = await fs.stat(templatePath);
          const content = await fs.readFile(templatePath, 'utf-8');

          const nameMatch = content.match(/<title>(.*?)<\/title>/i);
          const name = nameMatch ? nameMatch[1] : path.basename(file, '.html');

          return {
            id: path.basename(file, '.html'),
            name,
            file: file,
            size: stats.size,
            modified: stats.mtime,
            preview: content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200) + '...'
          };
        })
      );

      return { success: true, templates };
    } catch (error) {
      throw new Error(`Erro ao listar templates: ${error.message}`);
    }
  }

  static async getTemplatePreview(templateId) {
    try {
      const templatesDir = path.join(__dirname, 'templates');
      const templatePath = path.join(templatesDir, `${templateId}.html`);

      if (await fs.pathExists(templatePath)) {
        const content = await fs.readFile(templatePath, 'utf-8');
        const preview = content
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 200) + '...';

        return { success: true, preview };
      } else {
        throw new Error('Template não encontrado');
      }
    } catch (error) {
      throw new Error(`Erro ao gerar preview: ${error.message}`);
    }
  }
}

// Import Services
const ClaudeAIService = require('./services/ClaudeAIService');
const SupabaseAuthService = require('./services/SupabaseAuthService');

// Initialize services
const authService = new SupabaseAuthService();

// AI service for content generation
class AIContentService {
  constructor() {
    this.claudeService = new ClaudeAIService();
  }

  static async generateContent(briefing, config) {
    const service = new AIContentService();
    return await service.claudeService.generateContent(briefing, config);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'GerAI-MCF Server está funcionando',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// ===== SUPABASE AUTH ROUTES =====

// Get user profile (authenticated route)
app.get('/api/auth/profile', authService.authMiddleware.bind(authService), async (req, res) => {
  try {
    const profile = await authService.getUserProfile(req.user.id);
    const settings = await authService.getUserSettings(req.user.id);

    res.json({
      success: true,
      data: {
        user: req.user,
        profile: profile.data,
        settings: settings.data
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Update user profile (authenticated route)
app.put('/api/auth/profile', authService.authMiddleware.bind(authService), async (req, res) => {
  try {
    const result = await authService.updateUserProfile(req.user.id, req.body);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Update user settings (authenticated route)
app.put('/api/auth/settings', authService.authMiddleware.bind(authService), async (req, res) => {
  try {
    const result = await authService.updateUserSettings(req.user.id, req.body);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Get user presentations (authenticated route)
app.get('/api/presentations', authService.authMiddleware.bind(authService), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await authService.getUserPresentations(req.user.id, page, limit);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Get presentations error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ===== TEMPLATE MANAGEMENT ROUTES =====

// List all templates
app.get('/api/templates', async (req, res) => {
  try {
    const result = await TemplateService.listTemplates();
    res.json(result);
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get template preview
app.get('/api/templates/:id/preview', async (req, res) => {
  try {
    const result = await TemplateService.getTemplatePreview(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Template preview error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Upload template
app.post('/api/templates/upload', upload.single('template'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado'
      });
    }

    const templateName = req.body.name || path.basename(req.file.originalname, path.extname(req.file.originalname));
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);

    await fs.move(req.file.path, templatePath);

    res.json({
      success: true,
      message: 'Template enviado com sucesso',
      data: {
        name: templateName,
        file: `${templateName}.html`,
        path: templatePath
      }
    });
  } catch (error) {
    console.error('Upload template error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload do template'
    });
  }
});

// ===== AI GENERATION ROUTES =====

// Generate presentation
app.post('/api/generate', async (req, res) => {
  try {
    const { templateId, briefing, config = {} } = req.body;

    if (!templateId || !briefing) {
      return res.status(400).json({
        success: false,
        error: 'Template ID e briefing são obrigatórios'
      });
    }

    // Verificar se template existe
    const templatesDir = path.join(__dirname, 'templates');
    const templatePath = path.join(templatesDir, `${templateId}.html`);

    if (!await fs.pathExists(templatePath)) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado'
      });
    }

    // Ler conteúdo do template
    let templateContent = await fs.readFile(templatePath, 'utf-8');

    // Gerar conteúdo com IA
    const aiContent = await AIContentService.generateContent(briefing, {
      slideCount: config.slideCount || 6,
      tone: config.tone || 'profissional',
      includeImages: config.includeImages || false,
      ...config
    });

    if (!aiContent.success) {
      return res.status(500).json({
        success: false,
        error: aiContent.error || 'Erro na geração de conteúdo'
      });
    }

    // Sistema de substituição inteligente baseado no conteúdo da IA
    let modifiedContent = templateContent;

    try {
      console.log('🔄 Iniciando substituição de conteúdo...');
      console.log('📋 Módulos da IA:', Object.keys(aiContent.data.modules || {}));

      // 1. Substituir título principal
      if (aiContent.data.title) {
        modifiedContent = modifiedContent
          .replace(/<title>(.*?)<\/title>/gi, `<title>${aiContent.data.title}</title>`)
          .replace(/\{\{title\}\}/gi, aiContent.data.title)
          .replace(/Título da Apresentação/gi, aiContent.data.title);
      }

      // 2. Substituir placeholders baseados nos módulos da IA
      if (aiContent.data.modules) {
        Object.keys(aiContent.data.modules).forEach(moduleKey => {
          const module = aiContent.data.modules[moduleKey];

          // Capa
          if (moduleKey === 'capa' && module) {
            modifiedContent = modifiedContent
              .replace(/\{\{subtitle\}\}/gi, module.content || module.subtitle || '')
              .replace(/\{\{audience\}\}/gi, config.audience || 'Stakeholders');
          }

          // Agenda
          if (moduleKey === 'agenda' && module) {
            let agendaHtml = '<ul>';
            if (module.bullets && Array.isArray(module.bullets)) {
              module.bullets.forEach(bullet => {
                agendaHtml += `<li>${bullet}</li>`;
              });
            }
            agendaHtml += '</ul>';
            modifiedContent = modifiedContent.replace(/\{\{agenda_content\}\}/gi, agendaHtml);
          }

          // Problema
          if (moduleKey === 'problema' && module) {
            modifiedContent = modifiedContent
              .replace(/\{\{problema_content\}\}/gi, module.content || '')
              .replace(/Descrição do problema.*?baseada no seu briefing\./gi, module.content || '');

            // Substituir bullets se existirem
            if (module.bullets && Array.isArray(module.bullets)) {
              let bulletsHtml = module.bullets.map(bullet => `<li>${bullet}</li>`).join('');
              modifiedContent = modifiedContent.replace(/(<li>Impacto \d+ será gerado pela IA<\/li>\s*){3}/gi, bulletsHtml);
            }
          }

          // Solução
          if (moduleKey === 'solucao' && module) {
            modifiedContent = modifiedContent
              .replace(/\{\{solucao_content\}\}/gi, module.content || '')
              .replace(/Descrição da solução proposta será gerada aqui pela IA\./gi, module.content || '');

            // Substituir bullets se existirem
            if (module.bullets && Array.isArray(module.bullets)) {
              let bulletsHtml = module.bullets.map(bullet => `<li>${bullet}</li>`).join('');
              modifiedContent = modifiedContent.replace(/(<li>Benefício \d+ será gerado pela IA<\/li>\s*){3}/gi, bulletsHtml);
            }
          }

          // Métricas
          if (moduleKey === 'metricas' && module) {
            modifiedContent = modifiedContent
              .replace(/\{\{metricas_content\}\}/gi, module.content || '');

            // Substituir métricas se existirem
            if (module.metrics && Array.isArray(module.metrics)) {
              let metricsHtml = module.metrics.map(metric =>
                `<div class="metric"><h3>${metric.value}</h3><p>${metric.label}</p><small>${metric.description}</small></div>`
              ).join('');
              modifiedContent = modifiedContent.replace(/\{\{metrics_data\}\}/gi, metricsHtml);
            }
          }
        });
      }

      // 3. Substituições textuais massivas e específicas
      const modules = aiContent.data.modules || {};

      // Substituir TODOS os textos genéricos por conteúdo da IA
      const substituicoesCompletas = [
        // Capa e títulos
        { de: 'Subtítulo ou descrição da apresentação será gerada aqui pela IA.', para: modules.capa?.content || modules.capa?.subtitle || 'Solução personalizada para sua empresa' },
        { de: 'Público-alvo', para: config.audience || 'Executivos' },

        // Agenda
        { de: 'Contexto e Objetivos', para: modules.agenda?.bullets?.[0] || 'Visão Geral do Projeto' },
        { de: 'Desafios Identificados', para: modules.agenda?.bullets?.[1] || 'Oportunidades de Melhoria' },
        { de: 'Solução Proposta', para: modules.agenda?.bullets?.[2] || 'Nossa Abordagem' },
        { de: 'Resultados Esperados', para: modules.agenda?.bullets?.[3] || 'Benefícios Esperados' },
        { de: 'Próximos Passos', para: modules.agenda?.bullets?.[4] || 'Plano de Implementação' },

        // Problema
        { de: 'O Desafio', para: modules.problema?.title || 'Cenário Atual' },
        { de: 'Descrição do problema ou desafio será gerada aqui pela IA baseada no seu briefing.', para: modules.problema?.content || 'Análise detalhada do contexto atual e necessidades identificadas.' },
        { de: 'Principais Impactos:', para: 'Impactos Identificados:' },
        { de: 'Impacto 1 será gerado pela IA', para: modules.problema?.bullets?.[0] || 'Redução na eficiência operacional' },
        { de: 'Impacto 2 será gerado pela IA', para: modules.problema?.bullets?.[1] || 'Aumento de custos desnecessários' },
        { de: 'Impacto 3 será gerado pela IA', para: modules.problema?.bullets?.[2] || 'Perda de competitividade' },

        // Solução
        { de: 'Nossa Solução', para: modules.solucao?.title || 'Nossa Proposta' },
        { de: 'Descrição da solução proposta será gerada aqui pela IA.', para: modules.solucao?.content || 'Solução integrada e personalizada para atender suas necessidades específicas.' },
        { de: 'Principais Benefícios:', para: 'Benefícios da Solução:' },
        { de: 'Benefício 1 será detalhado pela IA', para: modules.solucao?.bullets?.[0] || 'Aumento significativo da produtividade' },
        { de: 'Benefício 2 será detalhado pela IA', para: modules.solucao?.bullets?.[1] || 'Redução de custos operacionais' },
        { de: 'Benefício 3 será detalhado pela IA', para: modules.solucao?.bullets?.[2] || 'Melhoria na experiência do usuário' },

        // Métricas
        { de: 'Resultados e Métricas', para: modules.metricas?.title || 'Resultados Esperados' },
        { de: 'Principais indicadores de sucesso e resultados esperados:', para: modules.metricas?.content || 'Métricas de sucesso mensuráveis e tangíveis:' },
        { de: '300%', para: modules.metricas?.metrics?.[0]?.value || '+250%' },
        { de: 'ROI Esperado', para: modules.metricas?.metrics?.[0]?.label || 'Retorno do Investimento' },
        { de: '80%', para: modules.metricas?.metrics?.[1]?.value || '+75%' },
        { de: 'Redução de Tempo', para: modules.metricas?.metrics?.[1]?.label || 'Eficiência Operacional' },
        { de: 'R\\$ 500k', para: modules.metricas?.metrics?.[2]?.value || '+40%' },
        { de: 'Economia Anual', para: modules.metricas?.metrics?.[2]?.label || 'Satisfação dos Usuários' },

        // Conclusão
        { de: 'Próximos Passos e Call to Action', para: modules.conclusao?.title || 'Vamos Começar?' },
        { de: 'Resumo dos próximos passos e como dar continuidade:', para: modules.conclusao?.content || 'Estamos prontos para implementar esta solução e gerar resultados imediatos:' },

        // Substituições genéricas
        { de: 'será gerado pela IA', para: 'foi personalizado para seu contexto' },
        { de: 'será detalhado pela IA', para: 'específico para sua necessidade' },
        { de: 'será gerada aqui pela IA', para: 'baseado no seu briefing' },
        { de: 'será gerada pela IA', para: 'personalizado para você' }
      ];

      // Aplicar todas as substituições
      substituicoesCompletas.forEach(sub => {
        const regex = new RegExp(sub.de, 'gi');
        modifiedContent = modifiedContent.replace(regex, sub.para);
      });

      // 4. Substituições de força bruta para textos restantes
      const textosForcaBruta = [
        'Lorem ipsum', 'dolor sit amet', 'consectetur adipiscing',
        'Template padrão', 'Exemplo de conteúdo', 'Texto de exemplo',
        'Adicione seu conteúdo aqui', 'Conteúdo será adicionado',
        'Sample text', 'Your content here', 'Click to edit'
      ];

      textosForcaBruta.forEach(texto => {
        const regex = new RegExp(texto, 'gi');
        modifiedContent = modifiedContent.replace(regex, 'Conteúdo personalizado');
      });

      // 5. SISTEMA UNIVERSAL - Para templates que não seguem o padrão
      // Substituir qualquer texto que pareça genérico por conteúdo específico

      // Extrair conteúdo principal da IA para substituições universais
      const mainContent = aiContent.data.modules?.problema?.content ||
                         aiContent.data.modules?.solucao?.content ||
                         briefing.substring(0, 200);

      const beneficios = aiContent.data.modules?.solucao?.bullets ||
                        aiContent.data.modules?.metricas?.metrics?.map(m => m.label) ||
                        ['Maior eficiência', 'Redução de custos', 'Melhores resultados'];

      // Substituições universais por padrões comuns
      const substituicoesUniversais = [
        // Títulos e headers comuns
        { de: 'Treinamento Modern Contact Center', para: aiContent.data.title || 'Apresentação Estratégica' },
        { de: 'Contact Center', para: config.company || 'Sua Empresa' },
        { de: 'Treinamento', para: 'Estratégia' },
        { de: 'Modern', para: 'Inteligente' },

        // Textos de introdução comuns
        { de: 'apresentação sobre.*?contact center', para: `estratégia para ${config.company || 'sua empresa'}` },
        { de: 'metodologia.*?atendimento', para: 'abordagem personalizada' },
        { de: 'processo.*?contact center', para: 'solução integrada' },

        // Substituir qualquer referência a contact center por conteúdo específico
        { de: 'contact center', para: 'nossa solução' },
        { de: 'atendimento ao cliente', para: mainContent.substring(0, 50) },
        { de: 'operações de atendimento', para: 'operações otimizadas' },

        // Textos genéricos comuns em templates
        { de: 'Metodologia comprovada', para: 'Estratégia personalizada' },
        { de: 'Resultados garantidos', para: 'Resultados mensuráveis' },
        { de: 'Experiência diferenciada', para: 'Abordagem inovadora' },
        { de: 'Qualidade superior', para: 'Excelência operacional' },

        // Substituir listas genéricas por benefícios específicos
        { de: 'Melhoria na qualidade', para: beneficios[0] || 'Eficiência operacional' },
        { de: 'Redução de custos', para: beneficios[1] || 'Otimização de recursos' },
        { de: 'Aumento da produtividade', para: beneficios[2] || 'Resultados superiores' }
      ];

      // Aplicar substituições universais
      substituicoesUniversais.forEach(sub => {
        const regex = new RegExp(sub.de, 'gi');
        modifiedContent = modifiedContent.replace(regex, sub.para);
      });

      // 6. FORÇA BRUTA FINAL - Substituir palavras-chave por conteúdo específico
      // Isso garante que mesmo templates complexos tenham conteúdo personalizado
      const palavrasChave = {
        'cliente': config.audience || 'stakeholder',
        'empresa': config.company || 'organização',
        'solução': 'estratégia personalizada',
        'produto': 'proposta',
        'serviço': 'abordagem',
        'metodologia': 'estratégia',
        'framework': 'modelo',
        'processo': 'fluxo otimizado'
      };

      Object.keys(palavrasChave).forEach(palavra => {
        // Só substitui se a palavra aparece em contexto genérico
        const regexGenerico = new RegExp(`\\b${palavra}\\s+(padrão|genérico|exemplo|modelo)\\b`, 'gi');
        modifiedContent = modifiedContent.replace(regexGenerico, `${palavrasChave[palavra]} específico`);
      });

      console.log('✅ Substituição completa finalizada!');
      console.log('🔧 Substituições universais aplicadas para compatibilidade total!');

      // Gerar arquivo final
      const timestamp = Date.now();
      const fileName = `apresentacao_${templateId}_${timestamp}.html`;
      const outputPath = path.join(__dirname, 'generated', fileName);

      await fs.writeFile(outputPath, modifiedContent, 'utf-8');

      // Salvar dados no banco se usuário autenticado
      let presentationId = null;
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.substring(7);
          const { data: user } = await authService.supabase.auth.getUser(token);

          if (user.user) {
            const result = await authService.createPresentation(user.user.id, {
              title: aiContent.data.title || 'Apresentação Sem Título',
              briefing,
              ai_content: aiContent.data,
              config,
              file_path: fileName,
              template_id: templateId
            });

            if (result.success) {
              presentationId = result.data.id;
            }
          }
        } catch (authError) {
          console.log('Usuário não autenticado, mas gerando apresentação...');
        }
      }

      res.json({
        success: true,
        message: 'Apresentação gerada com sucesso',
        data: {
          fileName,
          downloadUrl: `/generated/${fileName}`,
          presentationId,
          title: aiContent.data.title,
          generatedAt: new Date().toISOString(),
          aiContent: aiContent.data
        }
      });

    } catch (contentError) {
      console.error('Erro na substituição de conteúdo:', contentError);

      // Fallback: Retornar template original com aviso
      const timestamp = Date.now();
      const fileName = `apresentacao_${templateId}_${timestamp}.html`;
      const outputPath = path.join(__dirname, 'generated', fileName);

      await fs.writeFile(outputPath, templateContent, 'utf-8');

      res.json({
        success: true,
        message: 'Apresentação gerada (template original)',
        warning: 'Não foi possível aplicar o conteúdo da IA completamente',
        data: {
          fileName,
          downloadUrl: `/generated/${fileName}`,
          title: 'Apresentação Gerada',
          generatedAt: new Date().toISOString(),
          aiContent: aiContent.data
        }
      });
    }

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro na geração da apresentação'
    });
  }
});

// ===== TEST ROUTES =====

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await authService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve generated files
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Serve template files for preview
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GerAI-MCF Custom Templates Server rodando em http://localhost:${PORT}`);
  console.log(`📁 Diretórios criados: ${directories.join(' ')}`);
  console.log(`🎨 Modo: Templates Profissionais Customizados Apenas`);
  console.log(`🤖 IA: Claude ${process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'}`);
  console.log(`🔐 Autenticação: Supabase Auth nativo`);
  console.log(`✅ Pronto para receber seus templates HTML!`);
});

module.exports = app;