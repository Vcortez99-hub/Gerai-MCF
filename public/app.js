class PresentationGenerator {
    constructor() {
        this.currentTemplateId = null;
        this.generatedPresentationId = null;
        this.init();
    }

    async init() {
        await this.checkSystemHealth();
        await this.loadTemplates();
        await this.loadAvailablePrompts();
        this.setupEventListeners();
        this.setupFormValidation();
    }

    async checkSystemHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();

            const statusIndicator = document.getElementById('statusIndicator');
            if (data.success) {
                statusIndicator.innerHTML = '<i class="fas fa-circle text-success"></i> <span>Sistema Online</span>';
            } else {
                statusIndicator.innerHTML = '<i class="fas fa-circle text-danger"></i> <span>Sistema Indisponível</span>';
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            document.getElementById('statusIndicator').innerHTML =
                '<i class="fas fa-circle text-warning"></i> <span>Verificando...</span>';
        }
    }

    async loadTemplates() {
        // Template loading não é mais necessário - IA gera HTML completo
        console.log('🎨 Sistema configurado para geração automática de design');
    }

    async loadAvailablePrompts() {
        // Endpoint /api/prompts não existe no servidor atual
        // Removido para evitar erro 404 desnecessário
        console.log('Sistema usando prompts padrão integrados');
    }

    renderPromptOptions(prompts) {
        const promptSelect = document.getElementById('promptType');

        prompts.forEach(prompt => {
            const option = document.createElement('option');
            option.value = prompt.id;
            option.textContent = `${prompt.name} (${prompt.category})`;
            option.setAttribute('data-category', prompt.category);
            option.setAttribute('data-audience', prompt.audience);
            promptSelect.appendChild(option);
        });

        console.log(`📋 Carregados ${prompts.length} prompts personalizados`);
    }

    renderTemplates(templates) {
        const container = document.getElementById('templateSelection');

        if (templates.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h5>Nenhum template encontrado</h5>
                        <p>Você precisa enviar pelo menos um template HTML profissional para gerar apresentações.</p>
                        <p><strong>👆 Use o campo "Enviar Template Personalizado" acima para começar.</strong></p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map(template => `
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="template-card position-relative" onclick="presentationGenerator.selectTemplate('${template.id}')">
                    <div class="mb-3">
                        <div class="bg-light rounded d-flex align-items-center justify-content-center" style="height: 120px;">
                            <i class="fas fa-file-code fa-3x text-primary"></i>
                        </div>
                    </div>
                    <h6 class="fw-bold">${template.name}</h6>
                    <small class="text-muted">${template.preview ? template.preview.substring(0, 60) + '...' : 'Template HTML profissional'}</small>
                    <div class="mt-2 d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-primary">HTML</span>
                            ${template.size ? `<small class="text-muted d-block">${Math.round(template.size / 1024)} KB</small>` : ''}
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" onclick="event.stopPropagation()">
                                <i class="fas fa-cog"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); presentationGenerator.previewTemplate('${template.id}')">
                                    <i class="fas fa-eye"></i> Preview
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="event.stopPropagation(); presentationGenerator.deleteTemplate('${template.id}')">
                                    <i class="fas fa-trash"></i> Remover
                                </a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTemplatesGrid(templates) {
        const grid = document.getElementById('templatesGrid');

        if (templates.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Nenhum template disponível no momento.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = templates.map(template => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                        <div class="text-center mb-3">
                            <div class="bg-light rounded d-flex align-items-center justify-content-center" style="height: 150px;">
                                <i class="fas fa-file-code fa-4x text-muted"></i>
                            </div>
                        </div>
                        <h5 class="card-title">${template.name}</h5>
                        <p class="card-text text-muted">${template.preview ? template.preview.substring(0, 100) + '...' : 'Template HTML profissional'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="badge bg-primary">HTML</span>
                                ${template.size ? `<span class="badge bg-info">${Math.round(template.size / 1024)} KB</span>` : ''}
                            </div>
                            <button class="btn btn-outline-primary btn-sm" onclick="presentationGenerator.selectTemplate('${template.id}')">
                                Usar Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectTemplate(templateId) {
        this.currentTemplateId = templateId;

        document.querySelectorAll('.template-card').forEach(card => {
            card.classList.remove('selected');
        });

        document.querySelectorAll('.template-card').forEach(card => {
            if (card.onclick.toString().includes(templateId)) {
                card.classList.add('selected');
            }
        });

        this.scrollToGenerator();
    }

    scrollToGenerator() {
        document.getElementById('gerador').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    setupEventListeners() {
        const form = document.getElementById('presentationForm');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        document.getElementById('briefing').addEventListener('input', (e) => {
            this.updateCharacterCount(e.target);
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.handleFormSubmit(e);
            }
        });
    }

    setupFormValidation() {
        const requiredFields = ['companyName', 'briefing'];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const isValid = value.length > 0;

        if (!isValid) {
            this.showFieldError(field, 'Este campo é obrigatório');
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);

        field.classList.add('is-invalid');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;

        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');

        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    updateCharacterCount(textarea) {
        const maxLength = 2000;
        const currentLength = textarea.value.length;

        let counter = textarea.parentNode.querySelector('.character-counter');
        if (!counter) {
            counter = document.createElement('small');
            counter.className = 'character-counter text-muted';
            textarea.parentNode.appendChild(counter);
        }

        counter.textContent = `${currentLength}/${maxLength} caracteres`;

        if (currentLength > maxLength * 0.9) {
            counter.classList.add('text-warning');
        } else {
            counter.classList.remove('text-warning');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();

        this.showLoading();

        try {
            const response = await this.generatePresentation(formData);

            if (response.success) {
                this.generatedPresentationId = response.data.presentationId;
                this.generatedFileName = response.data.fileName;
                this.showSuccess(response.data);
            } else {
                this.showError(response.error || 'Erro ao gerar apresentação');
            }
        } catch (error) {
            console.error('Erro na geração:', error);
            this.showError('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            this.hideLoading();
        }
    }

    validateForm() {
        const companyName = document.getElementById('companyName').value.trim();
        const briefing = document.getElementById('briefing').value.trim();

        let isValid = true;

        if (!companyName) {
            this.showFieldError(document.getElementById('companyName'), 'Nome da empresa é obrigatório');
            isValid = false;
        }

        if (!briefing) {
            this.showFieldError(document.getElementById('briefing'), 'Briefing é obrigatório');
            isValid = false;
        } else if (briefing.length < 50) {
            this.showFieldError(document.getElementById('briefing'), 'Briefing muito curto. Seja mais específico (mínimo 50 caracteres)');
            isValid = false;
        }

        // Template não é mais obrigatório - IA gera HTML completo
        // Automaticamente usar um templateId padrão para compatibilidade
        this.currentTemplateId = 'ai-generated-template';

        return isValid;
    }

    getFormData() {
        return {
            templateId: this.currentTemplateId,
            briefing: document.getElementById('briefing').value.trim(),
            config: {
                company: document.getElementById('companyName').value.trim(),
                audience: document.getElementById('audience').value,
                slideCount: document.getElementById('slideCount').value,
                tone: document.getElementById('tone').value,
                templateType: 'corporativa',
                promptType: document.getElementById('promptType').value
            }
        };
    }

    async generatePresentation(formData) {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        return await response.json();
    }

    showLoading() {
        document.getElementById('presentationForm').style.display = 'none';
        document.getElementById('loadingSection').style.display = 'block';
        document.getElementById('resultSection').style.display = 'none';

        this.animateProgress();
    }

    hideLoading() {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('presentationForm').style.display = 'block';
    }

    animateProgress() {
        const progressBar = document.getElementById('progressBar');
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 90) {
                progress = 90;
                clearInterval(interval);
            }

            progressBar.style.width = `${progress}%`;
        }, 500);

        return interval;
    }

    showSuccess(presentation) {
        document.getElementById('resultSection').style.display = 'block';

        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '100%';

        setTimeout(() => {
            document.getElementById('loadingSection').style.display = 'none';
        }, 1000);

        this.showNotification('Apresentação gerada com sucesso!', 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    showNotification(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 1050; min-width: 300px;';

        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Removed createDefaultTemplate method - now using custom templates only

    // Métodos para interação com apresentações geradas
    openPresentation() {
        if (this.generatedFileName) {
            window.location.href = `/generated/${this.generatedFileName}`;
        }
    }

    openPresentationNewTab() {
        if (this.generatedFileName) {
            window.open(`/generated/${this.generatedFileName}`, '_blank');
        }
    }

    async downloadPresentation() {
        if (!this.generatedFileName) {
            this.showError('Nenhuma apresentação para download');
            return;
        }

        try {
            const response = await fetch(`/generated/${this.generatedFileName}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                // Get filename from Content-Disposition header
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = `apresentacao_${this.generatedPresentationId}.html`;
                if (contentDisposition) {
                    const matches = contentDisposition.match(/filename="([^"]*)"/) ||
                                   contentDisposition.match(/filename=([^;]*)/);
                    if (matches && matches[1]) {
                        filename = matches[1];
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showNotification('Apresentação baixada com sucesso!', 'success');
            } else {
                this.showError('Erro ao baixar apresentação');
            }
        } catch (error) {
            this.showError('Erro ao baixar apresentação');
        }
    }

    copyPresentationLink() {
        if (!this.generatedFileName) {
            this.showError('Nenhuma apresentação para compartilhar');
            return;
        }

        const link = `${window.location.origin}/generated/${this.generatedFileName}`;
        this.copyToClipboard(link);
    }

    // Upload template functionality
    async uploadTemplate() {
        const fileInput = document.getElementById('templateUpload');
        const file = fileInput.files[0];

        if (!file) {
            this.showError('Selecione um arquivo HTML primeiro');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
            this.showError('Apenas arquivos HTML são permitidos');
            return;
        }

        const formData = new FormData();
        formData.append('template', file);

        const progressDiv = document.getElementById('uploadProgress');
        const progressBar = progressDiv.querySelector('.progress-bar');

        try {
            progressDiv.style.display = 'block';
            progressBar.style.width = '0%';

            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                progressBar.style.width = `${Math.min(progress, 90)}%`;
            }, 100);

            const response = await fetch('/api/templates/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            progressBar.style.width = '100%';

            const result = await response.json();

            if (result.success) {
                this.showNotification('Template enviado com sucesso!', 'success');
                await this.loadTemplates(); // Reload templates
                fileInput.value = ''; // Clear input
            } else {
                this.showError(result.error || 'Erro ao enviar template');
            }
        } catch (error) {
            this.showError('Erro ao enviar template');
        } finally {
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 1000);
        }
    }

    // Template management methods
    async previewTemplate(templateId) {
        try {
            const response = await fetch(`/api/templates/${templateId}/preview`);
            const result = await response.json();

            if (result.success) {
                // Show preview in modal
                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.innerHTML = `
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Preview do Template</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="bg-light p-3 rounded">
                                    <pre style="white-space: pre-wrap; font-size: 12px;">${result.preview}</pre>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();

                modal.addEventListener('hidden.bs.modal', () => {
                    document.body.removeChild(modal);
                });
            } else {
                this.showError('Erro ao carregar preview');
            }
        } catch (error) {
            this.showError('Erro ao carregar preview');
        }
    }

    async deleteTemplate(templateId) {
        if (!confirm('Tem certeza que deseja remover este template? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Template removido com sucesso!', 'success');
                await this.loadTemplates(); // Reload templates

                // If this was the selected template, clear selection
                if (this.currentTemplateId === templateId) {
                    this.currentTemplateId = null;
                }
            } else {
                this.showError(result.error || 'Erro ao remover template');
            }
        } catch (error) {
            this.showError('Erro ao remover template');
        }
    }

    // Utility methods
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Copiado para a área de transferência!', 'success');
        }).catch(() => {
            this.showNotification('Erro ao copiar', 'danger');
        });
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.presentationGenerator = new PresentationGenerator();

    // Setup enhanced features
    setupDragAndDrop();
    setupCharacterCounter();
    setupScrollAnimations();
    setupFormEnhancements();
});

// Smooth scrolling para links de navegação
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Funções globais para compatibilidade
function openPresentation() {
    window.presentationGenerator.openPresentation();
}

function openPresentationNewTab() {
    window.presentationGenerator.openPresentationNewTab();
}

function downloadPresentation() {
    window.presentationGenerator.downloadPresentation();
}

function copyPresentationLink() {
    window.presentationGenerator.copyPresentationLink();
}

function uploadTemplate() {
    window.presentationGenerator.uploadTemplate();
}

// Enhanced UI Functions
function setupDragAndDrop() {
    const uploadZone = document.querySelector('.upload-zone');
    if (!uploadZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.style.borderColor = 'var(--primary-color)';
            uploadZone.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
            uploadZone.style.transform = 'scale(1.02)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.style.borderColor = 'var(--border-light)';
            uploadZone.style.backgroundColor = 'transparent';
            uploadZone.style.transform = 'scale(1)';
        }, false);
    });

    uploadZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    }, false);

    // Click to upload
    uploadZone.addEventListener('click', () => {
        document.getElementById('templateUpload').click();
    });

    // Handle file input change
    const fileInput = document.getElementById('templateUpload');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileSelection(e.target.files[0]);
            }
        });
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleFileSelection(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
        window.presentationGenerator.showError('Apenas arquivos HTML são aceitos');
        return;
    }

    // Update UI
    document.getElementById('uploadBtn').disabled = false;
    document.querySelector('.upload-content h5').textContent = `✓ ${file.name}`;
    document.querySelector('.upload-content p').textContent = `Tamanho: ${formatFileSize(file.size)} • Pronto para processar`;
    document.querySelector('.upload-content i').className = 'fas fa-file-code text-success mb-3';

    // Show success state
    const uploadZone = document.querySelector('.upload-zone');
    uploadZone.style.borderColor = 'var(--success-color)';
    uploadZone.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';

    // Update file input
    const input = document.getElementById('templateUpload');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
}

function setupCharacterCounter() {
    const briefingInput = document.getElementById('briefing');
    if (!briefingInput) return;

    briefingInput.addEventListener('input', (e) => {
        updateCharCounter(e.target.value.length);
    });
}

function updateCharCounter(count) {
    const counter = document.getElementById('charCount');
    if (!counter) return;

    counter.textContent = `${count} caracteres`;

    if (count < 50) {
        counter.style.color = '#EF4444';
        counter.textContent += ' • Muito curto';
    } else if (count < 100) {
        counter.style.color = '#F59E0B';
        counter.textContent += ' • Pode melhorar';
    } else {
        counter.style.color = '#10B981';
        counter.textContent += ' • Ótimo!';
    }
}

function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .step-card, .template-card').forEach(el => {
        observer.observe(el);
    });
}

function setupFormEnhancements() {
    // Add floating labels effect
    document.querySelectorAll('.form-control, .form-select').forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'translateY(-2px)';
        });

        input.addEventListener('blur', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add progress indicator to form steps
    const sections = document.querySelectorAll('.generator-form > div');
    const progressSteps = document.createElement('div');
    progressSteps.className = 'progress-steps mb-4';
    progressSteps.innerHTML = `
        <div class="d-flex justify-content-between">
            <div class="step active"><i class="fas fa-cog"></i> Configuração</div>
            <div class="step"><i class="fas fa-edit"></i> Briefing</div>
            <div class="step"><i class="fas fa-upload"></i> Template</div>
            <div class="step"><i class="fas fa-magic"></i> Gerar</div>
        </div>
    `;

    const form = document.querySelector('.generator-form');
    if (form) {
        form.insertBefore(progressSteps, form.firstChild);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ===== PRESENTATION HISTORY FUNCTIONS =====

let currentHistoryPage = 1;
let historyData = null;

// Load presentation history
async function loadHistory(page = 1, search = '', status = '') {
    if (!window.presentationGenerator) {
        console.error('PresentationGenerator not initialized');
        return;
    }

    if (!window.presentationGenerator.currentUser) {
        console.warn('User not authenticated for history');
        return;
    }

    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '12'
        });

        if (search) params.append('search', search);
        if (status) params.append('status', status);

        const response = await fetch(`/api/history?${params}`, {
            headers: {
                'Authorization': `Bearer ${window.presentationGenerator.currentUser.access_token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            historyData = result.data;
            currentHistoryPage = page;
            renderHistoryList(result.data.presentations);
            renderHistoryPagination(result.data.pagination);
        } else {
            throw new Error(result.error || 'Erro ao carregar histórico');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        showHistoryError('Erro ao carregar histórico: ' + error.message);
    }
}

// Render history list
function renderHistoryList(presentations) {
    const container = document.getElementById('historyContainer');

    if (!presentations || presentations.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-history fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">Nenhuma apresentação encontrada</h4>
                <p class="text-muted">Gere sua primeira apresentação para vê-la aqui!</p>
                <a href="#gerador" class="btn btn-primary">
                    <i class="fas fa-magic"></i>
                    Gerar Apresentação
                </a>
            </div>
        `;
        return;
    }

    const html = presentations.map(presentation => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100 shadow-sm border-0">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <small class="opacity-75">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(presentation.created_at)}
                    </small>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-light" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="${presentation.generated_file_url}" target="_blank">
                                <i class="fas fa-external-link-alt me-2"></i>Abrir
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="editPresentationTitle('${presentation.id}', '${presentation.title.replace(/'/g, "\\'")}')">
                                <i class="fas fa-edit me-2"></i>Renomear
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deletePresentation('${presentation.id}')">
                                <i class="fas fa-trash me-2"></i>Deletar
                            </a></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body">
                    <h6 class="card-title text-primary fw-bold">${presentation.title}</h6>
                    <p class="card-text text-muted small mb-2">
                        <strong>Template:</strong> ${presentation.template_name || presentation.template_id}
                    </p>
                    <p class="card-text small text-truncate" style="max-height: 3em; overflow: hidden;">
                        ${presentation.briefing}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge ${presentation.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                                ${presentation.status === 'completed' ? 'Concluída' : 'Com erro'}
                            </span>
                        </div>
                        <div class="text-muted small">
                            ${presentation.generation_time_ms ? `${Math.round(presentation.generation_time_ms / 1000)}s` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <a href="${presentation.generated_file_url}" target="_blank" class="btn btn-primary btn-sm w-100">
                        <i class="fas fa-eye"></i>
                        Visualizar Apresentação
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Render pagination
function renderHistoryPagination(pagination) {
    const container = document.getElementById('historyPagination');

    if (pagination.totalPages <= 1) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    const ul = container.querySelector('.pagination');

    let html = '';

    // Previous button
    if (pagination.page > 1) {
        html += `<li class="page-item">
            <a class="page-link" href="#" onclick="loadHistory(${pagination.page - 1})">Anterior</a>
        </li>`;
    }

    // Page numbers
    for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.totalPages, pagination.page + 2); i++) {
        html += `<li class="page-item ${i === pagination.page ? 'active' : ''}">
            <a class="page-link" href="#" onclick="loadHistory(${i})">${i}</a>
        </li>`;
    }

    // Next button
    if (pagination.page < pagination.totalPages) {
        html += `<li class="page-item">
            <a class="page-link" href="#" onclick="loadHistory(${pagination.page + 1})">Próximo</a>
        </li>`;
    }

    ul.innerHTML = html;
}

// Show history error
function showHistoryError(message) {
    const container = document.getElementById('historyContainer');
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h4 class="text-warning">Erro</h4>
            <p class="text-muted">${message}</p>
            <button class="btn btn-primary" onclick="loadHistory()">
                <i class="fas fa-refresh"></i>
                Tentar Novamente
            </button>
        </div>
    `;
}

// Edit presentation title
async function editPresentationTitle(presentationId, currentTitle) {
    const newTitle = prompt('Novo título da apresentação:', currentTitle);

    if (!newTitle || newTitle.trim() === '' || newTitle === currentTitle) {
        return;
    }

    try {
        const response = await fetch(`/api/history/${presentationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.presentationGenerator.currentUser.access_token}`
            },
            body: JSON.stringify({ title: newTitle.trim() })
        });

        const result = await response.json();

        if (result.success) {
            // Reload current page
            loadHistory(currentHistoryPage,
                document.getElementById('historySearch').value,
                document.getElementById('historyFilter').value
            );

            window.presentationGenerator.showSuccess('Título atualizado com sucesso!');
        } else {
            throw new Error(result.error || 'Erro ao atualizar título');
        }
    } catch (error) {
        console.error('Error updating title:', error);
        window.presentationGenerator.showError('Erro ao atualizar título: ' + error.message);
    }
}

// Delete presentation
async function deletePresentation(presentationId) {
    if (!confirm('Tem certeza que deseja deletar esta apresentação? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`/api/history/${presentationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${window.presentationGenerator.currentUser.access_token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            // Reload current page
            loadHistory(currentHistoryPage,
                document.getElementById('historySearch').value,
                document.getElementById('historyFilter').value
            );

            window.presentationGenerator.showSuccess('Apresentação deletada com sucesso!');
        } else {
            throw new Error(result.error || 'Erro ao deletar apresentação');
        }
    } catch (error) {
        console.error('Error deleting presentation:', error);
        window.presentationGenerator.showError('Erro ao deletar apresentação: ' + error.message);
    }
}

// Show user statistics
async function showUserStats() {
    if (!window.presentationGenerator.currentUser) {
        return;
    }

    try {
        const response = await fetch('/api/history/stats/user', {
            headers: {
                'Authorization': `Bearer ${window.presentationGenerator.currentUser.access_token}`
            }
        });

        const result = await response.json();

        if (result.success) {
            const stats = result.data;
            const avgTime = stats.avg_generation_time_ms ? Math.round(stats.avg_generation_time_ms / 1000) : 0;

            alert(`📊 Suas Estatísticas:

• Total de apresentações: ${stats.total_presentations}
• Apresentações concluídas: ${stats.completed_presentations}
• Apresentações com erro: ${stats.failed_presentations}
• Tempo médio de geração: ${avgTime}s
• Primeira apresentação: ${stats.first_presentation ? formatDate(stats.first_presentation) : 'N/A'}
• Última apresentação: ${stats.last_presentation ? formatDate(stats.last_presentation) : 'N/A'}`);
        } else {
            throw new Error(result.error || 'Erro ao carregar estatísticas');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        window.presentationGenerator.showError('Erro ao carregar estatísticas: ' + error.message);
    }
}

// Format date for display
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Setup history search and filter handlers
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('historySearch');
    const filterSelect = document.getElementById('historyFilter');

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadHistory(1, this.value, filterSelect.value);
            }, 500);
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            loadHistory(1, searchInput.value, this.value);
        });
    }

    // Auto-load history when section becomes visible
    const historySection = document.getElementById('historico');
    if (historySection) {
        // Use MutationObserver to detect when section becomes visible
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const section = mutation.target;
                    if (section.style.display !== 'none' && window.presentationGenerator?.currentUser) {
                        console.log('📋 Histórico section became visible, loading history...');
                        loadHistory();
                        observer.disconnect(); // Stop observing after first load
                    }
                }
            });
        });

        observer.observe(historySection, {
            attributes: true,
            attributeFilter: ['style']
        });
    }

    // Also add hash change listener for direct navigation
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#historico' && window.presentationGenerator?.currentUser) {
            console.log('📋 Navigated to history section, loading history...');
            setTimeout(() => loadHistory(), 100); // Small delay to ensure section is visible
        }
    });
});