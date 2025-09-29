const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3029;

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
const ModernPresentationGenerator = require('./src/scripts/modern-generator');

// Import Middleware
const { authenticateUser, optionalAuth } = require('./middleware/auth');

// Initialize services
const authService = new SupabaseAuthService();

// Função para gerar conteúdo estruturado diretamente
function generateDirectStructuredContent(briefing, config) {
  const slideCount = config.slideCount || 6;
  const company = config.company || 'Darede';
  const audience = config.audience || 'Executivos';

  // Analisar briefing para detectar tipo de apresentação
  const isAboutIA = briefing.toLowerCase().includes('ia') || briefing.toLowerCase().includes('inteligência artificial');
  const isAboutData = briefing.toLowerCase().includes('dados') || briefing.toLowerCase().includes('analytics');
  const isCommercial = briefing.toLowerCase().includes('vendas') || briefing.toLowerCase().includes('comercial');

  // Extrair título principal
  const lines = briefing.split('\n').filter(l => l.trim());
  const mainTitle = lines[0] || 'Apresentação Corporativa';

  // Gerar slides estruturados
  const slides = [];

  // Slide 1: Título (sempre)
  slides.push({
    slideNumber: 1,
    type: 'title-hero',
    title: isAboutIA ?
      `Transformação Digital com <span class="text-gradient">Inteligência Artificial</span>` :
      isAboutData ?
      `Potencialize seus <span class="text-gradient">Dados</span>` :
      `${mainTitle}`,
    subtitle: isAboutIA ?
      'Revolucionando operações empresariais com tecnologia de ponta' :
      isAboutData ?
      'Transforme dados em insights estratégicos' :
      'Soluções inovadoras para seu negócio',
    elements: {
      icon: isAboutIA ? 'fas fa-brain' : isAboutData ? 'fas fa-chart-line' : 'fas fa-rocket'
    }
  });

  // Slide 2: Pilares/Benefícios
  if (isAboutIA) {
    slides.push({
      slideNumber: 2,
      type: 'content-highlight',
      title: 'Nossos <span class="text-gradient">Pilares Tecnológicos</span>',
      subtitle: 'Fundamentos que sustentam nossa excelência em IA',
      elements: {
        icon: 'fas fa-cogs',
        highlights: [
          'Inteligência Artificial Avançada com Machine Learning',
          'Cloud Computing Seguro e Escalável',
          'Automação Inteligente de Processos',
          'Análise Preditiva em Tempo Real'
        ]
      }
    });
  } else if (isAboutData) {
    slides.push({
      slideNumber: 2,
      type: 'content-highlight',
      title: 'Transformação através dos <span class="text-gradient">Dados</span>',
      subtitle: 'Como seus dados podem revolucionar seu negócio',
      elements: {
        icon: 'fas fa-database',
        highlights: [
          'Coleta e Integração de Dados Multicanal',
          'Analytics Avançados e Business Intelligence',
          'Visualização Intuitiva de Insights',
          'Tomada de Decisão Baseada em Dados'
        ]
      }
    });
  } else {
    slides.push({
      slideNumber: 2,
      type: 'content-highlight',
      title: 'Por que Escolher a <span class="text-gradient">Darede</span>?',
      subtitle: 'Diferenciais que nos tornam únicos no mercado',
      elements: {
        icon: 'fas fa-star',
        highlights: [
          'Expertise em Tecnologia de Ponta',
          'Soluções Personalizadas para Cada Cliente',
          'Suporte 24/7 e Acompanhamento Contínuo',
          'ROI Comprovado e Resultados Mensuráveis'
        ]
      }
    });
  }

  // Slide 3: Estatísticas (sempre)
  slides.push({
    slideNumber: 3,
    type: 'stats-grid',
    title: 'Resultados que <span class="text-gradient">Comprovam</span> nossa Eficiência',
    subtitle: 'Números que demonstram o impacto de nossas soluções',
    elements: {
      stats: [
        {
          value: '150%',
          label: 'Aumento de Produtividade',
          description: 'Melhoria média em processos automatizados',
          icon: 'fas fa-rocket'
        },
        {
          value: '35%',
          label: 'Redução de Custos',
          description: 'Economia operacional comprovada',
          icon: 'fas fa-chart-line'
        },
        {
          value: '98%',
          label: 'Satisfação dos Clientes',
          description: 'Taxa de aprovação de nossos projetos',
          icon: 'fas fa-star'
        },
        {
          value: '24/7',
          label: 'Suporte Contínuo',
          description: 'Disponibilidade total para nossos clientes',
          icon: 'fas fa-headset'
        }
      ]
    }
  });

  // Slide 4: Processo/Metodologia
  slides.push({
    slideNumber: 4,
    type: 'timeline-horizontal',
    title: 'Nossa <span class="text-gradient">Metodologia</span> Comprovada',
    subtitle: 'Como entregamos resultados em 4 fases estratégicas',
    elements: {
      process: [
        {
          title: 'Diagnóstico',
          description: 'Análise completa da situação atual',
          icon: 'fas fa-search'
        },
        {
          title: 'Planejamento',
          description: 'Estratégia personalizada e roadmap',
          icon: 'fas fa-tasks'
        },
        {
          title: 'Implementação',
          description: 'Execução com acompanhamento rigoroso',
          icon: 'fas fa-cogs'
        },
        {
          title: 'Otimização',
          description: 'Melhorias contínuas e suporte',
          icon: 'fas fa-chart-line'
        }
      ]
    }
  });

  // Slides adicionais conforme necessário
  if (slideCount >= 5) {
    slides.push({
      slideNumber: 5,
      type: 'vs-split',
      title: 'Transformação <span class="text-gradient">Antes vs Depois</span>',
      subtitle: 'O impacto real de nossas soluções',
      elements: {
        comparison: {
          left: {
            title: 'Situação Atual',
            items: [
              'Processos manuais demorados',
              'Dados dispersos e desorganizados',
              'Tomada de decisão lenta',
              'Altos custos operacionais'
            ]
          },
          right: {
            title: 'Com a Darede',
            items: [
              'Automação inteligente completa',
              'Dados integrados e analytics',
              'Decisões rápidas baseadas em IA',
              'Redução significativa de custos'
            ]
          }
        }
      }
    });
  }

  if (slideCount >= 6) {
    slides.push({
      slideNumber: 6,
      type: 'content-standard',
      title: 'Próximos <span class="text-gradient">Passos</span>',
      content: `Pronto para transformar seu negócio?\n\n• Agende uma consultoria gratuita\n• Receba um diagnóstico personalizado\n• Conheça nossas soluções em detalhes\n\nContato: contato@darede.com.br\nTelefone: (11) 9999-9999`,
      elements: {
        icon: 'fas fa-handshake'
      }
    });
  }

  return {
    title: slides[0].title.replace(/<[^>]*>/g, ''), // Remover HTML para o título principal
    subtitle: slides[0].subtitle,
    totalSlides: slides.length,
    slides: slides.slice(0, slideCount), // Limitar ao número solicitado
    format: 'structured'
  };
}

// AI service for content generation
class AIContentService {
  constructor() {
    // Forçar uso do OpenAI sempre
    this.aiService = new OpenAIService();
  }

  static async generateContent(briefing, config) {
    const service = new AIContentService();

    // Usar prompt moderno se format = 'structured'
    if (config.format === 'structured') {
      return await service.generateStructuredContent(briefing, config);
    }

    return await service.aiService.generateContent(briefing, config);
  }

  async generateStructuredContent(briefing, config) {
    try {
      // Carregar prompt moderno
      const modernPrompt = fs.readFileSync(
        path.join(__dirname, 'prompts', 'modern-presentation-prompt.md'),
        'utf8'
      );

      // Criar prompt específico
      const fullPrompt = `${modernPrompt}

---

## BRIEFING DO CLIENTE:
${briefing}

---

## CONFIGURAÇÕES:
- Quantidade de slides: ${config.slideCount || 6}
- Público-alvo: ${config.audience || 'Executivos'}
- Empresa: ${config.company || 'Darede'}
- Setor: Tecnologia/IA

## INSTRUÇÕES FINAIS:
Gere o JSON seguindo EXATAMENTE a estrutura especificada no prompt.
Varie os tipos de slides para criar uma apresentação visualmente interessante.
Foque em resultados, benefícios e diferenciação competitiva.
Use linguagem executiva apropriada.

Responda APENAS com o JSON válido:`;

      // Chamar IA com prompt estruturado
      const response = await this.aiService.generateContent(fullPrompt, {
        ...config,
        maxTokens: 3000, // Aumentar limite para resposta estruturada
        temperature: 0.7 // Criatividade moderada
      });

      if (!response.success) {
        return response;
      }

      // Tentar parsear JSON da resposta
      try {
        let jsonContent = response.data.content || response.data;

        // Limpar resposta se necessário
        if (typeof jsonContent === 'string') {
          // Remover markdown ou texto extra
          jsonContent = jsonContent.replace(/```json\n?|\n?```/g, '');
          jsonContent = jsonContent.trim();

          // Encontrar JSON válido
          const jsonStart = jsonContent.indexOf('{');
          const jsonEnd = jsonContent.lastIndexOf('}') + 1;
          if (jsonStart >= 0 && jsonEnd > jsonStart) {
            jsonContent = jsonContent.substring(jsonStart, jsonEnd);
          }
        }

        const parsedContent = JSON.parse(jsonContent);

        return {
          success: true,
          data: {
            title: parsedContent.title,
            subtitle: parsedContent.subtitle,
            slides: parsedContent.slides || [],
            totalSlides: parsedContent.totalSlides || parsedContent.slides?.length || 0,
            format: 'structured'
          }
        };

      } catch (parseError) {
        console.error('Erro ao parsear JSON da IA:', parseError);
        console.log('Resposta recebida:', response.data);

        // Fallback: usar conteúdo original
        return {
          success: true,
          data: {
            title: 'Apresentação Gerada',
            content: response.data.content || briefing,
            slides: [
              {
                slideNumber: 1,
                type: 'title-hero',
                title: 'Apresentação Gerada',
                content: briefing.split('\n')[0] || 'Apresentação',
                elements: { icon: 'fas fa-presentation' }
              }
            ],
            format: 'fallback'
          }
        };
      }

    } catch (error) {
      console.error('Erro na geração estruturada:', error);
      return {
        success: false,
        error: error.message
      };
    }
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

// Nova rota moderna para geração inteligente
app.post('/api/generate-modern', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      briefing,
      config = {},
      slideTopics = []
    } = req.body;

    // Validação
    if (!briefing) {
      return res.status(400).json({
        success: false,
        error: 'Briefing é obrigatório'
      });
    }

    console.log(`🚀 Geração Moderna iniciada`);
    console.log(`📝 Briefing: ${briefing.substring(0, 100)}...`);

    // 1. Usar AIContentService original com formato estruturado
    const aiContent = await AIContentService.generateContent(briefing, {
      ...config,
      format: 'structured'
    });

    if (!aiContent.success) {
      return res.status(500).json({
        success: false,
        error: aiContent.error || 'Erro na geração de conteúdo da IA'
      });
    }

    console.log(`✅ Conteúdo AI estruturado gerado`);
    console.log('📊 Debug - aiContent.data:', JSON.stringify(aiContent.data, null, 2));

    // 2. Usar novo gerador moderno
    const modernGenerator = new ModernPresentationGenerator();

    // Converter conteúdo AI em slides estruturados
    const slides = [];
    if (aiContent.data.slides && Array.isArray(aiContent.data.slides)) {
      aiContent.data.slides.forEach(slide => {
        slides.push({
          content: slide.content || slide.title || '',
          title: slide.title || '',
          type: slide.type || 'content'
        });
      });
    } else {
      // Fallback: usar conteúdo direto
      const lines = briefing.split('\n').filter(line => line.trim());
      lines.forEach((line, index) => {
        slides.push({
          content: line,
          title: `Slide ${index + 1}`,
          type: index === 0 ? 'title' : 'content'
        });
      });
    }

    console.log('📋 Debug - slides processados:', JSON.stringify(slides, null, 2));

    // 3. Gerar apresentação com sistema moderno
    const presentationHtml = modernGenerator.generatePresentation(slides);

    // 4. Salvar arquivo
    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${presentationId}.html`;
    const filePath = path.join(process.env.GENERATED_DIR || './generated', fileName);

    await fs.writeFile(filePath, presentationHtml, 'utf8');

    console.log(`📄 Apresentação moderna salva: ${fileName}`);

    // 5. Salvar no histórico
    let historyId = null;
    if (req.userId) {
      try {
        const generationTime = Date.now() - startTime;
        const historyEntry = await PresentationHistoryService.savePresentation(req.userId, {
          title: aiContent.data.title || 'Apresentação Moderna',
          briefing,
          templateId: 'modern-generator',
          templateName: 'Gerador Moderno',
          config,
          aiContent: aiContent.data,
          generatedFilePath: filePath,
          generatedFileUrl: `/generated/${fileName}`,
          generationTimeMs: generationTime
        });
        historyId = historyEntry.id;
      } catch (historyError) {
        console.error('Erro ao salvar no histórico:', historyError);
      }
    }

    // 6. Resposta
    res.json({
      success: true,
      message: 'Apresentação moderna gerada com sucesso!',
      data: {
        fileName,
        downloadUrl: `/generated/${fileName}`,
        presentationId,
        historyId,
        title: aiContent.data.title || 'Apresentação Moderna',
        generatedAt: new Date().toISOString(),
        slides: slides.length,
        features: [
          'Glassmorphism effects',
          'Animações cinematográficas',
          'Layouts inteligentes',
          'Design responsivo',
          'Navegação avançada'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erro na geração moderna:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno na geração moderna'
    });
  }
});

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