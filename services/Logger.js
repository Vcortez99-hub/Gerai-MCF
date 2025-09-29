/**
 * Logger - Sistema de logging avançado para debugging e monitoramento
 * Registra todas as operações críticas do sistema
 */

const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLevel = this.levels.INFO;
    this.maxLogFiles = 10;
    this.maxLogSize = 10 * 1024 * 1024; // 10MB

    this.init();
  }

  async init() {
    try {
      await fs.ensureDir(this.logDir);
      console.log('📝 Logger inicializado:', this.logDir);
    } catch (error) {
      console.error('❌ Erro ao inicializar logger:', error);
    }
  }

  /**
   * Formata mensagem de log
   */
  formatMessage(level, message, data = null, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      metadata: {
        pid: process.pid,
        memory: process.memoryUsage(),
        ...metadata
      }
    };

    return JSON.stringify(logEntry) + '\n';
  }

  /**
   * Escreve log no arquivo
   */
  async writeLog(level, message, data = null, metadata = {}) {
    if (this.levels[level] > this.currentLevel) {
      return; // Nível muito baixo, não registrar
    }

    try {
      const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      const formattedMessage = this.formatMessage(level, message, data, metadata);

      // Verificar tamanho do arquivo
      try {
        const stats = await fs.stat(logFile);
        if (stats.size > this.maxLogSize) {
          await this.rotateLog(logFile);
        }
      } catch (error) {
        // Arquivo não existe ainda, ok
      }

      await fs.appendFile(logFile, formattedMessage);

      // Log no console também para desenvolvimento
      const consoleMessage = `[${new Date().toLocaleTimeString()}] ${level}: ${message}`;
      if (level === 'ERROR') {
        console.error(consoleMessage, data || '');
      } else if (level === 'WARN') {
        console.warn(consoleMessage, data || '');
      } else {
        console.log(consoleMessage, data || '');
      }

    } catch (error) {
      console.error('❌ Erro ao escrever log:', error);
    }
  }

  /**
   * Rotaciona arquivo de log quando fica muito grande
   */
  async rotateLog(logFile) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
      await fs.move(logFile, rotatedFile);

      // Limpar logs antigos
      await this.cleanOldLogs();
    } catch (error) {
      console.error('❌ Erro ao rotacionar log:', error);
    }
  }

  /**
   * Remove logs antigos
   */
  async cleanOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          time: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.time - a.time);

      // Manter apenas os N arquivos mais recentes
      if (logFiles.length > this.maxLogFiles) {
        const filesToDelete = logFiles.slice(this.maxLogFiles);
        for (const file of filesToDelete) {
          await fs.remove(file.path);
          console.log(`📝 Log antigo removido: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao limpar logs antigos:', error);
    }
  }

  // Métodos de conveniência
  error(message, data = null, metadata = {}) {
    return this.writeLog('ERROR', message, data, metadata);
  }

  warn(message, data = null, metadata = {}) {
    return this.writeLog('WARN', message, data, metadata);
  }

  info(message, data = null, metadata = {}) {
    return this.writeLog('INFO', message, data, metadata);
  }

  debug(message, data = null, metadata = {}) {
    return this.writeLog('DEBUG', message, data, metadata);
  }

  /**
   * Log de geração de apresentação
   */
  async logGeneration(briefing, config, result, timing = {}) {
    const generationLog = {
      briefing: briefing.substring(0, 200) + '...',
      config: {
        company: config.company,
        audience: config.audience,
        slideCount: config.slideCount,
        attachmentsCount: config.attachments?.length || 0
      },
      result: {
        success: result.success,
        consistencyScore: result.data?.consistencyScore,
        qualityScore: result.data?.qualityScore,
        htmlSize: result.data?.html?.length || 0
      },
      timing
    };

    return this.info('Geração de apresentação', generationLog, {
      component: 'PresentationGenerator',
      action: 'generate'
    });
  }

  /**
   * Log de análise de anexos
   */
  async logAttachmentAnalysis(attachments, result, timing = {}) {
    const analysisLog = {
      attachments: attachments.map(att => ({
        type: att.type,
        size: att.size || 'unknown',
        name: att.name || 'unnamed'
      })),
      result: {
        success: result.success,
        analysisCount: result.analyses?.length || 0,
        insights: result.insights?.length || 0
      },
      timing
    };

    return this.info('Análise de anexos', analysisLog, {
      component: 'IntelligentAnalyzer',
      action: 'analyzeAttachments'
    });
  }

  /**
   * Log de erro de sistema
   */
  async logSystemError(error, context = {}) {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context
    };

    return this.error('Erro de sistema', errorLog, {
      component: context.component || 'Unknown',
      action: context.action || 'unknown',
      errorType: error.constructor.name
    });
  }

  /**
   * Log de performance
   */
  async logPerformance(operation, duration, details = {}) {
    const performanceLog = {
      operation,
      duration: `${duration}ms`,
      details
    };

    return this.info('Performance', performanceLog, {
      component: 'PerformanceMonitor',
      action: operation
    });
  }

  /**
   * Obtém estatísticas dos logs
   */
  async getLogStats() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.endsWith('.log'));

      let totalSize = 0;
      const fileStats = [];

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileStats.push({
          name: file,
          size: stats.size,
          modified: stats.mtime
        });
      }

      return {
        totalFiles: logFiles.length,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
        files: fileStats.sort((a, b) => b.modified - a.modified)
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de log:', error);
      return { error: error.message };
    }
  }

  /**
   * Define nível de log
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
      console.log(`📝 Nível de log alterado para: ${level}`);
    }
  }
}

// Singleton
let loggerInstance = null;

function getLogger() {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

module.exports = getLogger;