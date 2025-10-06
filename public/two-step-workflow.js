/**
 * 2-Step Workflow Extension for Presentation Generator
 * Step 1: Analyze briefing → Show editable slide structure
 * Step 2: User edits → Generate final HTML
 */

// Override the original generatePresentation method
if (window.presentationGenerator) {
    const originalGenerate = window.presentationGenerator.generatePresentation.bind(window.presentationGenerator);

    // Add structure storage
    window.presentationGenerator.slideStructure = null;
    window.presentationGenerator.isEditingStructure = false;

    // New method: Analyze and show structure (Step 1)
    window.presentationGenerator.analyzePresentation = async function(formData) {
        console.log('📊 STEP 1: Analyzing presentation structure...');

        try {
            // Call analyze API
            const response = await fetch('/api/analyze-presentation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    briefing: formData.briefing,
                    company: formData.config.company || 'Empresa',
                    audience: formData.config.audience,
                    slideCount: parseInt(formData.config.slideCount),
                    attachments: formData.attachments || []
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to analyze');
            }

            console.log('✅ Structure analyzed:', result.structure);

            // Store structure
            this.slideStructure = result.structure;
            this.isEditingStructure = true;

            // Show structure editor UI
            this.showStructureEditor(result.structure);

            return result;

        } catch (error) {
            console.error('❌ Error analyzing presentation:', error);
            throw error;
        }
    };

    // New method: Generate from edited structure (Step 2)
    window.presentationGenerator.generateFromStructure = async function(structure) {
        console.log('🎨 STEP 2: Generating from edited structure...');

        try {
            const response = await fetch('/api/generate-from-structure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    structure: structure,
                    config: {
                        company: 'Darede',
                        slideCount: structure.slideCount
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Generation failed');
            }

            console.log('✅ Presentation generated!', result);

            return {
                success: true,
                data: {
                    fileName: result.fileName,
                    downloadUrl: result.downloadUrl,
                    presentationId: result.fileName,
                    title: 'Apresentação Gerada',
                    qualityScore: result.validation?.percentage || 90
                }
            };

        } catch (error) {
            console.error('❌ Error generating from structure:', error);
            throw error;
        }
    };

    // New method: Show structure editor UI
    window.presentationGenerator.showStructureEditor = function(structure) {
        // Hide loading
        this.hideLoading();

        // Create structure editor HTML
        const editorHTML = `
            <div class="structure-editor" style="margin-top: 2rem; padding: 2rem; background: linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%); border-radius: 24px; border: 2px solid rgba(79, 70, 229, 0.2);">
                <div class="text-center mb-4">
                    <h4><i class="fas fa-layer-group text-primary"></i> Estrutura Sugerida pela IA</h4>
                    <p class="text-muted">Revise e edite os briefings de cada slide antes de gerar</p>
                </div>

                <div id="slideStructureList" class="mb-4">
                    ${structure.slides.map(slide => `
                        <div class="slide-structure-item card mb-3" data-slide="${slide.slideNumber}">
                            <div class="card-body">
                                <div class="d-flex align-items-start">
                                    <div class="me-3">
                                        <div class="slide-number-badge" style="width: 48px; height: 48px; background: var(--blue-gradient); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem;">
                                            ${slide.slideNumber}
                                        </div>
                                    </div>
                                    <div class="flex-grow-1">
                                        <div class="mb-2">
                                            <span class="badge bg-primary">${slide.type}</span>
                                            <input type="text" class="form-control form-control-sm d-inline-block w-75 ms-2" value="${slide.title}" data-field="title" />
                                        </div>
                                        <textarea class="form-control" rows="3" data-field="briefing">${slide.briefing}</textarea>
                                        ${slide.suggestedData ? `
                                            <div class="mt-2">
                                                <small class="text-muted"><i class="fas fa-database"></i> Dados sugeridos: ${slide.suggestedData.join(', ')}</small>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="text-center">
                    <button class="btn btn-success btn-lg me-2" onclick="presentationGenerator.confirmAndGenerate()">
                        <i class="fas fa-check-circle"></i> Confirmar e Gerar Apresentação
                    </button>
                    <button class="btn btn-outline-secondary btn-lg" onclick="presentationGenerator.cancelStructureEdit()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `;

        // Insert editor after form
        const form = document.getElementById('presentationForm');
        let editor = document.getElementById('structureEditorContainer');
        if (!editor) {
            editor = document.createElement('div');
            editor.id = 'structureEditorContainer';
            form.parentNode.insertBefore(editor, form.nextSibling);
        }
        editor.innerHTML = editorHTML;

        // Scroll to editor
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Method: Confirm and generate from edited structure
    window.presentationGenerator.confirmAndGenerate = async function() {
        // Collect edited values
        const editedStructure = {
            slideCount: this.slideStructure.slideCount,
            slides: []
        };

        const slideItems = document.querySelectorAll('.slide-structure-item');
        slideItems.forEach((item, index) => {
            const slideNumber = parseInt(item.dataset.slide);
            const originalSlide = this.slideStructure.slides.find(s => s.slideNumber === slideNumber);

            const title = item.querySelector('[data-field="title"]').value;
            const briefing = item.querySelector('[data-field="briefing"]').value;

            editedStructure.slides.push({
                slideNumber: originalSlide.slideNumber,
                type: originalSlide.type,
                title: title,
                briefing: briefing,
                suggestedData: originalSlide.suggestedData
            });
        });

        console.log('📝 Edited structure:', editedStructure);

        // Show loading
        this.showLoading();
        document.getElementById('structureEditorContainer').style.display = 'none';

        try {
            const result = await this.generateFromStructure(editedStructure);

            if (result.success) {
                this.generatedPresentationId = result.data.presentationId;
                this.generatedFileName = result.data.fileName;
                this.showSuccess(result.data);
            } else {
                this.showError(result.error || 'Erro ao gerar apresentação');
            }
        } catch (error) {
            console.error('Erro na geração final:', error);
            this.showError('Erro de conexão. Verifique sua internet e tente novamente.');
        } finally {
            this.hideLoading();
            this.isEditingStructure = false;
        }
    };

    // Method: Cancel structure editing
    window.presentationGenerator.cancelStructureEdit = function() {
        const editor = document.getElementById('structureEditorContainer');
        if (editor) {
            editor.remove();
        }
        this.slideStructure = null;
        this.isEditingStructure = false;
    };

    // Override handleFormSubmit to use 2-step workflow
    const originalHandleSubmit = window.presentationGenerator.handleFormSubmit.bind(window.presentationGenerator);

    window.presentationGenerator.handleFormSubmit = async function(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();

        // Scroll to loading section
        document.getElementById('loadingSection').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        this.showLoading();

        try {
            // STEP 1: Analyze and show structure
            await this.analyzePresentation(formData);

            // Structure editor is now shown, waiting for user confirmation

        } catch (error) {
            console.error('Erro na análise:', error);
            this.showError('Erro ao analisar apresentação. Tente novamente.');
            this.hideLoading();
        }
    };

    console.log('✅ 2-Step Workflow Extension Loaded');
}
