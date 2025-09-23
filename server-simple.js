const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Ensure directories exist
async function ensureDirectories() {
  const dirs = ['templates', 'assets', 'generated', 'uploads'];
  for (const dir of dirs) {
    await fs.ensureDir(path.join(__dirname, dir));
  }
}

// Simple template service
class SimpleTemplateService {
  static async createDefaultTemplate() {
    const templatePath = path.join(__dirname, 'templates', 'default.html');

    if (await fs.pathExists(templatePath)) {
      return { id: 'default', path: templatePath };
    }

    const defaultTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="template-name" content="Template Padrão Corporativo">
    <meta name="category" content="corporativo">
    <title>Apresentação Corporativa</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
            color: #333;
        }
        .slide {
            background: white;
            margin-bottom: 40px;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 500px;
        }
        .slide h1 {
            color: #007bff;
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .slide h2 {
            color: #495057;
            margin-bottom: 20px;
        }
        .slide p {
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .slide ul {
            line-height: 1.8;
        }
        .logo {
            width: 150px;
            height: auto;
            margin-bottom: 20px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .metric {
            text-align: center;
            padding: 20px;
            background: #e9ecef;
            border-radius: 8px;
            border-top: 4px solid #007bff;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        .preserve-brand {
            border: 2px dashed #28a745;
            padding: 10px;
        }
        @media print {
            .slide { page-break-after: always; }
        }
    </style>
</head>
<body>
    <!-- Slide 1: Capa -->
    <div class="slide" data-module="capa">
        <div class="preserve-brand">
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h2>🏢 LOGO DA EMPRESA</h2>
                <small>Este espaço preserva a identidade visual</small>
            </div>
        </div>
        <h1 data-ai-role="title" data-placeholder="{{title}}">Título da Apresentação</h1>
        <p data-ai-role="description" data-placeholder="{{subtitle}}">Subtítulo ou descrição da apresentação será gerada aqui pela IA.</p>
        <div style="margin-top: 40px;">
            <p><strong>Apresentação para:</strong> <span data-placeholder="{{audience}}">Público-alvo</span></p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
    </div>

    <!-- Slide 2: Agenda -->
    <div class="slide" data-module="agenda">
        <h1 data-ai-role="title">Agenda</h1>
        <div data-ai-role="list" data-placeholder="{{agenda_content}}">
            <ul>
                <li>Contexto e Objetivos</li>
                <li>Desafios Identificados</li>
                <li>Solução Proposta</li>
                <li>Resultados Esperados</li>
                <li>Próximos Passos</li>
            </ul>
        </div>
    </div>

    <!-- Slide 3: Problema -->
    <div class="slide" data-module="problema">
        <h1 data-ai-role="title">O Desafio</h1>
        <div data-ai-role="description" data-placeholder="{{problema_content}}">
            <p>Descrição do problema ou desafio será gerada aqui pela IA baseada no seu briefing.</p>
        </div>
        <div data-ai-role="list">
            <h2>Principais Impactos:</h2>
            <ul>
                <li>Impacto 1 será gerado pela IA</li>
                <li>Impacto 2 será gerado pela IA</li>
                <li>Impacto 3 será gerado pela IA</li>
            </ul>
        </div>
    </div>

    <!-- Slide 4: Solução -->
    <div class="slide" data-module="solucao">
        <h1 data-ai-role="title">Nossa Solução</h1>
        <div data-ai-role="description" data-placeholder="{{solucao_content}}">
            <p>Descrição da solução proposta será gerada aqui pela IA.</p>
        </div>
        <div data-ai-role="list">
            <h2>Principais Benefícios:</h2>
            <ul>
                <li>Benefício 1 será detalhado pela IA</li>
                <li>Benefício 2 será detalhado pela IA</li>
                <li>Benefício 3 será detalhado pela IA</li>
            </ul>
        </div>
    </div>

    <!-- Slide 5: Métricas -->
    <div class="slide" data-module="metricas">
        <h1 data-ai-role="title">Resultados e Métricas</h1>
        <div data-ai-role="description">
            <p>Principais indicadores de sucesso e resultados esperados:</p>
        </div>
        <div class="metrics" data-placeholder="{{metricas_content}}">
            <div class="metric">
                <div class="metric-value">300%</div>
                <div>ROI Esperado</div>
            </div>
            <div class="metric">
                <div class="metric-value">80%</div>
                <div>Redução de Tempo</div>
            </div>
            <div class="metric">
                <div class="metric-value">R$ 500k</div>
                <div>Economia Anual</div>
            </div>
        </div>
    </div>

    <!-- Slide 6: Conclusão -->
    <div class="slide" data-module="conclusao">
        <h1 data-ai-role="title">Próximos Passos</h1>
        <div data-ai-role="description" data-placeholder="{{conclusao_content}}">
            <p>Resumo e call-to-action será gerado pela IA.</p>
        </div>
        <div data-ai-role="list">
            <h2>Ações Recomendadas:</h2>
            <ul>
                <li>Ação 1 será definida pela IA</li>
                <li>Ação 2 será definida pela IA</li>
                <li>Ação 3 será definida pela IA</li>
            </ul>
        </div>
        <div style="margin-top: 40px; text-align: center; padding: 20px; background: #e9ecef; border-radius: 8px;">
            <h2>Obrigado!</h2>
            <p>Vamos dar início a essa transformação?</p>
        </div>
    </div>

    <script>
        // Navegação básica
        document.addEventListener('keydown', function(e) {
            if (e.key === 'F11') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
        });

        console.log('📊 GerAI-MCF Template Carregado');
        console.log('🎯 Pressione F11 para tela cheia');
    </script>
</body>
</html>
    `;

    await fs.writeFile(templatePath, defaultTemplate);
    return { id: 'default', path: templatePath };
  }

  static async listTemplates() {
    await this.createDefaultTemplate();
    return [{
      id: 'default',
      name: 'Template Padrão Corporativo',
      description: 'Template empresarial com estrutura modular e preservação de marca',
      category: 'corporativo',
      modules: ['capa', 'agenda', 'problema', 'solucao', 'metricas', 'conclusao'],
      thumbnail: null,
      createdAt: new Date().toISOString()
    }];
  }
}

// Simple AI service
class SimpleAIService {
  static generateContent(briefing, config) {
    // Simulação simples de geração de conteúdo
    const words = briefing.toLowerCase().split(' ');

    let title = "Apresentação Corporativa";
    if (words.includes('automação') || words.includes('automatizar')) {
      title = "Transformação Digital através da Automação";
    } else if (words.includes('vendas') || words.includes('comercial')) {
      title = "Proposta Comercial Estratégica";
    } else if (words.includes('segurança') || words.includes('security')) {
      title = "Segurança e Compliance Empresarial";
    }

    return {
      title,
      modules: {
        agenda: {
          title: "Agenda da Apresentação",
          content: "Estrutura da apresentação baseada no briefing fornecido",
          bullets: [
            "Contexto atual do negócio",
            "Desafios identificados",
            "Solução proposta",
            "Benefícios esperados",
            "Plano de implementação"
          ]
        },
        problema: {
          title: "Situação Atual",
          content: `Baseado no briefing: "${briefing.substring(0, 200)}..."`,
          bullets: [
            "Processos atuais ineficientes",
            "Gargalos operacionais identificados",
            "Impacto nos resultados"
          ]
        },
        solucao: {
          title: `Solução ${config.company || 'Empresarial'}`,
          content: "Nossa proposta customizada para resolver os desafios apresentados",
          bullets: [
            "Implementação estratégica",
            "Tecnologia adequada ao contexto",
            "Suporte especializado"
          ]
        },
        metricas: {
          title: "Resultados Esperados",
          content: "Indicadores de sucesso mensuráveis",
          metrics: [
            { label: "Eficiência", value: "+80%", description: "Melhoria nos processos" },
            { label: "ROI", value: "300%", description: "Retorno em 12 meses" },
            { label: "Satisfação", value: "95%", description: "Aprovação dos usuários" }
          ]
        }
      },
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
    version: '1.0.0-simple'
  });
});

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await SimpleTemplateService.listTemplates();
    res.json({ success: true, templates });
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

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const aiContent = SimpleAIService.generateContent(aiPrompt, config);

    // Load template
    const template = await SimpleTemplateService.createDefaultTemplate();
    let htmlContent = await fs.readFile(template.path, 'utf-8');

    // Simple content replacement
    htmlContent = htmlContent.replace('{{title}}', aiContent.title);
    htmlContent = htmlContent.replace('{{audience}}', config.audience || 'Stakeholders');

    // Replace module content
    Object.entries(aiContent.modules).forEach(([moduleType, moduleData]) => {
      if (moduleData.content) {
        htmlContent = htmlContent.replace(
          new RegExp(`{{${moduleType}_content}}`, 'g'),
          moduleData.content
        );
      }
    });

    const presentationId = `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const outputPath = path.join(__dirname, 'generated', `${presentationId}.html`);

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
      console.log(`🚀 GerAI-MCF Simple Server rodando em http://localhost:${PORT}`);
      console.log(`📁 Diretórios criados: templates/ assets/ generated/ uploads/`);
      console.log(`🤖 Modo: Simulação de IA (sem dependências externas)`);
      console.log(`✅ Pronto para uso!`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;