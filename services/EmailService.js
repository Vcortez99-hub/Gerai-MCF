const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendConfirmationEmail(email, name, confirmationToken) {
    try {
      const confirmationUrl = `${process.env.APP_URL || 'http://localhost:3001'}/confirm-email?token=${confirmationToken}`;

      const htmlContent = this.getConfirmationEmailTemplate(name, confirmationUrl);

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'GerAI-MCF'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: '✨ Confirme seu email - GerAI-MCF',
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de confirmação enviado:', result.messageId);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Erro ao enviar email de confirmação:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, name) {
    try {
      const htmlContent = this.getWelcomeEmailTemplate(name);

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'GerAI-MCF'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: '🎉 Bem-vindo ao GerAI-MCF!',
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de boas-vindas enviado:', result.messageId);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email, name, resetToken) {
    try {
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

      const htmlContent = this.getPasswordResetEmailTemplate(name, resetUrl);

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'GerAI-MCF'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: '🔒 Redefinir sua senha - GerAI-MCF',
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email de reset de senha enviado:', result.messageId);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Erro ao enviar email de reset:', error);
      throw error;
    }
  }

  getConfirmationEmailTemplate(name, confirmationUrl) {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirme seu email - GerAI-MCF</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          margin-top: 40px;
          margin-bottom: 40px;
        }
        .header {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .icon {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px;
          font-size: 2rem;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          margin: 20px 0;
          box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(79, 70, 229, 0.4);
        }
        .footer {
          background: #f8f9fa;
          padding: 30px;
          text-align: center;
          color: #64748B;
          font-size: 0.9rem;
        }
        .footer a {
          color: #4F46E5;
          text-decoration: none;
        }
        h2 {
          color: #0F172A;
          font-size: 1.5rem;
          margin-bottom: 15px;
        }
        p {
          color: #64748B;
          line-height: 1.6;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧠 GerAI-MCF</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Gerador de Apresentações com IA</p>
        </div>

        <div class="content">
          <div class="icon">✨</div>

          <h2>Olá, ${name}!</h2>

          <p>Bem-vindo ao GerAI-MCF! Para começar a criar apresentações incríveis com inteligência artificial, você precisa confirmar seu endereço de email.</p>

          <p>Clique no botão abaixo para ativar sua conta:</p>

          <a href="${confirmationUrl}" class="btn">Confirmar Email</a>

          <p style="font-size: 0.9rem; margin-top: 30px;">
            Se o botão não funcionar, copie e cole este link no seu navegador:<br>
            <a href="${confirmationUrl}" style="color: #4F46E5; word-break: break-all;">${confirmationUrl}</a>
          </p>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #4F46E5;">
            <p style="margin: 0; color: #1e40af;">
              <strong>🚀 O que você pode fazer com o GerAI-MCF:</strong><br>
              • Gerar apresentações personalizadas com IA<br>
              • Preservar sua identidade visual<br>
              • Usar templates profissionais<br>
              • Exportar em múltiplos formatos
            </p>
          </div>
        </div>

        <div class="footer">
          <p>Este email foi enviado para ${email}</p>
          <p>Se você não se cadastrou no GerAI-MCF, pode ignorar este email.</p>
          <p>
            © 2024 GerAI-MCF - Gerador de Apresentações com IA<br>
            <a href="mailto:suporte@gerai-mcf.com">Precisa de ajuda?</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getWelcomeEmailTemplate(name) {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao GerAI-MCF!</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          margin-top: 40px;
          margin-bottom: 40px;
        }
        .header {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          margin: 20px 10px;
        }
        .feature-list {
          text-align: left;
          background: #f8f9fa;
          padding: 30px;
          border-radius: 12px;
          margin: 30px 0;
        }
        .feature-item {
          margin: 15px 0;
          display: flex;
          align-items: center;
        }
        .feature-icon {
          background: #4F46E5;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bem-vindo, ${name}!</h1>
          <p>Sua conta foi ativada com sucesso!</p>
        </div>

        <div class="content">
          <h2>Pronto para criar apresentações incríveis?</h2>

          <p>Agora você tem acesso completo ao GerAI-MCF. Comece criando sua primeira apresentação com inteligência artificial!</p>

          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon">🧠</div>
              <div>
                <strong>IA Avançada</strong><br>
                <small>Claude 3.5 Sonnet para conteúdo personalizado</small>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🎨</div>
              <div>
                <strong>Templates Profissionais</strong><br>
                <small>Preserve sua identidade visual automaticamente</small>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">⚡</div>
              <div>
                <strong>Geração Rápida</strong><br>
                <small>Apresentações prontas em menos de 5 minutos</small>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div>
                <strong>Múltiplos Formatos</strong><br>
                <small>Exporte em HTML, PDF e mais</small>
              </div>
            </div>
          </div>

          <a href="${process.env.APP_URL || 'http://localhost:3001'}" class="btn">Criar Primeira Apresentação</a>
          <a href="${process.env.APP_URL || 'http://localhost:3001'}/dashboard" class="btn">Acessar Dashboard</a>
        </div>

        <div class="footer">
          <p>Precisa de ajuda? Nossa documentação está sempre disponível.</p>
          <p>© 2024 GerAI-MCF - Transformando ideias em apresentações</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getPasswordResetEmailTemplate(name, resetUrl) {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinir senha - GerAI-MCF</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        .header {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          padding: 40px 30px;
          text-align: center;
          color: white;
        }
        .content {
          padding: 40px 30px;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          margin: 20px 0;
        }
        .warning {
          background: #fef3cd;
          border: 1px solid #facc15;
          border-radius: 12px;
          padding: 20px;
          margin: 30px 0;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Redefinir Senha</h1>
          <p>Solicitação de nova senha</p>
        </div>

        <div class="content">
          <h2>Olá, ${name}!</h2>

          <p>Recebemos uma solicitação para redefinir a senha da sua conta no GerAI-MCF.</p>

          <p>Clique no botão abaixo para criar uma nova senha:</p>

          <a href="${resetUrl}" class="btn">Redefinir Senha</a>

          <div class="warning">
            <strong>⚠️ Importante:</strong><br>
            Este link expira em 1 hora por segurança.<br>
            Se você não solicitou esta alteração, ignore este email.
          </div>

          <p style="font-size: 0.9rem;">
            Link alternativo:<br>
            <a href="${resetUrl}" style="word-break: break-all;">${resetUrl}</a>
          </p>
        </div>

        <div class="footer">
          <p>© 2024 GerAI-MCF - Segurança é nossa prioridade</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Conexão SMTP estabelecida com sucesso'
      };
    } catch (error) {
      console.error('Erro na conexão SMTP:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = EmailService;