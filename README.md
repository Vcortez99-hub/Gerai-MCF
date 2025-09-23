# GerAI-MCF - Gerador de Apresentações com IA

**Gerador de Apresentações Corporativas com Inteligência Artificial**

> Sistema empresarial otimizado para infraestruturas básicas e execução local, que mantém sua identidade visual enquanto acelera a criação de apresentações profissionais.

## 🚀 Características Principais

### ✅ Core Features (Implementados)
- **Templates Inteligentes**: Sistema modular (agenda, problema, solução, métricas, etc.)
- **IA Avançada**: Geração de conteúdo via OpenAI ou Ollama local
- **Biblioteca de Assets**: Ícones, imagens e gráficos organizados por categoria
- **Padronização Automática**: Preserva logos, cores e identidade visual
- **Pitch Decks Prontos**: Estruturas pré-aprovadas para casos comuns

### 🔧 Productivity Features
- **Briefing Inteligente**: IA gera apresentações a partir de texto simples
- **Export Múltiplo**: HTML, PDF (vídeo em desenvolvimento)
- **Interface Responsiva**: Funciona em desktop, tablet e mobile
- **Busca de Assets**: Biblioteca pesquisável por palavra-chave

### 🏢 Governance Features
- **Controle de Marca**: Proteção automática de elementos corporativos
- **Templates Corporativos**: Estruturas padronizadas da empresa
- **Normalização**: Botão para aplicar padrões visuais automaticamente

## 📋 Requisitos do Sistema

### Mínimos
- **Node.js**: 16.0.0+
- **RAM**: 512MB
- **Disco**: 100MB
- **Processador**: Dual-core 1.5GHz

### Recomendados para Produção
- **RAM**: 2GB+
- **Disco**: 1GB+ (para assets e apresentações)
- **Processador**: Quad-core 2.0GHz+

## 🛠️ Instalação e Configuração

### 1. Clone o Projeto
\`\`\`bash
git clone <repository-url>
cd GerAI-MCF
\`\`\`

### 2. Instale Dependências
\`\`\`bash
npm install
\`\`\`

### 3. Configure Variáveis de Ambiente
\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo `.env`:

#### Para uso com OpenAI (Recomendado)
\`\`\`env
AI_PROVIDER=openai
OPENAI_API_KEY=sua_chave_openai
OPENAI_MODEL=gpt-4o-mini
\`\`\`

#### Para uso Local com Ollama
\`\`\`env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
\`\`\`

### 4. Inicie o Servidor
\`\`\`bash
# Desenvolvimento
npm run dev

# Produção
npm start
\`\`\`

### 5. Acesse a Aplicação
- **Interface Web**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health

## 🎯 Como Usar

### 1. **Configure sua Empresa**
- Nome da empresa
- Público-alvo (executivos, técnicos, comercial)
- Duração da apresentação
- Tom desejado

### 2. **Escreva um Briefing Detalhado**
Exemplo:
\`\`\`
"Precisamos apresentar nossa nova solução de automação para CTOs de grandes empresas.
O problema: processos manuais que consomem 40% do tempo da equipe.
Nossa solução: plataforma de automação que reduz esse tempo em 80%.
Queremos mostrar cases de sucesso e ROI de 300% em 6 meses."
\`\`\`

### 3. **Escolha um Template**
- Templates modulares pré-configurados
- Pitch decks para vendas, onboarding, relatórios
- Preservação automática da identidade visual

### 4. **Gere e Exporte**
- IA cria conteúdo personalizado
- Export em HTML/PDF
- Controles de apresentação integrados

## 🏗️ Arquitetura do Sistema

### Backend (Node.js + Express)
\`\`\`
📁 services/
├── TemplateService.js    # Gestão de templates inteligentes
├── AIService.js          # Integração OpenAI/Ollama
├── AssetLibrary.js       # Biblioteca de assets corporativos
└── PresentationService.js # Geração e processamento
\`\`\`

### Frontend (Vanilla JS + Bootstrap)
\`\`\`
📁 public/
├── index.html           # Interface principal
├── app.js              # Lógica da aplicação
└── assets/             # Recursos estáticos
\`\`\`

### Diretórios de Dados
\`\`\`
📁 templates/           # Templates HTML reutilizáveis
📁 assets/             # Biblioteca de recursos
├── icons/            # Ícones categorizados
├── images/           # Imagens e placeholders
└── branding.json     # Configurações de marca
📁 generated/          # Apresentações geradas
📁 uploads/           # Uploads temporários
\`\`\`

## 🔌 API Endpoints

### Core
- `GET /api/health` - Status do sistema
- `GET /api/templates` - Lista templates disponíveis
- `POST /api/upload-template` - Upload de template customizado

### Geração
- `POST /api/generate-presentation` - Gera apresentação via IA
- `POST /api/export-pdf` - Exporta para PDF

### Assets
- `GET /assets/:category/:file` - Serve assets estáticos
- `GET /generated/:file` - Serve apresentações geradas

## 🎨 Customização de Templates

### Marcadores Especiais
Os templates usam atributos especiais para IA:

\`\`\`html
<!-- Módulos identificados automaticamente -->
<section data-module="problema">
  <h1 data-ai-role="title">Título será gerado pela IA</h1>
  <p data-ai-role="description">Conteúdo gerado automaticamente</p>
  <ul data-ai-role="list">Bullets serão criados aqui</ul>
</section>

<!-- Preservação de marca -->
<img src="logo.png" class="preserve-brand" data-preserve="true">

<!-- Placeholder para imagens dinâmicas -->
<img data-placeholder="{{dynamic_image}}" data-ai-search="true">
\`\`\`

### Tipos de Módulos Suportados
- `agenda` - Estrutura da apresentação
- `problema` - Contexto e desafios
- `solucao` - Proposta de valor
- `comparativo` - Análise competitiva
- `cases` - Histórias de sucesso
- `metricas` - Resultados e KPIs
- `conclusao` - Call-to-action

## 🚀 Deploy e Produção

### Docker (Recomendado)
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Deploy Local
\`\`\`bash
# Instalar dependências de produção
npm ci --only=production

# Configurar variáveis de ambiente
export NODE_ENV=production
export PORT=3000

# Iniciar
npm start
\`\`\`

### Deploy VPS/Cloud
- **Mínimo**: 1 vCPU, 1GB RAM
- **Recomendado**: 2 vCPU, 2GB RAM
- **Armazenamento**: 10GB+ (para assets)

## 🔧 Configurações Avançadas

### Ollama Local (Para máxima privacidade)
\`\`\`bash
# Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Baixar modelo (exemplo)
ollama pull llama3.1:8b

# Configurar no .env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
\`\`\`

### Configuração de Proxy/CDN
\`\`\`nginx
# nginx.conf
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
\`\`\`

## 🔐 Segurança

### Configurações Importantes
- **API Keys**: Nunca commitar no código
- **File Upload**: Validação de tipos permitidos
- **Rate Limiting**: Implementado para endpoints de IA
- **Sanitização**: Inputs são sanitizados antes do processamento

### Backup e Recuperação
\`\`\`bash
# Backup de templates e assets
tar -czf backup-$(date +%Y%m%d).tar.gz templates/ assets/ generated/

# Restauração
tar -xzf backup-20241201.tar.gz
\`\`\`

## 📊 Monitoramento

### Logs Importantes
- **Geração de Apresentações**: Tempo de processamento
- **Uso de IA**: Tokens consumidos
- **Assets**: Requests e performance
- **Erros**: Stack traces para debug

### Métricas Úteis
- Apresentações geradas por dia
- Templates mais utilizados
- Tempo médio de geração
- Taxa de erro da IA

## 🔮 Roadmap Futuro

### Próximas Features
- [ ] **Colaboração em Tempo Real** (Socket.io)
- [ ] **Integração com Dados** (Excel, Google Sheets, APIs)
- [ ] **Analytics Avançado** (Dashboards de uso)
- [ ] **Marketplace de Templates** (Compartilhamento interno)
- [ ] **Assistente de Apresentação** (Feedback de IA)
- [ ] **Export para Vídeo** (Apresentações animadas)

### Integrações Planejadas
- **Power BI / Looker**: Gráficos automáticos
- **Slack / Teams**: Notificações
- **Google Drive / OneDrive**: Sincronização
- **Figma**: Import de designs

## 🤝 Contribuição

### Estrutura de Contribuição
1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente com testes
4. Faça commit seguindo padrões
5. Abra um Pull Request

### Padrões de Code
- **ESLint**: Para consistência de código
- **Prettier**: Para formatação
- **Conventional Commits**: Para mensagens

## 📞 Suporte

### Documentação
- **API Docs**: `/docs` (em desenvolvimento)
- **Guias**: Wiki do repositório
- **FAQ**: Issues marcadas como FAQ

### Contato
- **Issues**: Para bugs e features
- **Discussions**: Para dúvidas gerais
- **Wiki**: Para documentação extendida

---

**GerAI-MCF** - Transformando briefings em apresentações profissionais com o poder da IA, mantendo sua identidade visual intacta.

*Sistema otimizado para empresas que valorizam eficiência, qualidade e controle.*