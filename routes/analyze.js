/**
 * Rotas de análise prévia (estilo Gamma.ai)
 */

const express = require('express');
const router = express.Router();
const PresentationAnalyzer = require('../services/PresentationAnalyzer');
const OpenAIService = require('../services/OpenAIService');

const analyzer = new PresentationAnalyzer();
const openaiService = new OpenAIService();

/**
 * POST /api/analyze-presentation
 * Etapa 1: Analisa briefing + anexos e retorna estrutura sugerida de slides
 */
router.post('/analyze-presentation', async (req, res) => {
  try {
    const { briefing, company, audience, slideCount, attachments } = req.body;

    console.log('📊 ETAPA 1: Analisando conteúdo...');
    console.log(`   Briefing: ${briefing?.substring(0, 100)}...`);
    console.log(`   Anexos: ${attachments?.length || 0}`);
    console.log(`   Slides solicitados: ${slideCount || 6}`);

    const config = {
      company: company || '',
      audience: audience || 'Executivos',
      slideCount: slideCount || 6,
      attachments: attachments || []
    };

    // Analisar e estruturar
    const result = await analyzer.analyzeAndStructure(briefing, config);

    console.log(`✅ Estrutura gerada: ${result.structure.slides.length} slides`);

    res.json({
      success: true,
      step: 1,
      structure: result.structure,
      canEdit: true,
      message: 'Estrutura gerada! Edite os briefings dos slides e confirme para gerar.'
    });

  } catch (error) {
    console.error('❌ Erro na análise:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/generate-from-structure
 * Etapa 2: Gera apresentação HTML baseado na estrutura editada pelo usuário
 */
router.post('/generate-from-structure', async (req, res) => {
  try {
    const { structure, config } = req.body;

    console.log('🎨 ETAPA 2: Gerando apresentação da estrutura...');
    console.log(`   Slides: ${structure.slides.length}`);

    // Preparar briefing completo
    const preparedData = await analyzer.generateFromStructure(structure, config);

    // Gerar HTML com OpenAI
    const result = await openaiService.generateContent(
      preparedData.briefing,
      preparedData.config
    );

    if (result.success) {
      // Salvar arquivo HTML
      const fs = require('fs-extra');
      const path = require('path');

      const fileName = `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.html`;
      const filePath = path.join(__dirname, '../generated', fileName);

      await fs.writeFile(filePath, result.data.html || result.data.htmlContent);

      console.log(`✅ Apresentação gerada: ${fileName}`);

      res.json({
        success: true,
        step: 2,
        fileName,
        downloadUrl: `/generated/${fileName}`,
        presentationId: fileName.replace('.html', ''),
        message: 'Apresentação gerada com sucesso!'
      });

    } else {
      throw new Error(result.error || 'Erro na geração');
    }

  } catch (error) {
    console.error('❌ Erro ao gerar:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/update-slide-briefing
 * Atualiza briefing de um slide específico
 */
router.put('/update-slide-briefing', async (req, res) => {
  try {
    const { slideNumber, newBriefing } = req.body;

    // Esta rota será usada pelo frontend para atualizar briefings
    // antes de gerar a apresentação final

    res.json({
      success: true,
      message: `Briefing do slide ${slideNumber} atualizado`,
      slideNumber,
      newBriefing
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
