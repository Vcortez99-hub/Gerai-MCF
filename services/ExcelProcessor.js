/**
 * ExcelProcessor - Processamento robusto de arquivos Excel e PDFs para análise por IA
 */

const XLSX = require('xlsx');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

class ExcelProcessor {
  /**
   * Processa anexos e extrai dados estruturados
   */
  static async processAttachments(attachments) {
    if (!attachments || attachments.length === 0) {
      return { hasData: false, summary: '', structuredData: [] };
    }

    const results = [];
    let fullSummary = '';

    for (let i = 0; i < attachments.length; i++) {
      const attachment = attachments[i];
      console.log(`📊 Processando anexo ${i + 1}: ${attachment.name || 'sem nome'}`);

      try {
        // Verificar se é Excel
        const isExcel = this.isExcelFile(attachment);
        const isPDF = this.isPDFFile(attachment);

        if (isExcel) {
          const excelData = await this.processExcelAttachment(attachment);
          results.push(excelData);
          fullSummary += excelData.summary + '\n\n';
        } else if (isPDF) {
          const pdfData = await this.processPDFAttachment(attachment);
          results.push(pdfData);
          fullSummary += pdfData.summary + '\n\n';
        } else if (attachment.content) {
          // Arquivo de texto
          results.push({
            type: 'text',
            name: attachment.name,
            content: attachment.content,
            summary: `Arquivo de texto: ${attachment.content.substring(0, 500)}...`
          });
          fullSummary += `TEXTO: ${attachment.content}\n\n`;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar anexo ${i + 1}:`, error.message);
      }
    }

    return {
      hasData: results.length > 0,
      summary: fullSummary,
      structuredData: results
    };
  }

  /**
   * Verifica se é arquivo Excel
   */
  static isExcelFile(attachment) {
    if (attachment.name) {
      const name = attachment.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
        return true;
      }
    }

    if (attachment.type) {
      const type = attachment.type.toLowerCase();
      if (type.includes('excel') || type.includes('spreadsheet') || type.includes('sheet')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se é arquivo PDF
   */
  static isPDFFile(attachment) {
    if (attachment.name) {
      const name = attachment.name.toLowerCase();
      if (name.endsWith('.pdf')) {
        return true;
      }
    }

    if (attachment.type) {
      const type = attachment.type.toLowerCase();
      if (type.includes('pdf')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Processa arquivo PDF e extrai texto
   */
  static async processPDFAttachment(attachment) {
    console.log('📄 Processando PDF e extraindo texto...');

    try {
      // Decodificar base64
      let buffer;
      if (attachment.url && attachment.url.startsWith('data:')) {
        const base64Data = attachment.url.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else if (attachment.buffer) {
        buffer = attachment.buffer;
      } else {
        throw new Error('Formato de anexo não suportado');
      }

      // Extrair texto do PDF usando pdfjs-dist
      // Converter Buffer para Uint8Array
      const uint8Array = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdfDocument = await loadingTask.promise;
      const pageCount = pdfDocument.numPages;

      let fullText = '';
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      console.log(`📄 PDF processado: ${pageCount} páginas, ${fullText.length} caracteres`);

      const summary = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 CONTEÚDO DO PDF: ${attachment.name || 'Documento'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📑 Páginas: ${pageCount}
📝 Total de caracteres: ${fullText.length}

⚠️⚠️⚠️ IMPORTANTE: USE ESTE CONTEÚDO NA APRESENTAÇÃO! ⚠️⚠️⚠️

━━━ CONTEÚDO COMPLETO DO PDF ━━━

${fullText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

      return {
        type: 'pdf',
        name: attachment.name,
        content: fullText,
        pageCount: pageCount,
        summary: summary
      };
    } catch (error) {
      console.error('❌ Erro ao processar PDF:', error.message);
      throw error;
    }
  }

  /**
   * Processa arquivo Excel e extrai dados estruturados
   */
  static async processExcelAttachment(attachment) {
    console.log('📈 Processando Excel com análise matemática...');

    try {
      // Decodificar base64
      let buffer;
      if (attachment.url && attachment.url.startsWith('data:')) {
        const base64Data = attachment.url.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else if (attachment.buffer) {
        buffer = attachment.buffer;
      } else {
        throw new Error('Formato de anexo não suportado');
      }

      // Ler Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;

      console.log(`📋 Planilhas encontradas: ${sheetNames.join(', ')}`);

      let summary = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      summary += `📊 DADOS EXCEL: ${attachment.name || 'Planilha'}\n`;
      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      summary += `Total de abas: ${sheetNames.length}\n`;
      summary += `Abas: ${sheetNames.join(', ')}\n\n`;

      const allData = {};
      const numericAnalysis = {};

      // Processar cada aba
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        // Separar cabeçalhos e dados
        const headers = jsonData[0] || [];
        const dataRows = jsonData.slice(1).filter(row =>
          row.some(cell => cell !== null && cell !== '')
        );

        console.log(`  📄 Aba "${sheetName}": ${headers.length} colunas, ${dataRows.length} linhas`);

        summary += `━━━ ABA: ${sheetName} ━━━\n`;
        summary += `Colunas: ${headers.join(' | ')}\n`;
        summary += `Total de linhas: ${dataRows.length}\n\n`;

        // Análise numérica de cada coluna
        const columnStats = {};
        headers.forEach((header, idx) => {
          if (!header) return;

          const columnValues = dataRows
            .map(row => row[idx])
            .filter(val => val !== null && val !== '' && !isNaN(parseFloat(val)))
            .map(val => parseFloat(val));

          if (columnValues.length > 0) {
            const sum = columnValues.reduce((a, b) => a + b, 0);
            const avg = sum / columnValues.length;
            const min = Math.min(...columnValues);
            const max = Math.max(...columnValues);

            columnStats[header] = {
              count: columnValues.length,
              sum: sum,
              average: avg,
              min: min,
              max: max,
              values: columnValues.slice(0, 10) // Primeiros 10 valores
            };

            summary += `📊 ${header}:\n`;
            summary += `   SOMA: ${sum.toLocaleString('pt-BR', {maximumFractionDigits: 2})}\n`;
            summary += `   MÉDIA: ${avg.toLocaleString('pt-BR', {maximumFractionDigits: 2})}\n`;
            summary += `   MIN: ${min.toLocaleString('pt-BR')} | MAX: ${max.toLocaleString('pt-BR')}\n`;
            summary += `   Total de valores: ${columnValues.length}\n\n`;
          }
        });

        // Dados amostrais (primeiras 5 linhas)
        summary += `PRIMEIRAS 5 LINHAS:\n`;
        dataRows.slice(0, 5).forEach((row, idx) => {
          const rowData = headers.map((h, i) => `${h}: ${row[i] || ''}`).join(' | ');
          summary += `  ${idx + 1}. ${rowData}\n`;
        });
        summary += '\n';

        allData[sheetName] = {
          headers,
          rows: dataRows,
          stats: columnStats
        };

        numericAnalysis[sheetName] = columnStats;
      });

      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      summary += `⚠️ INSTRUÇÕES CRÍTICAS:\n`;
      summary += `- Use os NÚMEROS EXATOS acima\n`;
      summary += `- Crie gráficos com os VALORES REAIS\n`;
      summary += `- Calcule porcentagens baseadas nas SOMAS reais\n`;
      summary += `- NÃO invente dados, use APENAS os fornecidos\n`;
      summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

      console.log(`✅ Excel processado com sucesso`);

      return {
        type: 'excel',
        name: attachment.name,
        sheetNames,
        data: allData,
        numericAnalysis,
        summary
      };

    } catch (error) {
      console.error('❌ Erro ao processar Excel:', error.message);
      return {
        type: 'excel',
        name: attachment.name,
        error: error.message,
        summary: `Erro ao processar Excel: ${error.message}`
      };
    }
  }

  /**
   * Gera recomendações de visualizações baseadas nos dados
   */
  static recommendVisualizations(processedData) {
    if (!processedData.hasData) {
      return [];
    }

    const recommendations = [];

    processedData.structuredData.forEach(data => {
      if (data.type === 'excel' && data.numericAnalysis) {
        Object.entries(data.numericAnalysis).forEach(([sheetName, stats]) => {
          const numericColumns = Object.keys(stats);

          if (numericColumns.length >= 2) {
            recommendations.push({
              type: 'comparison-chart',
              title: `Comparação: ${sheetName}`,
              columns: numericColumns.slice(0, 5),
              data: stats
            });
          }

          if (numericColumns.length >= 1) {
            recommendations.push({
              type: 'bar-chart',
              title: `Ranking: ${sheetName}`,
              column: numericColumns[0],
              data: stats[numericColumns[0]]
            });
          }
        });
      }
    });

    return recommendations;
  }
}

module.exports = ExcelProcessor;
