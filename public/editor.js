class PresentationEditor {
    constructor() {
        this.currentSlideIndex = 0;
        this.slides = [];
        this.selectedElement = null;
        this.history = [];
        this.historyIndex = -1;
        this.presentationId = null;
        this.isDragging = false;
        this.init();
    }

    async init() {
        await this.loadPresentationFromUrl();
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadProfessionalIcons();
        this.renderSlidesList();
        this.selectSlide(0);
    }

    async loadPresentationFromUrl() {
        // Pega parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        this.presentationId = urlParams.get('id');
        const loadFile = urlParams.get('load'); // Para carregar arquivo HTML externo

        // Se tem parâmetro 'load', carrega HTML externo
        if (loadFile) {
            try {
                const response = await fetch(`/generated/${loadFile}`);
                const html = await response.text();
                this.loadHtmlIntoEditor(html);
                return;
            } catch (error) {
                console.error('Erro ao carregar HTML externo:', error);
            }
        }

        if (!this.presentationId) {
            // Se não tem ID, tenta pegar de localStorage (apresentação recém gerada)
            const generatedData = localStorage.getItem('lastGeneratedPresentation');
            if (generatedData) {
                const data = JSON.parse(generatedData);
                this.loadPresentationFromData(data);
            } else {
                this.createEmptyPresentation();
            }
            return;
        }

        try {
            // Carrega apresentação do servidor
            const response = await fetch(`/api/presentations/${this.presentationId}`);
            const result = await response.json();

            if (result.success) {
                this.loadPresentationFromData(result.data);
            } else {
                throw new Error('Apresentação não encontrada');
            }
        } catch (error) {
            console.error('Erro ao carregar apresentação:', error);
            this.createEmptyPresentation();
        }
    }

    loadPresentationFromData(data) {
        // Converte HTML em slides editáveis
        if (data.htmlContent) {
            this.parseHtmlToSlides(data.htmlContent);
        } else if (data.slides) {
            this.slides = data.slides;
        } else {
            this.createEmptyPresentation();
        }
    }

    loadHtmlIntoEditor(htmlContent) {
        // Carrega HTML externo diretamente no editor
        console.log('🎯 Carregando HTML externo no editor');

        // Cria um DOM temporário para processar o HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Torna elementos editáveis
        this.makeElementsEditable(tempDiv);

        // Parse os slides processados
        this.parseHtmlToSlides(tempDiv.innerHTML);
    }

    makeElementsEditable(container) {
        // Torna títulos editáveis
        container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
            el.contentEditable = true;
            el.setAttribute('data-editable', 'true');
            el.setAttribute('data-element-type', 'heading');
            el.style.outline = '2px dashed transparent';
            el.style.transition = 'outline 0.2s ease';

            // Hover effect
            el.addEventListener('mouseenter', () => {
                el.style.outline = '2px dashed rgba(11,107,74,0.5)';
            });
            el.addEventListener('mouseleave', () => {
                if (!el.classList.contains('selected')) {
                    el.style.outline = '2px dashed transparent';
                }
            });
        });

        // Torna parágrafos e textos editáveis
        container.querySelectorAll('p, .subtitle, .muted, li, .big, .value, .label').forEach(el => {
            el.contentEditable = true;
            el.setAttribute('data-editable', 'true');
            el.setAttribute('data-element-type', 'text');
            el.style.outline = '2px dashed transparent';
            el.style.transition = 'outline 0.2s ease';

            // Hover effect
            el.addEventListener('mouseenter', () => {
                el.style.outline = '2px dashed rgba(212,175,55,0.5)';
            });
            el.addEventListener('mouseleave', () => {
                if (!el.classList.contains('selected')) {
                    el.style.outline = '2px dashed transparent';
                }
            });
        });

        // Torna cards e containers draggable
        container.querySelectorAll('.card, .col, .metric').forEach(el => {
            el.draggable = true;
            el.setAttribute('data-draggable', 'true');
            el.setAttribute('data-element-type', 'container');
            el.style.cursor = 'move';
            el.style.outline = '1px dashed transparent';
            el.style.transition = 'outline 0.2s ease, transform 0.2s ease';

            // Hover effect
            el.addEventListener('mouseenter', () => {
                el.style.outline = '1px dashed rgba(255,255,255,0.3)';
                el.style.transform = 'scale(1.02)';
            });
            el.addEventListener('mouseleave', () => {
                if (!el.classList.contains('selected')) {
                    el.style.outline = '1px dashed transparent';
                    el.style.transform = 'scale(1)';
                }
            });
        });
    }

    parseHtmlToSlides(htmlContent) {
        // Cria um DOM temporário para parsear o HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Procura por slides (pode ser por classe, id, ou tag específica)
        const slideElements = tempDiv.querySelectorAll('.slide, [data-slide], section');

        if (slideElements.length === 0) {
            // Se não encontrou slides estruturados, divide por títulos ou cria um slide único
            this.slides = [{
                id: 'slide-1',
                title: 'Slide 1',
                content: htmlContent,
                elements: []
            }];
        } else {
            this.slides = Array.from(slideElements).map((slide, index) => ({
                id: `slide-${index + 1}`,
                title: slide.querySelector('h1, h2, h3')?.textContent || `Slide ${index + 1}`,
                content: slide.innerHTML,
                elements: this.parseSlideElements(slide)
            }));
        }
    }

    parseSlideElements(slideElement) {
        const elements = [];

        // Parse diferentes tipos de elementos
        slideElement.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el, index) => {
            elements.push({
                id: `heading-${index}`,
                type: 'heading',
                tag: el.tagName.toLowerCase(),
                content: el.textContent,
                styles: this.getElementStyles(el)
            });
        });

        slideElement.querySelectorAll('p').forEach((el, index) => {
            elements.push({
                id: `paragraph-${index}`,
                type: 'paragraph',
                content: el.innerHTML,
                styles: this.getElementStyles(el)
            });
        });

        slideElement.querySelectorAll('img').forEach((el, index) => {
            elements.push({
                id: `image-${index}`,
                type: 'image',
                src: el.src,
                alt: el.alt,
                styles: this.getElementStyles(el)
            });
        });

        slideElement.querySelectorAll('ul, ol').forEach((el, index) => {
            elements.push({
                id: `list-${index}`,
                type: 'list',
                listType: el.tagName.toLowerCase(),
                items: Array.from(el.querySelectorAll('li')).map(li => li.innerHTML),
                styles: this.getElementStyles(el)
            });
        });

        return elements;
    }

    getElementStyles(element) {
        const computedStyle = window.getComputedStyle(element);
        return {
            color: computedStyle.color,
            backgroundColor: computedStyle.backgroundColor,
            fontSize: computedStyle.fontSize,
            fontFamily: computedStyle.fontFamily,
            fontWeight: computedStyle.fontWeight,
            textAlign: computedStyle.textAlign,
            padding: computedStyle.padding,
            margin: computedStyle.margin
        };
    }

    createEmptyPresentation() {
        this.slides = [
            {
                id: 'slide-1',
                title: 'Slide 1',
                content: '<h2>Título do Slide</h2><p>Conteúdo do slide...</p>',
                elements: [
                    {
                        id: 'title-1',
                        type: 'heading',
                        tag: 'h2',
                        content: 'Título do Slide',
                        styles: {}
                    },
                    {
                        id: 'content-1',
                        type: 'paragraph',
                        content: 'Conteúdo do slide...',
                        styles: {}
                    }
                ]
            }
        ];
    }

    setupEventListeners() {
        // Click handlers para elementos editáveis
        document.addEventListener('click', (e) => {
            if (e.target.closest('.editable-element')) {
                this.selectElement(e.target.closest('.editable-element'));
            } else {
                this.deselectElement();
            }
        });

        // Double click para editar texto
        document.addEventListener('dblclick', (e) => {
            if (e.target.closest('.editable-element[data-type="text"], .editable-element[data-type="heading"]')) {
                this.editTextElement(e.target.closest('.editable-element'));
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redoAction();
                        } else {
                            this.undoAction();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        this.savePresentation();
                        break;
                    case 'Delete':
                        if (this.selectedElement) {
                            this.deleteElement(this.selectedElement);
                        }
                        break;
                }
            }
        });
    }

    setupDragAndDrop() {
        const slideContent = document.getElementById('currentSlideContent');

        // Sortable para reorganizar elementos
        new Sortable(slideContent, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onEnd: (evt) => {
                this.saveState();
                this.updateSlideFromDOM();
            }
        });
    }

    renderSlidesList() {
        const container = document.getElementById('slidesList');

        const html = this.slides.map((slide, index) => `
            <div class="slide-thumbnail ${index === this.currentSlideIndex ? 'active' : ''}"
                 onclick="editor.selectSlide(${index})">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <small class="fw-bold">${slide.title}</small>
                    <div class="dropdown">
                        <button class="btn btn-sm text-light" data-bs-toggle="dropdown" onclick="event.stopPropagation()">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-dark">
                            <li><a class="dropdown-item" href="#" onclick="editor.duplicateSlide(${index})">
                                <i class="fas fa-copy me-2"></i>Duplicar
                            </a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="editor.deleteSlide(${index})">
                                <i class="fas fa-trash me-2"></i>Excluir
                            </a></li>
                        </ul>
                    </div>
                </div>
                <div class="slide-preview">
                    ${this.renderSlidePreview(slide)}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderSlidePreview(slide) {
        return `<div class="p-2 bg-white text-dark small">${slide.content}</div>`;
    }

    selectSlide(index) {
        if (index < 0 || index >= this.slides.length) return;

        this.currentSlideIndex = index;
        this.renderCurrentSlide();
        this.renderSlidesList();
    }

    renderCurrentSlide() {
        const container = document.getElementById('currentSlideContent');
        const slide = this.slides[this.currentSlideIndex];

        if (!slide) return;

        container.innerHTML = this.renderEditableSlide(slide);
        this.makeElementsEditable();
    }

    renderEditableSlide(slide) {
        // Converte elementos em HTML editável
        let html = '';

        slide.elements.forEach(element => {
            html += this.renderEditableElement(element);
        });

        return html || slide.content;
    }

    renderEditableElement(element) {
        const styles = this.stylesToCSS(element.styles);

        switch (element.type) {
            case 'heading':
                return `
                    <div class="editable-element" data-type="heading" data-element-id="${element.id}" style="${styles}">
                        <div class="element-controls">
                            <button onclick="editor.moveElementUp('${element.id}')" title="Mover para cima">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button onclick="editor.moveElementDown('${element.id}')" title="Mover para baixo">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button onclick="editor.deleteElement('${element.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <${element.tag}>${element.content}</${element.tag}>
                    </div>
                `;

            case 'paragraph':
                return `
                    <div class="editable-element" data-type="paragraph" data-element-id="${element.id}" style="${styles}">
                        <div class="element-controls">
                            <button onclick="editor.moveElementUp('${element.id}')" title="Mover para cima">
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button onclick="editor.moveElementDown('${element.id}')" title="Mover para baixo">
                                <i class="fas fa-arrow-down"></i>
                            </button>
                            <button onclick="editor.deleteElement('${element.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <p>${element.content}</p>
                    </div>
                `;

            case 'image':
                return `
                    <div class="editable-element" data-type="image" data-element-id="${element.id}" style="${styles}">
                        <div class="element-controls">
                            <button onclick="editor.changeImage('${element.id}')" title="Alterar imagem">
                                <i class="fas fa-image"></i>
                            </button>
                            <button onclick="editor.deleteElement('${element.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <img src="${element.src}" alt="${element.alt}" class="img-fluid">
                    </div>
                `;

            case 'list':
                const listItems = element.items.map(item => `<li>${item}</li>`).join('');
                return `
                    <div class="editable-element" data-type="list" data-element-id="${element.id}" style="${styles}">
                        <div class="element-controls">
                            <button onclick="editor.addListItem('${element.id}')" title="Adicionar item">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button onclick="editor.deleteElement('${element.id}')" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <${element.listType}>${listItems}</${element.listType}>
                    </div>
                `;

            default:
                return `<div class="editable-element" data-element-id="${element.id}">${element.content}</div>`;
        }
    }

    stylesToCSS(styles) {
        return Object.entries(styles || {})
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ');
    }

    makeElementsEditable() {
        document.querySelectorAll('.editable-element').forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectElement(element);
            });
        });
    }

    selectElement(element) {
        // Remove seleção anterior
        this.deselectElement();

        // Seleciona novo elemento
        this.selectedElement = element;
        element.classList.add('selected');

        // Atualiza painel de propriedades
        this.updatePropertiesPanel(element);
    }

    deselectElement() {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
            this.selectedElement = null;
        }

        // Limpa painel de propriedades
        document.getElementById('elementProperties').innerHTML =
            '<p class="text-muted small">Selecione um elemento para editar suas propriedades</p>';
    }

    updatePropertiesPanel(element) {
        const elementId = element.dataset.elementId;
        const elementType = element.dataset.type;

        let html = `
            <div class="mb-3">
                <label class="form-label small">ID do Elemento</label>
                <input type="text" class="form-control form-control-sm" value="${elementId}" readonly>
            </div>
            <div class="mb-3">
                <label class="form-label small">Tipo</label>
                <input type="text" class="form-control form-control-sm" value="${elementType}" readonly>
            </div>
        `;

        if (elementType === 'heading' || elementType === 'paragraph') {
            const textContent = element.querySelector('h1, h2, h3, h4, h5, h6, p')?.textContent || '';
            html += `
                <div class="mb-3">
                    <label class="form-label small">Texto</label>
                    <textarea class="form-control" rows="3" onchange="editor.updateElementText('${elementId}', this.value)">${textContent}</textarea>
                </div>
            `;
        }

        document.getElementById('elementProperties').innerHTML = html;

        // Atualiza controles de estilo
        const computedStyle = window.getComputedStyle(element);
        document.getElementById('textColor').value = this.rgbToHex(computedStyle.color);
        document.getElementById('backgroundColor').value = this.rgbToHex(computedStyle.backgroundColor);
        document.getElementById('fontSize').value = computedStyle.fontSize;
    }

    rgbToHex(rgb) {
        // Converte rgb(r,g,b) para #rrggbb
        const result = rgb.match(/\d+/g);
        if (!result || result.length < 3) return '#000000';

        return '#' + result.slice(0,3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    // Ações do editor
    updateElementText(elementId, newText) {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        if (!element) return;

        const textElement = element.querySelector('h1, h2, h3, h4, h5, h6, p');
        if (textElement) {
            textElement.textContent = newText;
            this.saveState();
            this.updateSlideFromDOM();
        }
    }

    updateElementStyle(property, value) {
        if (!this.selectedElement) return;

        this.selectedElement.style[property] = value;
        this.saveState();
        this.updateSlideFromDOM();
    }

    addTextElement() {
        const elementId = 'text-' + Date.now();
        const newElement = {
            id: elementId,
            type: 'paragraph',
            content: 'Novo texto...',
            styles: {}
        };

        this.slides[this.currentSlideIndex].elements.push(newElement);
        this.renderCurrentSlide();
        this.saveState();
    }

    addImageElement() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const elementId = 'image-' + Date.now();
                    const newElement = {
                        id: elementId,
                        type: 'image',
                        src: e.target.result,
                        alt: file.name,
                        styles: {}
                    };

                    this.slides[this.currentSlideIndex].elements.push(newElement);
                    this.renderCurrentSlide();
                    this.saveState();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    addListElement() {
        const elementId = 'list-' + Date.now();
        const newElement = {
            id: elementId,
            type: 'list',
            listType: 'ul',
            items: ['Item 1', 'Item 2', 'Item 3'],
            styles: {}
        };

        this.slides[this.currentSlideIndex].elements.push(newElement);
        this.renderCurrentSlide();
        this.saveState();
    }

    addNewSlide() {
        const newSlide = {
            id: 'slide-' + (this.slides.length + 1),
            title: `Slide ${this.slides.length + 1}`,
            content: '<h2>Novo Slide</h2><p>Conteúdo...</p>',
            elements: [
                {
                    id: 'title-' + Date.now(),
                    type: 'heading',
                    tag: 'h2',
                    content: 'Novo Slide',
                    styles: {}
                },
                {
                    id: 'content-' + Date.now(),
                    type: 'paragraph',
                    content: 'Conteúdo...',
                    styles: {}
                }
            ]
        };

        this.slides.push(newSlide);
        this.renderSlidesList();
        this.selectSlide(this.slides.length - 1);
        this.saveState();
    }

    duplicateSlide(index) {
        const originalSlide = this.slides[index];
        const duplicatedSlide = JSON.parse(JSON.stringify(originalSlide));
        duplicatedSlide.id = 'slide-' + Date.now();
        duplicatedSlide.title += ' (Cópia)';

        // Atualizar IDs dos elementos
        duplicatedSlide.elements.forEach(element => {
            element.id = element.type + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        });

        this.slides.splice(index + 1, 0, duplicatedSlide);
        this.renderSlidesList();
        this.selectSlide(index + 1);
        this.saveState();
    }

    deleteSlide(index) {
        if (this.slides.length <= 1) {
            alert('Não é possível excluir o último slide!');
            return;
        }

        if (confirm('Tem certeza que deseja excluir este slide?')) {
            this.slides.splice(index, 1);

            if (this.currentSlideIndex >= this.slides.length) {
                this.currentSlideIndex = this.slides.length - 1;
            } else if (this.currentSlideIndex > index) {
                this.currentSlideIndex--;
            }

            this.renderSlidesList();
            this.renderCurrentSlide();
            this.saveState();
        }
    }

    deleteElement(elementIdOrElement) {
        let elementId;
        if (typeof elementIdOrElement === 'string') {
            elementId = elementIdOrElement;
        } else {
            elementId = elementIdOrElement.dataset.elementId;
        }

        const slide = this.slides[this.currentSlideIndex];
        slide.elements = slide.elements.filter(el => el.id !== elementId);

        this.renderCurrentSlide();
        this.deselectElement();
        this.saveState();
    }

    updateSlideFromDOM() {
        // Atualiza o modelo de dados baseado no DOM atual
        const slide = this.slides[this.currentSlideIndex];
        const container = document.getElementById('currentSlideContent');
        slide.content = container.innerHTML;

        // Atualiza também a lista de slides
        this.renderSlidesList();
    }

    loadProfessionalIcons() {
        const iconLibrary = document.getElementById('iconLibrary');

        // Biblioteca de ícones profissionais (usando Font Awesome)
        const professionalIcons = [
            'fa-chart-line', 'fa-chart-bar', 'fa-chart-pie', 'fa-trending-up',
            'fa-briefcase', 'fa-building', 'fa-users', 'fa-handshake',
            'fa-target', 'fa-bullseye', 'fa-lightbulb', 'fa-cog',
            'fa-shield-alt', 'fa-award', 'fa-star', 'fa-medal',
            'fa-dollar-sign', 'fa-credit-card', 'fa-piggy-bank', 'fa-coins',
            'fa-globe', 'fa-network-wired', 'fa-wifi', 'fa-cloud',
            'fa-rocket', 'fa-paper-plane', 'fa-flag', 'fa-compass',
            'fa-calendar', 'fa-clock', 'fa-stopwatch', 'fa-hourglass'
        ];

        const html = professionalIcons.map(icon => `
            <div class="col-3">
                <button class="btn btn-outline-primary btn-sm w-100 p-2"
                        onclick="editor.addIconElement('${icon}')"
                        title="${icon}">
                    <i class="fas ${icon}"></i>
                </button>
            </div>
        `).join('');

        iconLibrary.innerHTML = html;
    }

    addIconElement(iconClass) {
        const elementId = 'icon-' + Date.now();
        const newElement = {
            id: elementId,
            type: 'icon',
            iconClass: iconClass,
            styles: {
                fontSize: '48px',
                color: '#2563EB',
                textAlign: 'center'
            }
        };

        this.slides[this.currentSlideIndex].elements.push(newElement);
        this.renderCurrentSlide();
        this.saveState();
    }

    // Undo/Redo System
    saveState() {
        const state = JSON.parse(JSON.stringify(this.slides));

        // Remove estados futuros se estamos no meio da história
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(state);
        this.historyIndex++;

        // Limita o histórico a 50 estados
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undoAction() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.slides = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.renderSlidesList();
            this.renderCurrentSlide();
        }
    }

    redoAction() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.slides = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.renderSlidesList();
            this.renderCurrentSlide();
        }
    }

    // Save/Export functions
    async savePresentation() {
        const presentationData = {
            id: this.presentationId,
            slides: this.slides,
            htmlContent: this.generateFullHTML()
        };

        try {
            const response = await fetch('/api/presentations/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(presentationData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Apresentação salva com sucesso!', 'success');
                this.presentationId = result.data.id;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showNotification('Erro ao salvar apresentação', 'danger');
        }
    }

    generateFullHTML() {
        // Gera HTML completo da apresentação
        const slidesHTML = this.slides.map(slide => `
            <section class="slide" data-slide-id="${slide.id}">
                ${this.renderSlideForExport(slide)}
            </section>
        `).join('');

        return `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Apresentação Gerada</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
                <style>
                    .slide { min-height: 100vh; padding: 2rem; }
                    .slide:not(:last-child) { page-break-after: always; }
                </style>
            </head>
            <body>
                ${slidesHTML}
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
            </body>
            </html>
        `;
    }

    renderSlideForExport(slide) {
        return slide.elements.map(element => {
            const styles = this.stylesToCSS(element.styles);

            switch (element.type) {
                case 'heading':
                    return `<${element.tag} style="${styles}">${element.content}</${element.tag}>`;
                case 'paragraph':
                    return `<p style="${styles}">${element.content}</p>`;
                case 'image':
                    return `<img src="${element.src}" alt="${element.alt}" style="${styles}" class="img-fluid">`;
                case 'list':
                    const items = element.items.map(item => `<li>${item}</li>`).join('');
                    return `<${element.listType} style="${styles}">${items}</${element.listType}>`;
                case 'icon':
                    return `<div style="${styles}"><i class="fas ${element.iconClass}"></i></div>`;
                default:
                    return `<div style="${styles}">${element.content}</div>`;
            }
        }).join('');
    }

    previewPresentation() {
        const html = this.generateFullHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    downloadPresentation() {
        const html = this.generateFullHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `apresentacao-editada-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Apresentação baixada com sucesso!', 'success');
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
}

// Inicializar o editor
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new PresentationEditor();
});

// Funções globais para compatibilidade com HTML
function savePresentation() {
    window.editor.savePresentation();
}

function previewPresentation() {
    window.editor.previewPresentation();
}

function downloadPresentation() {
    window.editor.downloadPresentation();
}

function undoAction() {
    window.editor.undoAction();
}

function redoAction() {
    window.editor.redoAction();
}

function addNewSlide() {
    window.editor.addNewSlide();
}