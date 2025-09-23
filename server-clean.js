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

    // Add placeholders to headings
    processedContent = processedContent.replace(
      /<h([1-6])([^>]*)>([^<]*)<\/h[1-6]>/g,
      (match, level, attrs, text) => {
        if (!attrs.includes('data-ai-role')) {
          return `<h${level}${attrs} data-ai-role="title" data-placeholder="{{ai_title}}">${text}</h${level}>`;
        }
        return match;
      }
    );

    // Add placeholders to paragraphs
    processedContent = processedContent.replace(
      /<p([^>]*)>([^<]*)<\/p>/g,
      (match, attrs, text) => {
        if (!attrs.includes('data-ai-role') && text.length > 20) {
          return `<p${attrs} data-ai-role="content" data-placeholder="{{ai_content}}">${text}</p>`;
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

// AI service for content generation
class AIContentService {
  static generateContent(briefing, config) {
    const words = briefing.toLowerCase().split(' ');
    const slideCount = parseInt(config.slideCount) || 6;

    let title = "Apresentação Corporativa";
    if (words.includes('automação') || words.includes('automatizar')) {
      title = "Transformação Digital através da Automação";
    } else if (words.includes('vendas') || words.includes('comercial')) {
      title = "Proposta Comercial Estratégica";
    } else if (words.includes('segurança') || words.includes('security')) {
      title = "Segurança e Compliance Empresarial";
    }

    const allModules = {
      capa: {
        title: title,
        content: `Apresentação para ${config.audience || 'stakeholders'}`,
        subtitle: `${config.company || 'Nossa Empresa'} - ${new Date().getFullYear()}`
      },
      agenda: {
        title: "Agenda da Apresentação",
        content: "Estrutura da apresentação baseada no briefing fornecido",
        bullets: ["Contexto atual", "Desafios identificados", "Solução proposta", "Benefícios esperados"]
      },
      problema: {
        title: "Situação Atual",
        content: `Baseado no briefing: "${briefing.substring(0, 200)}..."`,
        bullets: ["Processos atuais ineficientes", "Gargalos operacionais", "Impacto nos resultados"]
      },
      solucao: {
        title: `Solução ${config.company || 'Empresarial'}`,
        content: "Nossa proposta customizada para resolver os desafios apresentados",
        bullets: ["Implementação estratégica", "Tecnologia adequada", "Suporte especializado"]
      },
      metricas: {
        title: "Resultados Esperados",
        content: "Indicadores de sucesso mensuráveis",
        metrics: [
          { label: "Eficiência", value: "+80%", description: "Melhoria nos processos" },
          { label: "ROI", value: "300%", description: "Retorno em 12 meses" }
        ]
      },
      conclusao: {
        title: "Próximos Passos",
        content: "Resumo e call-to-action",
        bullets: ["Aprovação da proposta", "Definição de cronograma", "Início da implementação"]
      }
    };

    const moduleKeys = Object.keys(allModules);
    const selectedKeys = moduleKeys.slice(0, Math.min(slideCount, moduleKeys.length));
    const selectedModules = {};
    selectedKeys.forEach(key => {
      selectedModules[key] = allModules[key];
    });

    return {
      title,
      slideCount,
      modules: selectedModules,
      generatedAt: new Date().toISOString(),
      config,
      provider: 'simple-ai'
    };
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
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiContent = AIContentService.generateContent(aiPrompt, config);
    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    // Simple content replacement
    htmlContent = htmlContent.replace(/\{\{title\}\}/g, aiContent.title);
    htmlContent = htmlContent.replace(/\{\{audience\}\}/g, config.audience || 'Stakeholders');

    // Replace module content
    Object.entries(aiContent.modules).forEach(([moduleType, moduleData]) => {
      if (moduleData.content) {
        htmlContent = htmlContent.replace(
          new RegExp(`\\{\\{${moduleType}_content\\}\\}`, 'g'),
          moduleData.content
        );
      }
      if (moduleData.title) {
        const titleRegex = new RegExp(`(<div[^>]*data-module="${moduleType}"[^>]*>.*?<h[1-6][^>]*>)[^<]*(</h[1-6]>)`, 's');
        htmlContent = htmlContent.replace(titleRegex, `$1${moduleData.title}$2`);
      }
    });

    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const outputPath = path.join(__dirname, 'generated', `${presentationId}.html`);

    // Add presentation controls
    const controlsScript = `
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
      console.log(`🚀 GerAI-MCF Custom Templates Server rodando em http://localhost:${PORT}`);
      console.log(`📁 Diretórios criados: templates/ assets/ generated/ uploads/`);
      console.log(`🎨 Modo: Templates Profissionais Customizados Apenas`);
      console.log(`✅ Pronto para receber seus templates HTML!`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;