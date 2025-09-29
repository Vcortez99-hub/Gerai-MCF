const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3011;

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
const OpenAIService = require('./services/OpenAIService');
const SupabaseAuthService = require('./services/SupabaseAuthService');
const PresentationHistoryService = require('./services/PresentationHistoryService');
const PresentationService = require('./services/PresentationService');

// Import Middleware
const { authenticateUser, optionalAuth } = require('./middleware/auth');

// Initialize services
const authService = new SupabaseAuthService();

// AI service for content generation
class AIContentService {
  constructor() {
    // Forçar uso do OpenAI sempre
    this.aiService = new OpenAIService();
  }

  static async generateContent(briefing, config) {
    const service = new AIContentService();
    return await service.aiService.generateContent(briefing, config);
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
app.post('/api/generate', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      templateId,
      briefing,
      config = {},
      slideTopics = [],
      attachments = [],
      logoUrls = []
    } = req.body;

    // Validação de entrada
    if (!briefing) {
      return res.status(400).json({
        success: false,
        error: 'Briefing é obrigatório'
      });
    }

    // Use templateId padrão se não fornecido (para compatibilidade)
    const finalTemplateId = templateId || 'ai-generated-template';

    console.log(`🚀 Iniciando geração de apresentação: ${finalTemplateId}`);
    console.log(`📝 Briefing: ${briefing.substring(0, 100)}...`);
    console.log(`🎯 Tópicos por slide: ${slideTopics.length} configurados`);
    console.log(`📎 Anexos: ${attachments.length} arquivos`);
    console.log(`🏢 Logos: ${logoUrls.length} URLs`);

    // Enriquecer briefing com informações adicionais
    let enhancedBriefing = briefing;

    // Adicionar tópicos dos slides ao briefing
    if (slideTopics && slideTopics.length > 0) {
      enhancedBriefing += '\n\n=== ESTRUTURA DESEJADA DOS SLIDES ===\n';
      slideTopics.forEach(topic => {
        enhancedBriefing += `Slide ${topic.slideNumber}: ${topic.topic}\n`;
      });
    }

    // Adicionar informações sobre anexos
    if (attachments && attachments.length > 0) {
      enhancedBriefing += '\n\n=== ANEXOS DISPONÍVEIS ===\n';
      attachments.forEach(attachment => {
        enhancedBriefing += `- ${attachment.name} (${attachment.type})\n`;
      });
      enhancedBriefing += 'Nota: Considere estes arquivos ao gerar conteúdo relevante.\n';
    }

    // Adicionar URLs de logos
    if (logoUrls && logoUrls.length > 0) {
      enhancedBriefing += '\n\n=== LOGOS PARA INCLUIR ===\n';
      logoUrls.forEach((url, index) => {
        enhancedBriefing += `Logo ${index + 1}: ${url}\n`;
      });
      enhancedBriefing += 'Nota: Incluir estes logos na apresentação como parceiros/clientes.\n';
    }

    // 1. Gerar conteúdo com IA (agora gera HTML completo)
    const aiContent = await AIContentService.generateContent(enhancedBriefing, {
      slideCount: config.slideCount || 6,
      audience: config.audience || 'Executivos',
      includeImages: config.includeImages || false,
      company: config.company || '',
      aiPrompt: enhancedBriefing,
      slideTopics,
      attachments,
      logoUrls,
      ...config
    });

    if (!aiContent.success) {
      return res.status(500).json({
        success: false,
        error: aiContent.error || 'Erro na geração de conteúdo da IA'
      });
    }

    console.log(`✅ Conteúdo AI gerado: ${aiContent.data.title || 'Apresentação'}`);

    // 2. Usar PresentationService para processar (agora suporta HTML completo)
    const presentation = await PresentationService.generatePresentation(
      finalTemplateId,
      {
        ...config,
        aiPrompt: briefing
      },
      aiContent.data
    );

    console.log(`📄 Apresentação processada: ${presentation.path}`);

    // 3. Salvar no histórico se usuário autenticado
    let historyId = null;
    if (req.userId) {
      try {
        const generationTime = Date.now() - startTime;
        const templateName = templateId.replace(/_\d+$/, ''); // Limpar nome do template

        const historyEntry = await PresentationHistoryService.savePresentation(req.userId, {
          title: presentation.title || 'Apresentação Gerada',
          briefing,
          templateId,
          templateName,
          config,
          aiContent: aiContent.data,
          generatedFilePath: presentation.path,
          generatedFileUrl: presentation.url,
          generationTimeMs: generationTime
        });

        historyId = historyEntry.id;
        console.log(`💾 Apresentação salva no histórico: ${historyId}`);
      } catch (historyError) {
        console.error('Erro ao salvar no histórico:', historyError);
        // Não falha a geração se houver erro no histórico
      }
    }

    // 4. Retornar resposta de sucesso
    const fileName = path.basename(presentation.path);
    res.json({
      success: true,
      message: 'Apresentação gerada com sucesso',
      data: {
        fileName,
        downloadUrl: presentation.url,
        presentationId: presentation.id,
        historyId,
        title: presentation.title,
        generatedAt: new Date().toISOString(),
        aiContent: aiContent.data
      }
    });

  } catch (error) {
    console.error('❌ Erro na geração:', error);

    // Salvar erro no histórico se usuário autenticado
    if (req.userId) {
      try {
        await PresentationHistoryService.markAsFailed(req.userId, {
          title: 'Erro na Geração',
          briefing: req.body.briefing || '',
          templateId: req.body.templateId || '',
          templateName: req.body.templateId || '',
          config: req.body.config || {}
        }, error.message);
      } catch (historyError) {
        console.error('Erro ao salvar erro no histórico:', historyError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Erro na geração da apresentação',
      details: error.message
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

// ===== PRESENTATION HISTORY ROUTES =====

// Get user's presentation history
app.get('/api/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', status, search } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50), // Max 50 per page
      sortBy,
      sortOrder,
      status,
      search
    };

    const result = await PresentationHistoryService.getUserHistory(req.userId, options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico'
    });
  }
});

// Get specific presentation by ID
app.get('/api/history/:id', authenticateUser, async (req, res) => {
  try {
    const presentation = await PresentationHistoryService.getPresentation(req.userId, req.params.id);

    if (!presentation) {
      return res.status(404).json({
        success: false,
        error: 'Apresentação não encontrada'
      });
    }

    res.json({
      success: true,
      data: presentation
    });
  } catch (error) {
    console.error('Get presentation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar apresentação'
    });
  }
});

// Update presentation (title only for now)
app.patch('/api/history/:id', authenticateUser, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Título é obrigatório'
      });
    }

    const presentation = await PresentationHistoryService.updatePresentation(
      req.userId,
      req.params.id,
      { title: title.trim() }
    );

    res.json({
      success: true,
      data: presentation
    });
  } catch (error) {
    console.error('Update presentation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar apresentação'
    });
  }
});

// Delete presentation
app.delete('/api/history/:id', authenticateUser, async (req, res) => {
  try {
    await PresentationHistoryService.deletePresentation(req.userId, req.params.id);

    res.json({
      success: true,
      message: 'Apresentação deletada com sucesso'
    });
  } catch (error) {
    console.error('Delete presentation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar apresentação'
    });
  }
});

// Get user statistics
app.get('/api/history/stats/user', authenticateUser, async (req, res) => {
  try {
    const stats = await PresentationHistoryService.getUserStats(req.userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
});

// Get recent presentations
app.get('/api/history/recent/:limit?', authenticateUser, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.params.limit) || 5, 10);
    const recent = await PresentationHistoryService.getRecentPresentations(req.userId, limit);

    res.json({
      success: true,
      data: recent
    });
  } catch (error) {
    console.error('Get recent presentations error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar apresentações recentes'
    });
  }
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
  console.log(`🤖 IA: OpenAI ${process.env.OPENAI_MODEL || 'gpt-4o'} (Máxima Capacidade)`);
  console.log(`🔐 Autenticação: Supabase Auth nativo`);
  console.log(`✅ Pronto para receber seus templates HTML!`);
});

module.exports = app;