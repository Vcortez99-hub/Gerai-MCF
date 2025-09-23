const fs = require('fs-extra');
const path = require('path');

class AssetLibrary {
  constructor() {
    this.assetsDir = path.join(__dirname, '..', 'assets');
    this.categories = {
      icons: ['business', 'technology', 'finance', 'security', 'cloud', 'analytics'],
      images: ['corporate', 'team', 'technology', 'growth', 'innovation'],
      graphics: ['charts', 'diagrams', 'infographics', 'timelines'],
      templates: ['headers', 'footers', 'layouts', 'components']
    };

    this.brandingRules = {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545'
      },
      fonts: {
        primary: 'Arial, sans-serif',
        secondary: 'Georgia, serif',
        monospace: 'Courier New, monospace'
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px',
        xlarge: '32px'
      }
    };

    this.initializeAssets();
  }

  async initializeAssets() {
    try {
      await fs.ensureDir(this.assetsDir);

      for (const category of Object.keys(this.categories)) {
        await fs.ensureDir(path.join(this.assetsDir, category));
      }

      await this.createDefaultBrandingAssets();
      await this.createIconLibrary();
      await this.createImagePlaceholders();
    } catch (error) {
      console.error('Erro ao inicializar biblioteca de assets:', error.message);
    }
  }

  async searchAssets(query, category = null, tags = []) {
    try {
      const results = {
        icons: [],
        images: [],
        graphics: [],
        templates: []
      };

      const searchDirs = category ? [category] : Object.keys(this.categories);

      for (const dir of searchDirs) {
        const dirPath = path.join(this.assetsDir, dir);
        if (await fs.pathExists(dirPath)) {
          const files = await fs.readdir(dirPath);

          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const metadata = await this.getAssetMetadata(filePath);

            if (this.matchesSearch(metadata, query, tags)) {
              results[dir].push({
                id: `${dir}_${path.parse(file).name}`,
                name: metadata.name || path.parse(file).name,
                path: filePath,
                url: `/assets/${dir}/${file}`,
                category: dir,
                tags: metadata.tags || [],
                description: metadata.description || '',
                size: metadata.size || 'unknown',
                format: path.extname(file).toLowerCase(),
                createdAt: metadata.createdAt || new Date().toISOString()
              });
            }
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Erro na busca de assets: ${error.message}`);
    }
  }

  matchesSearch(metadata, query, tags) {
    const searchTerm = query.toLowerCase();
    const metaName = (metadata.name || '').toLowerCase();
    const metaDesc = (metadata.description || '').toLowerCase();
    const metaTags = (metadata.tags || []).map(tag => tag.toLowerCase());

    const nameMatch = metaName.includes(searchTerm);
    const descMatch = metaDesc.includes(searchTerm);
    const tagMatch = metaTags.some(tag => tag.includes(searchTerm));
    const specificTags = tags.length === 0 || tags.some(tag =>
      metaTags.includes(tag.toLowerCase())
    );

    return (nameMatch || descMatch || tagMatch) && specificTags;
  }

  async getAssetMetadata(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath, path.extname(filePath));

      const metadataPath = path.join(
        path.dirname(filePath),
        `.${fileName}.metadata.json`
      );

      let metadata = {
        name: fileName,
        createdAt: stats.ctime.toISOString(),
        size: this.formatFileSize(stats.size)
      };

      if (await fs.pathExists(metadataPath)) {
        const fileMetadata = await fs.readJson(metadataPath);
        metadata = { ...metadata, ...fileMetadata };
      }

      return metadata;
    } catch (error) {
      return { name: path.basename(filePath) };
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async createAssetMetadata(filePath, metadata) {
    try {
      const fileName = path.basename(filePath, path.extname(filePath));
      const metadataPath = path.join(
        path.dirname(filePath),
        `.${fileName}.metadata.json`
      );

      await fs.writeJson(metadataPath, {
        ...metadata,
        updatedAt: new Date().toISOString()
      }, { spaces: 2 });

      return metadataPath;
    } catch (error) {
      throw new Error(`Erro ao criar metadata: ${error.message}`);
    }
  }

  async uploadAsset(file, category, metadata = {}) {
    try {
      if (!this.categories[category]) {
        throw new Error(`Categoria inválida: ${category}`);
      }

      const categoryDir = path.join(this.assetsDir, category);
      await fs.ensureDir(categoryDir);

      const fileName = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(categoryDir, fileName);

      await fs.move(file.path, filePath);

      await this.createAssetMetadata(filePath, {
        name: metadata.name || path.parse(file.originalname).name,
        description: metadata.description || '',
        tags: metadata.tags || [],
        category,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });

      return {
        id: `${category}_${path.parse(fileName).name}`,
        path: filePath,
        url: `/assets/${category}/${fileName}`,
        category,
        name: metadata.name || path.parse(file.originalname).name
      };
    } catch (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }
  }

  async createDefaultBrandingAssets() {
    const brandingConfig = {
      name: 'Configuração de Marca Padrão',
      colors: this.brandingRules.colors,
      fonts: this.brandingRules.fonts,
      spacing: this.brandingRules.spacing,
      logo: {
        primary: '/assets/brand/logo-primary.svg',
        secondary: '/assets/brand/logo-secondary.svg',
        icon: '/assets/brand/icon.svg'
      },
      guidelines: {
        logoUsage: 'Logo deve ter espaço mínimo de 2x sua altura',
        colorContrast: 'Manter contraste mínimo de 4.5:1',
        typography: 'Usar hierarquia clara com tamanhos consistentes'
      }
    };

    const brandingPath = path.join(this.assetsDir, 'branding.json');
    await fs.writeJson(brandingPath, brandingConfig, { spaces: 2 });

    await fs.ensureDir(path.join(this.assetsDir, 'brand'));
  }

  async createIconLibrary() {
    const iconSets = {
      business: [
        'chart-bar', 'trend-up', 'target', 'handshake', 'briefcase',
        'users', 'building', 'globe', 'growth', 'analytics'
      ],
      technology: [
        'cloud', 'server', 'database', 'code', 'api',
        'mobile', 'desktop', 'wifi', 'security', 'automation'
      ],
      finance: [
        'dollar-sign', 'calculator', 'credit-card', 'bank',
        'investment', 'savings', 'budget', 'revenue', 'cost', 'roi'
      ]
    };

    for (const [category, icons] of Object.entries(iconSets)) {
      const categoryDir = path.join(this.assetsDir, 'icons', category);
      await fs.ensureDir(categoryDir);

      for (const icon of icons) {
        const svgContent = this.generateIconSVG(icon);
        const iconPath = path.join(categoryDir, `${icon}.svg`);

        await fs.writeFile(iconPath, svgContent);
        await this.createAssetMetadata(iconPath, {
          name: icon.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `Ícone ${icon} para uso em apresentações`,
          tags: [category, icon, 'svg', 'vector'],
          category: 'icons'
        });
      }
    }
  }

  generateIconSVG(iconName) {
    return `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="2" fill="#007bff" fill-opacity="0.1"/>
  <text x="12" y="16" text-anchor="middle" font-family="Arial" font-size="8" fill="#007bff">
    ${iconName.charAt(0).toUpperCase()}
  </text>
  <circle cx="12" cy="8" r="3" stroke="#007bff" stroke-width="1.5" fill="none"/>
</svg>
    `.trim();
  }

  async createImagePlaceholders() {
    const imageCategories = ['corporate', 'team', 'technology', 'charts'];

    for (const category of imageCategories) {
      const categoryDir = path.join(this.assetsDir, 'images', category);
      await fs.ensureDir(categoryDir);

      for (let i = 1; i <= 5; i++) {
        const placeholderPath = path.join(categoryDir, `placeholder-${i}.svg`);
        const placeholderSVG = this.generateImagePlaceholder(category, i);

        await fs.writeFile(placeholderPath, placeholderSVG);
        await this.createAssetMetadata(placeholderPath, {
          name: `${category} Placeholder ${i}`,
          description: `Placeholder para imagens da categoria ${category}`,
          tags: [category, 'placeholder', 'svg'],
          category: 'images'
        });
      }
    }
  }

  generateImagePlaceholder(category, index) {
    const colors = {
      corporate: '#007bff',
      team: '#28a745',
      technology: '#17a2b8',
      charts: '#ffc107'
    };

    const color = colors[category] || '#6c757d';

    return `
<svg width="400" height="300" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="${color}" fill-opacity="0.1"/>
  <rect x="50" y="50" width="300" height="200" stroke="${color}" stroke-width="2" fill="none" stroke-dasharray="5,5"/>
  <text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="16" fill="${color}">
    ${category.toUpperCase()}
  </text>
  <text x="200" y="160" text-anchor="middle" font-family="Arial" font-size="12" fill="${color}">
    Placeholder ${index}
  </text>
  <circle cx="200" cy="110" r="15" stroke="${color}" stroke-width="2" fill="none"/>
</svg>
    `.trim();
  }

  async getBrandingConfig() {
    try {
      const brandingPath = path.join(this.assetsDir, 'branding.json');
      if (await fs.pathExists(brandingPath)) {
        return await fs.readJson(brandingPath);
      }
      return this.brandingRules;
    } catch (error) {
      return this.brandingRules;
    }
  }

  async updateBrandingConfig(config) {
    try {
      const brandingPath = path.join(this.assetsDir, 'branding.json');
      const currentConfig = await this.getBrandingConfig();

      const updatedConfig = {
        ...currentConfig,
        ...config,
        updatedAt: new Date().toISOString()
      };

      await fs.writeJson(brandingPath, updatedConfig, { spaces: 2 });
      return updatedConfig;
    } catch (error) {
      throw new Error(`Erro ao atualizar configuração de marca: ${error.message}`);
    }
  }

  async getRecommendedAssets(context, limit = 6) {
    try {
      const recommendations = [];
      const contextLower = context.toLowerCase();

      if (contextLower.includes('problem') || contextLower.includes('challenge')) {
        recommendations.push(...await this.searchAssets('challenge', 'icons'));
        recommendations.push(...await this.searchAssets('problem', 'images'));
      }

      if (contextLower.includes('solution') || contextLower.includes('innovation')) {
        recommendations.push(...await this.searchAssets('innovation', 'icons'));
        recommendations.push(...await this.searchAssets('technology', 'images'));
      }

      if (contextLower.includes('metric') || contextLower.includes('result')) {
        recommendations.push(...await this.searchAssets('chart', 'graphics'));
        recommendations.push(...await this.searchAssets('analytics', 'icons'));
      }

      if (contextLower.includes('team') || contextLower.includes('collaboration')) {
        recommendations.push(...await this.searchAssets('team', 'images'));
        recommendations.push(...await this.searchAssets('users', 'icons'));
      }

      return recommendations.flat().slice(0, limit);
    } catch (error) {
      return [];
    }
  }
}

module.exports = new AssetLibrary();