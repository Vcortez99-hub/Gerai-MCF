const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.html', '.htm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos HTML são permitidos'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Ensure directories exist
async function ensureDirectories() {
  const dirs = ['templates', 'assets', 'generated', 'uploads'];
  for (const dir of dirs) {
    await fs.ensureDir(path.join(__dirname, dir));
  }
}

// Template service for custom templates only
class CustomTemplateService {
  static async listTemplates() {
    const templates = [];
    const templatesDir = path.join(__dirname, 'templates');
    await fs.ensureDir(templatesDir);

    const files = await fs.readdir(templatesDir);

    for (const file of files) {
      if (file.endsWith('.html') || file.endsWith('.htm')) {
        const filePath = path.join(templatesDir, file);
        const stats = await fs.stat(filePath);
        const templateId = path.parse(file).name;

        // Extract metadata from HTML
        const content = await fs.readFile(filePath, 'utf-8');
        const nameMatch = content.match(/<meta name="template-name" content="([^"]*)">/);
        const descMatch = content.match(/<meta name="description" content="([^"]*)">/);
        const categoryMatch = content.match(/<meta name="category" content="([^"]*)">/);
        const thumbnailMatch = content.match(/<meta name="thumbnail" content="([^"]*)">/);

        // Extract module placeholders
        const moduleMatches = content.match(/data-module="([^"]*)"/g) || [];
        const modules = moduleMatches.map(match => {
          const moduleMatch = match.match(/data-module="([^"]*)"/);
          return moduleMatch ? moduleMatch[1] : null;
        }).filter(Boolean);

        templates.push({
          id: templateId,
          name: nameMatch ? nameMatch[1] : `Template ${templateId}`,
          description: descMatch ? descMatch[1] : 'Template profissional customizado',
          category: categoryMatch ? categoryMatch[1] : 'profissional',
          modules: [...new Set(modules)],
          thumbnail: thumbnailMatch ? thumbnailMatch[1] : null,
          createdAt: stats.ctime.toISOString(),
          size: this.formatFileSize(stats.size),
          isCustom: true,
          filePath: filePath
        });
      }
    }

    return templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static async processUploadedTemplate(file) {
    try {
      const uploadPath = file.path;
      const templateId = path.parse(file.originalname).name + '_' + Date.now();
      const templatePath = path.join(__dirname, 'templates', `${templateId}.html`);

      let content = await fs.readFile(uploadPath, 'utf-8');

      // Add metadata if not present
      if (!content.includes('<meta name="template-name"')) {
        const titleMatch = content.match(/<title>([^<]*)<\/title>/);
        const templateName = titleMatch ? titleMatch[1] : path.parse(file.originalname).name;

        const metaTags = `
    <meta name="template-name" content="${templateName}">
    <meta name="description" content="Template profissional customizado">
    <meta name="category" content="profissional">
    <meta name="upload-date" content="${new Date().toISOString()}">`;

        content = content.replace(/<head>/, `<head>${metaTags}`);
      }

      // Add AI placeholders to make template compatible
      content = this.addAIPlaceholders(content);

      await fs.writeFile(templatePath, content);
      await fs.remove(uploadPath);

      return {
        id: templateId,
        name: path.parse(file.originalname).name,
        path: templatePath,
        success: true
      };
    } catch (error) {
      throw new Error(`Erro ao processar template: ${error.message}`);
    }
  }

  static addAIPlaceholders(content) {
    let processedContent = content;

    // Add AI replacement markers to headings (preserving original for fallback)
    processedContent = processedContent.replace(
      /<h([1-6])([^>]*)>([^<]*)<\/h[1-6]>/g,
      (match, level, attrs, text) => {
        if (!attrs.includes('data-ai-role')) {
          return `<h${level}${attrs} data-ai-role="title" data-original-content="${text.replace(/"/g, '&quot;')}">${text}</h${level}>`;
        }
        return match;
      }
    );

    // Add AI replacement markers to paragraphs
    processedContent = processedContent.replace(
      /<p([^>]*)>([^<]*)<\/p>/g,
      (match, attrs, text) => {
        if (!attrs.includes('data-ai-role') && text.trim().length > 10) {
          return `<p${attrs} data-ai-role="content" data-original-content="${text.replace(/"/g, '&quot;')}">${text}</p>`;
        }
        return match;
      }
    );

    // Add AI replacement markers to div content
    processedContent = processedContent.replace(
      /<div([^>]*class="[^"]*content[^"]*"[^>]*)>([\s\S]*?)<\/div>/gi,
      (match, attrs, content) => {
        if (!attrs.includes('data-ai-role')) {
          return `<div${attrs} data-ai-role="section-content">${content}</div>`;
        }
        return match;
      }
    );

    return processedContent;
  }

  static async deleteTemplate(templateId) {
    try {
      const templatesDir = path.join(__dirname, 'templates');
      const templatePath = path.join(templatesDir, `${templateId}.html`);

      if (await fs.pathExists(templatePath)) {
        await fs.remove(templatePath);
        return { success: true, message: 'Template removido com sucesso' };
      } else {
        throw new Error('Template não encontrado');
      }
    } catch (error) {
      throw new Error(`Erro ao remover template: ${error.message}`);
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
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-custom'
  });
});

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await CustomTemplateService.listTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/upload-template', upload.single('template'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
    }

    const result = await CustomTemplateService.processUploadedTemplate(req.file);
    res.json({
      success: true,
      message: 'Template enviado com sucesso!',
      template: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await CustomTemplateService.deleteTemplate(templateId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/templates/:templateId/preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const result = await CustomTemplateService.getTemplatePreview(templateId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/prompts', async (req, res) => {
  try {
    const prompts = await ClaudeAIService.listAvailablePrompts();
    res.json({ success: true, prompts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================
// AUTHENTICATION ROUTES
// ==========================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Verify JWT token
app.get('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const result = await authService.verifyToken(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Confirm email
app.get('/confirm-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(`
        <html>
          <head><title>Erro - GerAI-MCF</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #EF4444;">❌ Token inválido</h1>
            <p>O link de confirmação é inválido ou está corrompido.</p>
            <a href="/login.html" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir para Login</a>
          </body>
        </html>
      `);
    }

    const result = await authService.confirmEmail(token);

    if (result.success) {
      res.send(`
        <html>
          <head>
            <title>Email Confirmado - GerAI-MCF</title>
            <meta http-equiv="refresh" content="3;url=/login.html">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h1 style="color: #10B981;">✅ Email Confirmado!</h1>
            <p>Sua conta foi ativada com sucesso.</p>
            <p>Você será redirecionado para a página de login em 3 segundos...</p>
            <a href="/login.html" style="background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; display: inline-block; margin-top: 20px;">Fazer Login</a>
          </body>
        </html>
      `);
    } else {
      res.status(400).send(`
        <html>
          <head><title>Erro - GerAI-MCF</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #EF4444;">❌ Erro na Confirmação</h1>
            <p>${result.error}</p>
            <a href="/register.html" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Fazer Novo Cadastro</a>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).send(`
      <html>
        <head><title>Erro - GerAI-MCF</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #EF4444;">❌ Erro Interno</h1>
          <p>Ocorreu um erro interno. Tente novamente mais tarde.</p>
          <a href="/login.html" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir para Login</a>
        </body>
      </html>
    `);
  }
});

// Resend confirmation email
app.post('/api/auth/resend-confirmation', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    const result = await authService.resendConfirmationEmail(email);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Resend confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Change password (authenticated route)
app.post('/api/auth/change-password', authService.authenticateToken.bind(authService), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Senha atual e nova senha são obrigatórias'
      });
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Get user profile (authenticated route)
app.get('/api/auth/profile', authService.authenticateToken.bind(authService), async (req, res) => {
  try {
    const userStats = await supabaseService.getUserStats(req.user.id);

    res.json({
      success: true,
      data: {
        user: req.user,
        stats: userStats.data || {}
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
app.put('/api/auth/profile', authService.authenticateToken.bind(authService), async (req, res) => {
  try {
    const { name, company } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (company) updateData.company = company.trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    updateData.updated_at = new Date().toISOString();

    const result = await supabaseService.updateUser(req.user.id, updateData);

    if (result.success) {
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: result.data
      });
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

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await supabaseService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email connection
app.get('/api/test-email', async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check Supabase configuration
app.get('/api/debug/supabase', (req, res) => {
  res.json({
    success: true,
    config: {
      supabaseUrl: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?
        `Configurado (${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...)` :
        'Não configurado',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'Não configurado',
      databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
    }
  });
});

app.post('/api/generate-presentation', async (req, res) => {
  try {
    const { templateId, config, aiPrompt } = req.body;

    if (!aiPrompt) {
      return res.status(400).json({
        success: false,
        error: 'aiPrompt é obrigatório'
      });
    }

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template é obrigatório. Envie um template HTML personalizado primeiro.'
      });
    }

    const templatePath = path.join(__dirname, 'templates', `${templateId}.html`);
    if (!(await fs.pathExists(templatePath))) {
      return res.status(404).json({
        success: false,
        error: 'Template não encontrado. Verifique se o template foi enviado corretamente.'
      });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🤖 Iniciando geração de conteúdo IA com briefing:', aiPrompt.substring(0, 100));
    const aiContent = await AIContentService.generateContent(aiPrompt, config);
    console.log('✅ Conteúdo IA gerado:', {
      title: aiContent.title,
      modules: Object.keys(aiContent.modules),
      provider: aiContent.provider
    });
    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    // Advanced content replacement system
    console.log('🔄 Iniciando substituição de conteúdo IA...', {
      templateId,
      aiContentModules: Object.keys(aiContent.modules),
      title: aiContent.title
    });

    // SUBSTITUIÇÃO FORÇADA E INTELIGENTE DE CONTEÚDO

    // 1. Primeiro substitui o título principal da página
    htmlContent = htmlContent.replace(/<title>([^<]*)<\/title>/gi, `<title>${aiContent.title}</title>`);

    // 2. Substitui TODOS os headings com conteúdo da IA
    const allTitles = htmlContent.match(/<h([1-6])([^>]*?)>([\s\S]*?)<\/h[1-6]>/gi);
    if (allTitles && aiContent.title) {
      console.log('📝 Substituindo títulos:', allTitles.length);
      const moduleValues = Object.values(aiContent.modules);
      let titleIndex = 0;

      allTitles.forEach((element) => {
        // Pega o título da IA baseado na posição
        let titleText;
        if (titleIndex === 0) {
          titleText = aiContent.title;
        } else if (moduleValues[titleIndex - 1]?.title) {
          titleText = moduleValues[titleIndex - 1].title;
        } else {
          titleText = `${aiContent.title} - Seção ${titleIndex}`;
        }

        const newElement = element.replace(
          /(<h[1-6][^>]*?>)[\s\S]*?(<\/h[1-6]>)/i,
          `$1${titleText}$2`
        );
        htmlContent = htmlContent.replace(element, newElement);
        console.log(`   ✓ Título ${titleIndex + 1}: "${titleText}"`);
        titleIndex++;
      });
    }

    // 3. Substitui TODOS os parágrafos significativos
    const allParagraphs = htmlContent.match(/<p([^>]*?)>([\s\S]*?)<\/p>/gi);
    if (allParagraphs) {
      console.log('📝 Substituindo parágrafos:', allParagraphs.length);
      const moduleValues = Object.values(aiContent.modules);
      let paragraphIndex = 0;

      allParagraphs.forEach((element) => {
        // Extrai o conteúdo atual para verificar se deve ser substituído
        const currentContent = element.match(/<p[^>]*?>([\s\S]*?)<\/p>/i)[1];

        // Só substitui se o parágrafo tem conteúdo significativo (mais que 15 caracteres)
        if (currentContent.replace(/<[^>]*>/g, '').trim().length > 15) {
          const moduleData = moduleValues[paragraphIndex % moduleValues.length];
          let newContent = moduleData?.content || `Conteúdo personalizado baseado no briefing: "${aiContent.title}". Este conteúdo foi gerado especificamente para atender às necessidades do seu projeto.`;

          // Se tem bullets, formatar como lista HTML
          if (moduleData?.bullets && Array.isArray(moduleData.bullets)) {
            newContent = moduleData.bullets.map(bullet => `• ${bullet}`).join('<br>');
          }

          const newElement = element.replace(
            /(<p[^>]*?>)[\s\S]*?(<\/p>)/i,
            `$1${newContent}$2`
          );
          htmlContent = htmlContent.replace(element, newElement);
          console.log(`   ✓ Parágrafo ${paragraphIndex + 1}: ${newContent.substring(0, 50)}...`);
          paragraphIndex++;
        }
      });
    }

    // 4. Substitui conteúdo de divs com texto significativo
    const contentDivs = htmlContent.match(/<div([^>]*?)>([\s\S]*?)<\/div>/gi);
    if (contentDivs) {
      const moduleValues = Object.values(aiContent.modules);
      let divIndex = 0;

      contentDivs.forEach((element) => {
        const divContent = element.match(/<div[^>]*?>([\s\S]*?)<\/div>/i)[1];
        const textContent = divContent.replace(/<[^>]*>/g, '').trim();

        // Só substitui divs com texto significativo e que não contêm outros elementos estruturais
        if (textContent.length > 20 && !divContent.includes('<div') && !divContent.includes('<section')) {
          const moduleData = moduleValues[divIndex % moduleValues.length];
          let newContent = moduleData?.content || `Conteúdo gerado pela IA baseado em: "${aiContent.title}"`;

          const newElement = element.replace(
            /(<div[^>]*?>)[\s\S]*?(<\/div>)/i,
            `$1${newContent}$2`
          );
          htmlContent = htmlContent.replace(element, newElement);
          console.log(`   ✓ Div ${divIndex + 1}: ${newContent.substring(0, 40)}...`);
          divIndex++;
        }
      });
    }

    // 3. Injeta métricas onde houver espaço ou cria seção nova
    if (aiContent.modules.metricas?.metrics) {
      console.log('📊 Injetando métricas:', aiContent.modules.metricas.metrics.length);

      let metricsHTML = '<div class="ai-metrics-section" style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">';
      metricsHTML += `<h3 style="margin-bottom: 20px; color: #1e40af;">${aiContent.modules.metricas.title}</h3>`;
      metricsHTML += '<div class="metrics-grid">';

      aiContent.modules.metricas.metrics.forEach(metric => {
        metricsHTML += `
          <div class="metric-item">
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.label}</div>
            <div class="metric-desc">${metric.description}</div>
          </div>`;
      });

      metricsHTML += '</div></div>';

      // Injeta antes do último elemento do container principal
      const mainContainers = htmlContent.match(/<div[^>]*class="[^"]*container[^"]*"[^>]*>/gi);
      if (mainContainers) {
        const lastContainer = htmlContent.lastIndexOf('</div>');
        htmlContent = htmlContent.slice(0, lastContainer) + metricsHTML + htmlContent.slice(lastContainer);
      } else {
        // Se não encontrar container, adiciona antes do </body>
        htmlContent = htmlContent.replace('</body>', metricsHTML + '</body>');
      }
    }

    // 5. Substituições globais de placeholders e textos padrão
    console.log('🔄 Aplicando substituições globais...');

    // Placeholders
    htmlContent = htmlContent.replace(/\{\{title\}\}/g, aiContent.title);
    htmlContent = htmlContent.replace(/\{\{audience\}\}/g, config.audience || 'Stakeholders');
    htmlContent = htmlContent.replace(/\{\{company\}\}/g, config.company || 'Sua Empresa');

    // Força substituições de textos padrão comuns em templates
    const commonReplacements = [
      ['Apresentação Corporativa', aiContent.title],
      ['Estratégia Empresarial', aiContent.title],
      ['Futuro Sustentável', aiContent.title],
      ['Modern Contact Center', aiContent.title],
      ['Treinamento', aiContent.title],
      ['TREINAMENTO', aiContent.title.toUpperCase()],
      ['Título Principal', aiContent.title],
      ['Título da Apresentação', aiContent.title],
      ['Nome da Empresa', config.company || 'Sua Empresa'],
      ['Darede', config.company || 'Sua Empresa']
    ];

    commonReplacements.forEach(([old, replacement]) => {
      const count = (htmlContent.match(new RegExp(old, 'gi')) || []).length;
      if (count > 0) {
        htmlContent = htmlContent.replace(new RegExp(old, 'gi'), replacement);
        console.log(`   ✓ Substituído "${old}" por "${replacement}" (${count} ocorrências)`);
      }
    });

    // 6. Substitui textos em elementos específicos se ainda não foram capturados
    console.log('🔧 Aplicando substituições de força bruta...');

    // Força substituição em spans com texto significativo
    const spans = htmlContent.match(/<span([^>]*?)>([\s\S]*?)<\/span>/gi);
    if (spans) {
      spans.forEach((span, index) => {
        const textContent = span.replace(/<[^>]*>/g, '').trim();
        if (textContent.length > 10 && !textContent.includes('©') && !textContent.includes('®')) {
          const moduleValues = Object.values(aiContent.modules);
          const moduleData = moduleValues[index % moduleValues.length];
          if (moduleData?.content) {
            const newSpan = span.replace(
              /(<span[^>]*?>)[\s\S]*?(<\/span>)/i,
              `$1${moduleData.content.substring(0, 100)}$2`
            );
            htmlContent = htmlContent.replace(span, newSpan);
            console.log(`   ✓ Span ${index + 1}: ${moduleData.content.substring(0, 30)}...`);
          }
        }
      });
    }

    // Log final das mudanças
    console.log('✅ Substituição de conteúdo FORÇADA concluída');
    console.log(`📊 Resumo: Título="${aiContent.title}", Módulos=${Object.keys(aiContent.modules).length}`);

    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const outputPath = path.join(__dirname, 'generated', `${presentationId}.html`);

    // Add presentation controls and metrics styling
    const controlsScript = `
    <style>
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }
      .metric-item {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #e9ecef;
      }
      .metric-value {
        font-size: 2.5em;
        font-weight: bold;
        color: #007bff;
        margin-bottom: 5px;
      }
      .metric-label {
        font-size: 1.1em;
        font-weight: 600;
        color: #495057;
        margin-bottom: 5px;
      }
      .metric-desc {
        font-size: 0.9em;
        color: #6c757d;
      }
      .ai-enhanced {
        border-left: 4px solid #28a745;
        padding-left: 15px;
        background-color: rgba(40, 167, 69, 0.05);
      }
    </style>
    <script>
      window.presentationData = ${JSON.stringify({
        id: presentationId,
        title: aiContent.title,
        slideCount: aiContent.slideCount,
        generatedAt: aiContent.generatedAt
      })};

      function downloadPresentation() {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(document.documentElement.outerHTML));
        element.setAttribute('download', '${aiContent.title.replace(/[^a-zA-Z0-9]/g, '_')}.html');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }

      document.addEventListener('DOMContentLoaded', function() {
        // Add AI enhancement indicator to modified elements
        const aiElements = document.querySelectorAll('[data-ai-role]');
        aiElements.forEach(el => el.classList.add('ai-enhanced'));

        // Add download button
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '📥 Baixar Apresentação';
        downloadBtn.onclick = downloadPresentation;
        downloadBtn.style.cssText = \`
          position: fixed;
          top: 20px;
          right: 20px;
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          z-index: 1000;
          font-size: 14px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        \`;
        document.body.appendChild(downloadBtn);
      });
    </script>`;

    htmlContent = htmlContent.replace('</body>', `${controlsScript}</body>`);

    await fs.writeFile(outputPath, htmlContent);

    res.json({
      success: true,
      presentation: {
        id: presentationId,
        title: aiContent.title,
        url: `/generated/${presentationId}.html`,
        path: outputPath
      }
    });
  } catch (error) {
    console.error('Erro na geração:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/generated', express.static(path.join(__dirname, 'generated')));

app.get('/api/download/:presentationId', async (req, res) => {
  try {
    const { presentationId } = req.params;
    const filePath = path.join(__dirname, 'generated', `${presentationId}.html`);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ success: false, error: 'Apresentação não encontrada' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const titleMatch = content.match(/<title>([^<]*)<\/title>/);
    const filename = titleMatch ?
      `${titleMatch[1].replace(/[^a-zA-Z0-9]/g, '_')}.html` :
      `${presentationId}.html`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Initialize and start server
async function startServer() {
  try {
    await ensureDirectories();

    app.listen(PORT, () => {
      const aiProvider = process.env.AI_PROVIDER || 'simple';
      const aiModel = process.env.ANTHROPIC_MODEL || 'fallback';

      console.log(`🚀 GerAI-MCF Custom Templates Server rodando em http://localhost:${PORT}`);
      console.log(`📁 Diretórios criados: templates/ assets/ generated/ uploads/`);
      console.log(`🎨 Modo: Templates Profissionais Customizados Apenas`);
      console.log(`🤖 IA: ${aiProvider === 'anthropic' ? `Claude ${aiModel}` : 'Modo Simples (sem API)'}`);
      console.log(`✅ Pronto para receber seus templates HTML!`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;