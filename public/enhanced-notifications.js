/**
 * Enhanced Notifications - Sistema avançado de feedback para usuário
 * Notificações inteligentes baseadas no contexto e estado da aplicação
 */

class EnhancedNotifications {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.maxNotifications = 5;
    this.defaultDuration = 5000;
    this.init();
  }

  init() {
    this.createContainer();
    this.addStyles();
    console.log('🔔 Enhanced Notifications inicializado');
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      }

      .notification {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        margin-bottom: 12px;
        padding: 16px;
        border-left: 4px solid #ccc;
        animation: slideIn 0.3s ease-out;
        position: relative;
        overflow: hidden;
      }

      .notification.success {
        border-left-color: #28a745;
      }

      .notification.error {
        border-left-color: #dc3545;
      }

      .notification.warning {
        border-left-color: #ffc107;
      }

      .notification.info {
        border-left-color: #17a2b8;
      }

      .notification.processing {
        border-left-color: #ff9500;
      }

      .notification-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .notification-title {
        font-weight: 600;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 20px;
        height: 20px;
      }

      .notification-close:hover {
        color: #333;
      }

      .notification-content {
        color: #666;
        line-height: 1.4;
      }

      .notification-progress {
        margin-top: 8px;
      }

      .progress-bar {
        background: #f0f0f0;
        height: 4px;
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        background: #ff9500;
        height: 100%;
        transition: width 0.3s ease;
      }

      .notification-details {
        margin-top: 8px;
        font-size: 0.9em;
        color: #888;
      }

      .notification-actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
      }

      .notification-btn {
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
      }

      .notification-btn:hover {
        background: #f8f9fa;
      }

      .notification-btn.primary {
        background: #ff9500;
        color: white;
        border-color: #ff9500;
      }

      .notification-btn.primary:hover {
        background: #e68600;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .notification.hiding {
        animation: slideOut 0.3s ease-in forwards;
      }

      .pulse-icon {
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Mostra notificação básica
   */
  show(type, title, content, options = {}) {
    const id = this.generateId();
    const notification = this.createNotification(id, type, title, content, options);

    this.notifications.set(id, notification);
    this.container.appendChild(notification.element);

    // Remover notificações antigas se necessário
    if (this.notifications.size > this.maxNotifications) {
      this.removeOldest();
    }

    // Auto-remove se não for persistente
    if (!options.persistent) {
      const duration = options.duration || this.defaultDuration;
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  /**
   * Cria elemento de notificação
   */
  createNotification(id, type, title, content, options) {
    const element = document.createElement('div');
    element.className = `notification ${type}`;
    element.setAttribute('data-id', id);

    const icon = this.getIcon(type, options.processing);

    element.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">
          ${icon} ${title}
        </div>
        <button class="notification-close" onclick="notifications.remove('${id}')">&times;</button>
      </div>
      <div class="notification-content">${content}</div>
      ${options.details ? `<div class="notification-details">${options.details}</div>` : ''}
      ${options.progress ? '<div class="notification-progress"><div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div></div>' : ''}
      ${options.actions ? this.createActions(options.actions, id) : ''}
    `;

    return {
      element,
      type,
      title,
      content,
      options,
      createdAt: Date.now()
    };
  }

  /**
   * Obtém ícone baseado no tipo
   */
  getIcon(type, processing = false) {
    const icons = {
      success: '<i class="fas fa-check-circle" style="color: #28a745;"></i>',
      error: '<i class="fas fa-exclamation-circle" style="color: #dc3545;"></i>',
      warning: '<i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i>',
      info: '<i class="fas fa-info-circle" style="color: #17a2b8;"></i>',
      processing: '<i class="fas fa-cog fa-spin" style="color: #ff9500;"></i>'
    };

    if (processing && type !== 'processing') {
      return icons.processing;
    }

    return icons[type] || icons.info;
  }

  /**
   * Cria botões de ação
   */
  createActions(actions, notificationId) {
    const actionsHtml = actions.map(action =>
      `<button class="notification-btn ${action.type || ''}" onclick="${action.onClick}">
        ${action.label}
      </button>`
    ).join('');

    return `<div class="notification-actions">${actionsHtml}</div>`;
  }

  /**
   * Métodos de conveniência
   */
  success(title, content, options = {}) {
    return this.show('success', title, content, options);
  }

  error(title, content, options = {}) {
    return this.show('error', title, content, { persistent: true, ...options });
  }

  warning(title, content, options = {}) {
    return this.show('warning', title, content, options);
  }

  info(title, content, options = {}) {
    return this.show('info', title, content, options);
  }

  processing(title, content, options = {}) {
    return this.show('processing', title, content, { persistent: true, progress: true, ...options });
  }

  /**
   * Notificações específicas para o contexto da aplicação
   */
  excelAnalysis(fileName, stats) {
    const content = `
      Arquivo: ${fileName}<br>
      Planilhas: ${stats.totalSheets}<br>
      Dados numéricos: ${stats.numericCells} células<br>
      Qualidade: ${stats.quality}
    `;

    return this.success('Excel Processado', content, {
      details: 'Os dados foram analisados matematicamente e estão prontos para uso na apresentação.',
      duration: 7000
    });
  }

  generationStarted(briefing, attachments = 0) {
    const content = `
      Analisando briefing e ${attachments} anexo(s)...<br>
      <small>Isso pode levar alguns minutos</small>
    `;

    return this.processing('Gerando Apresentação', content, {
      details: 'IA está processando seus dados e criando conteúdo personalizado.',
      progress: true
    });
  }

  generationProgress(progress, stage) {
    const notification = this.findByType('processing');
    if (notification) {
      const progressBar = notification.element.querySelector('.progress-fill');
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }

      const content = notification.element.querySelector('.notification-content');
      if (content) {
        content.innerHTML = `
          ${stage}<br>
          <small>Progresso: ${progress}%</small>
        `;
      }
    }
  }

  generationComplete(result) {
    // Remove notificação de processamento
    const processingNotification = this.findByType('processing');
    if (processingNotification) {
      this.remove(processingNotification.id);
    }

    const content = `
      Apresentação criada com sucesso!<br>
      Consistência: ${result.consistencyScore || 'N/A'}%<br>
      Qualidade: ${result.qualityScore || 'N/A'}%
    `;

    return this.success('Apresentação Pronta', content, {
      details: 'Sua apresentação foi gerada com análise real dos dados fornecidos.',
      actions: [
        {
          label: 'Visualizar',
          type: 'primary',
          onClick: 'window.open("/generated/" + presentationGenerator.generatedPresentationId + ".html", "_blank")'
        },
        {
          label: 'Editar',
          onClick: 'window.open("/editor.html?load=" + presentationGenerator.generatedPresentationId + ".html", "_blank")'
        }
      ],
      duration: 10000
    });
  }

  fileValidationError(fileName, errors) {
    const content = `
      Arquivo: ${fileName}<br>
      ${errors.slice(0, 3).map(error => `• ${error}`).join('<br>')}
      ${errors.length > 3 ? `<br>... e mais ${errors.length - 3} erro(s)` : ''}
    `;

    return this.error('Arquivo Inválido', content, {
      details: 'Verifique o formato e conteúdo do arquivo antes de tentar novamente.'
    });
  }

  /**
   * Utilitários
   */
  remove(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.element.classList.add('hiding');
      setTimeout(() => {
        if (notification.element.parentNode) {
          notification.element.parentNode.removeChild(notification.element);
        }
        this.notifications.delete(id);
      }, 300);
    }
  }

  removeOldest() {
    const oldest = Array.from(this.notifications.entries())
      .sort((a, b) => a[1].createdAt - b[1].createdAt)[0];

    if (oldest) {
      this.remove(oldest[0]);
    }
  }

  findByType(type) {
    for (const [id, notification] of this.notifications) {
      if (notification.type === type) {
        return { id, ...notification };
      }
    }
    return null;
  }

  generateId() {
    return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  clear() {
    for (const id of this.notifications.keys()) {
      this.remove(id);
    }
  }
}

// Inicializar instância global
window.notifications = new EnhancedNotifications();