/**
 * CanvaOAuthService - Integração completa com Canva Connect API
 * Docs: https://www.canva.dev/docs/connect/
 * OAuth2: https://www.canva.dev/docs/connect/authentication/oauth-2/
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class CanvaOAuthService {
  constructor() {
    this.baseURL = 'https://api.canva.com/rest/v1';
    this.authURL = 'https://www.canva.com/api/oauth/authorize';
    this.tokenURL = 'https://api.canva.com/rest/v1/oauth/token';

    this.clientId = process.env.CANVA_CLIENT_ID?.trim();
    this.clientSecret = process.env.CANVA_CLIENT_SECRET?.trim();
    this.redirectUri = process.env.CANVA_REDIRECT_URI || 'http://127.0.0.1:3030/api/canva/callback';

    // Validação de credenciais
    if (!this.clientId || !this.clientSecret) {
      console.error('❌ CANVA CREDENTIALS MISSING:');
      console.error('   CANVA_CLIENT_ID:', this.clientId ? `${this.clientId.substring(0, 10)}...` : 'NOT SET');
      console.error('   CANVA_CLIENT_SECRET:', this.clientSecret ? 'SET' : 'NOT SET');
      console.error('   CANVA_REDIRECT_URI:', this.redirectUri);
    } else {
      console.log('✅ Canva OAuth Service initialized:');
      console.log('   Client ID:', `${this.clientId.substring(0, 10)}...`);
      console.log('   Redirect URI:', this.redirectUri);
    }

    // Armazenar token em memória (em produção, use banco de dados)
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Gera URL de autorização OAuth2
   */
  getAuthorizationUrl(userId = 'default') {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Canva credentials not configured. Check CANVA_CLIENT_ID and CANVA_CLIENT_SECRET in .env');
    }

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'design:content:write design:content:read design:meta:read asset:read asset:write folder:read folder:write',
      state: state
    });

    const authUrl = `${this.authURL}?${params.toString()}`;

    console.log('🔗 Canva OAuth URL generated:');
    console.log('   Auth URL:', this.authURL);
    console.log('   Client ID:', this.clientId);
    console.log('   Redirect URI:', this.redirectUri);
    console.log('   Full URL:', authUrl);

    return authUrl;
  }

  /**
   * Troca código OAuth por access token
   */
  async exchangeCodeForToken(code) {
    console.log('🔑 Trocando código OAuth por access token...');

    const response = await fetch(this.tokenURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro ao trocar código:', error);
      throw new Error(`Token Exchange Error: ${error}`);
    }

    const tokenData = await response.json();

    // Armazenar tokens
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

    console.log('✅ Access token obtido com sucesso');

    return tokenData;
  }

  /**
   * Garante que temos token válido
   */
  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('Usuário não autenticado. Execute o fluxo OAuth primeiro.');
    }
  }

  /**
   * Define token manualmente
   */
  setAccessToken(token, refreshToken = null) {
    this.accessToken = token;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + (3600 * 1000);
  }

  /**
   * Cria design de apresentação
   */
  async createDesign(title) {
    await this.ensureValidToken();

    console.log(`🎨 Criando design "${title}"...`);

    const response = await fetch(`${this.baseURL}/designs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        asset_type: 'presentation',
        title: title
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro ao criar design:', error);
      throw new Error(`Create Design Error: ${error}`);
    }

    const design = await response.json();
    console.log(`✅ Design criado: ${design.design.id}`);

    return design.design;
  }

  /**
   * Exporta design como PPTX
   */
  async exportDesignAsPPTX(designId, outputFileName) {
    await this.ensureValidToken();

    console.log(`📥 Exportando design ${designId} como PPTX...`);

    // Iniciar export
    const exportResponse = await fetch(`${this.baseURL}/exports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        design_id: designId,
        format: 'pptx'
      })
    });

    if (!exportResponse.ok) {
      const error = await exportResponse.text();
      throw new Error(`Export Error: ${error}`);
    }

    const exportJob = await exportResponse.json();
    const jobId = exportJob.export.id;

    console.log(`⏳ Export job iniciado: ${jobId}`);

    // Aguardar conclusão
    const downloadUrl = await this.waitForExportCompletion(jobId);

    // Download do arquivo
    console.log(`📥 Baixando PPTX de ${downloadUrl}...`);

    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) {
      throw new Error('Erro ao baixar arquivo exportado');
    }

    const buffer = await fileResponse.buffer();
    const outputPath = path.join(__dirname, '../generated', outputFileName);
    await fs.writeFile(outputPath, buffer);

    console.log(`✅ PPTX salvo: ${outputPath}`);

    return {
      success: true,
      fileName: outputFileName,
      filePath: outputPath,
      url: `/generated/${outputFileName}`,
      designId: designId
    };
  }

  /**
   * Aguarda conclusão do export
   */
  async waitForExportCompletion(exportId, maxRetries = 60) {
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(`${this.baseURL}/exports/${exportId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Get Export Status Error: ${error}`);
      }

      const exportData = await response.json();
      const status = exportData.export.status;

      console.log(`⏳ Export status: ${status}`);

      if (status === 'success') {
        return exportData.export.url;
      } else if (status === 'failed') {
        throw new Error('Export falhou no Canva');
      }
    }

    throw new Error('Timeout aguardando export do Canva');
  }

  /**
   * Gera apresentação completa
   */
  async generatePresentationPPTX(title) {
    console.log('🎨 Gerando apresentação via Canva...');

    const design = await this.createDesign(title);

    const fileName = `canva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pptx`;
    const result = await this.exportDesignAsPPTX(design.id, fileName);

    console.log(`✅ Apresentação gerada via Canva!`);

    return result;
  }
}

module.exports = CanvaOAuthService;
