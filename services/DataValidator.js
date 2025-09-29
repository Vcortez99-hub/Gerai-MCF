/**
 * Data Validator - Sistema de validação robusta para dados e arquivos
 * Garante qualidade e segurança dos dados processados
 */

const XLSX = require('xlsx');

class DataValidator {
  constructor() {
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
    this.allowedTypes = {
      excel: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'text/csv'
      ],
      document: [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      image: [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/svg+xml'
      ]
    };

    console.log('🛡️ DataValidator inicializado');
  }

  /**
   * Valida arquivo enviado
   */
  validateFile(file) {
    const errors = [];

    // Verificar tamanho
    if (file.size > this.maxFileSize) {
      errors.push(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo: ${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Verificar tipo
    const allAllowedTypes = [
      ...this.allowedTypes.excel,
      ...this.allowedTypes.document,
      ...this.allowedTypes.image
    ];

    if (!allAllowedTypes.includes(file.mimetype)) {
      errors.push(`Tipo de arquivo não suportado: ${file.mimetype}`);
    }

    // Verificar nome
    if (!file.originalname || file.originalname.length < 1) {
      errors.push('Nome do arquivo inválido');
    }

    return {
      valid: errors.length === 0,
      errors,
      type: this.getFileCategory(file.mimetype),
      suggestions: this.getSuggestions(file.mimetype)
    };
  }

  /**
   * Valida conteúdo Excel especificamente
   */
  validateExcelContent(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        analysis: {
          totalSheets: workbook.SheetNames.length,
          sheets: {}
        }
      };

      // Validar cada planilha
      workbook.SheetNames.forEach(sheetName => {
        try {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

          const sheetAnalysis = {
            name: sheetName,
            totalRows: jsonData.length,
            totalCols: Math.max(...jsonData.map(row => row.length)),
            hasHeaders: jsonData.length > 0 && jsonData[0].some(cell => typeof cell === 'string'),
            numericColumns: 0,
            emptyRows: 0,
            dataQuality: 'good'
          };

          // Analisar qualidade dos dados
          let numericCells = 0;
          let totalCells = 0;
          let emptyCells = 0;

          jsonData.forEach((row, rowIndex) => {
            if (row.every(cell => cell === null || cell === '')) {
              sheetAnalysis.emptyRows++;
            }

            row.forEach(cell => {
              totalCells++;
              if (cell === null || cell === '') {
                emptyCells++;
              } else if (typeof cell === 'number' || (!isNaN(parseFloat(cell)) && isFinite(cell))) {
                numericCells++;
              }
            });
          });

          // Calcular qualidade
          const emptyPercentage = (emptyCells / totalCells) * 100;
          const numericPercentage = (numericCells / totalCells) * 100;

          if (emptyPercentage > 70) {
            sheetAnalysis.dataQuality = 'poor';
            validation.warnings.push(`Planilha '${sheetName}' tem muitas células vazias (${emptyPercentage.toFixed(1)}%)`);
          } else if (emptyPercentage > 40) {
            sheetAnalysis.dataQuality = 'fair';
            validation.warnings.push(`Planilha '${sheetName}' tem algumas células vazias (${emptyPercentage.toFixed(1)}%)`);
          }

          if (numericPercentage < 10 && jsonData.length > 1) {
            validation.warnings.push(`Planilha '${sheetName}' tem poucos dados numéricos (${numericPercentage.toFixed(1)}%) - pode limitar análises estatísticas`);
          }

          sheetAnalysis.statistics = {
            emptyPercentage: Math.round(emptyPercentage),
            numericPercentage: Math.round(numericPercentage),
            totalCells,
            numericCells,
            emptyCells
          };

          validation.analysis.sheets[sheetName] = sheetAnalysis;

        } catch (sheetError) {
          validation.errors.push(`Erro ao processar planilha '${sheetName}': ${sheetError.message}`);
          validation.valid = false;
        }
      });

      // Validações gerais
      if (workbook.SheetNames.length === 0) {
        validation.errors.push('Arquivo Excel não contém planilhas válidas');
        validation.valid = false;
      }

      const totalDataSheets = Object.values(validation.analysis.sheets)
        .filter(sheet => sheet.totalRows > 1).length;

      if (totalDataSheets === 0) {
        validation.warnings.push('Nenhuma planilha contém dados além dos cabeçalhos');
      }

      return validation;

    } catch (error) {
      return {
        valid: false,
        errors: [`Erro ao processar arquivo Excel: ${error.message}`],
        warnings: [],
        analysis: null
      };
    }
  }

  /**
   * Valida dados numéricos para cálculos
   */
  validateNumericData(data) {
    const validation = {
      valid: true,
      errors: [],
      cleanData: [],
      statistics: {
        total: 0,
        valid: 0,
        invalid: 0,
        nullCount: 0
      }
    };

    if (!Array.isArray(data)) {
      validation.valid = false;
      validation.errors.push('Dados devem ser um array');
      return validation;
    }

    validation.statistics.total = data.length;

    data.forEach((value, index) => {
      if (value === null || value === undefined || value === '') {
        validation.statistics.nullCount++;
      } else if (typeof value === 'number' && isFinite(value)) {
        validation.cleanData.push(value);
        validation.statistics.valid++;
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
        if (!isNaN(parsed) && isFinite(parsed)) {
          validation.cleanData.push(parsed);
          validation.statistics.valid++;
        } else {
          validation.statistics.invalid++;
        }
      } else {
        validation.statistics.invalid++;
      }
    });

    if (validation.cleanData.length === 0) {
      validation.valid = false;
      validation.errors.push('Nenhum dado numérico válido encontrado');
    }

    validation.statistics.validPercentage = Math.round((validation.statistics.valid / validation.statistics.total) * 100);

    return validation;
  }

  /**
   * Categoriza tipo de arquivo
   */
  getFileCategory(mimetype) {
    if (this.allowedTypes.excel.includes(mimetype)) return 'excel';
    if (this.allowedTypes.document.includes(mimetype)) return 'document';
    if (this.allowedTypes.image.includes(mimetype)) return 'image';
    return 'unknown';
  }

  /**
   * Sugestões baseadas no tipo de arquivo
   */
  getSuggestions(mimetype) {
    const category = this.getFileCategory(mimetype);

    const suggestions = {
      excel: [
        'Certifique-se de que os dados estão organizados em colunas',
        'Use a primeira linha para cabeçalhos das colunas',
        'Evite células vazias desnecessárias',
        'Mantenha dados numéricos em formato numérico (não texto)'
      ],
      document: [
        'PDFs serão analisados para extração de texto',
        'Documentos Word devem estar bem formatados',
        'Textos simples são mais fáceis de processar'
      ],
      image: [
        'Imagens serão incluídas na apresentação',
        'Use formatos PNG ou JPEG para melhor qualidade',
        'Evite imagens muito grandes (>5MB)'
      ],
      unknown: [
        'Tipo de arquivo não reconhecido',
        'Use Excel (.xlsx) para dados numéricos',
        'Use PDF ou Word para documentos',
        'Use PNG/JPEG para imagens'
      ]
    };

    return suggestions[category] || suggestions.unknown;
  }

  /**
   * Sanitiza dados para prevenir problemas de segurança
   */
  sanitizeData(data) {
    if (typeof data === 'string') {
      return data
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript URLs
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[this.sanitizeData(key)] = this.sanitizeData(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Valida briefing de entrada
   */
  validateBriefing(briefing) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!briefing || typeof briefing !== 'string') {
      validation.valid = false;
      validation.errors.push('Briefing deve ser um texto válido');
      return validation;
    }

    const cleanBriefing = briefing.trim();

    if (cleanBriefing.length < 10) {
      validation.valid = false;
      validation.errors.push('Briefing muito curto (mínimo 10 caracteres)');
    }

    if (cleanBriefing.length > 10000) {
      validation.warnings.push('Briefing muito longo (máximo recomendado: 5000 caracteres)');
    }

    // Verificar qualidade do briefing
    const words = cleanBriefing.split(/\s+/).length;
    if (words < 5) {
      validation.warnings.push('Briefing muito básico - adicione mais detalhes para melhor resultado');
    }

    // Sugestões
    if (!cleanBriefing.includes('objetivo') && !cleanBriefing.includes('meta')) {
      validation.suggestions.push('Mencione os objetivos da apresentação');
    }

    if (!cleanBriefing.includes('público') && !cleanBriefing.includes('audiência')) {
      validation.suggestions.push('Descreva o público-alvo');
    }

    return validation;
  }
}

module.exports = DataValidator;