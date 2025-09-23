const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const SupabaseService = require('./SupabaseService');
const EmailService = require('./EmailService');

class AuthService {
  constructor() {
    this.supabase = new SupabaseService();
    this.emailService = new EmailService();
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // Registrar novo usuário
  async register(userData) {
    try {
      const { name, email, password, company } = userData;

      // Validações básicas
      if (!name || !email || !password) {
        return {
          success: false,
          error: 'Nome, email e senha são obrigatórios'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres'
        };
      }

      // Verificar se o email já existe
      const existingUser = await this.supabase.getUserByEmail(email);
      if (existingUser.success && existingUser.data) {
        return {
          success: false,
          error: 'Este email já está cadastrado'
        };
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Gerar token de confirmação
      const confirmationToken = crypto.randomBytes(32).toString('hex');

      // Criar usuário no banco
      const newUser = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: hashedPassword,
        company: company?.trim() || null,
        email_confirmed: false,
        confirmation_token: confirmationToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await this.supabase.createUser(newUser);

      if (!result.success) {
        return {
          success: false,
          error: 'Erro ao criar usuário: ' + result.error
        };
      }

      // Enviar email de confirmação
      try {
        await this.emailService.sendConfirmationEmail(email, name, confirmationToken);
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação:', emailError);
        // Não falha o cadastro se o email não for enviado
      }

      return {
        success: true,
        message: 'Usuário cadastrado com sucesso! Verifique seu email para confirmar a conta.',
        data: {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          email_confirmed: result.data.email_confirmed
        }
      };

    } catch (error) {
      console.error('Erro no registro:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Login do usuário
  async login(credentials) {
    try {
      const { email, password, rememberMe = false } = credentials;

      if (!email || !password) {
        return {
          success: false,
          error: 'Email e senha são obrigatórios'
        };
      }

      // Buscar usuário por email
      const userResult = await this.supabase.getUserByEmail(email.toLowerCase().trim());

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: 'Email ou senha incorretos'
        };
      }

      const user = userResult.data;

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Email ou senha incorretos'
        };
      }

      // Verificar se o email foi confirmado
      if (!user.email_confirmed) {
        return {
          success: false,
          error: 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
          code: 'EMAIL_NOT_CONFIRMED'
        };
      }

      // Atualizar último login
      await this.supabase.updateUser(user.id, {
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Gerar JWT token
      const tokenExpiration = rememberMe ? '30d' : this.jwtExpiresIn;
      const token = this.generateToken(user.id, tokenExpiration);

      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            company: user.company,
            email_confirmed: user.email_confirmed,
            created_at: user.created_at,
            last_login_at: user.last_login_at
          },
          token,
          expiresIn: tokenExpiration
        }
      };

    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Confirmar email
  async confirmEmail(token) {
    try {
      if (!token) {
        return {
          success: false,
          error: 'Token de confirmação é obrigatório'
        };
      }

      const result = await this.supabase.confirmEmail(token);

      if (!result.success) {
        return {
          success: false,
          error: 'Token inválido ou expirado'
        };
      }

      return {
        success: true,
        message: 'Email confirmado com sucesso! Agora você pode fazer login.',
        data: {
          user: {
            id: result.data.id,
            name: result.data.name,
            email: result.data.email,
            email_confirmed: result.data.email_confirmed
          }
        }
      };

    } catch (error) {
      console.error('Erro na confirmação de email:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Reenviar email de confirmação
  async resendConfirmationEmail(email) {
    try {
      const userResult = await this.supabase.getUserByEmail(email.toLowerCase().trim());

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: 'Email não encontrado'
        };
      }

      const user = userResult.data;

      if (user.email_confirmed) {
        return {
          success: false,
          error: 'Este email já foi confirmado'
        };
      }

      // Gerar novo token
      const confirmationToken = crypto.randomBytes(32).toString('hex');

      // Atualizar token no banco
      await this.supabase.updateUser(user.id, {
        confirmation_token: confirmationToken,
        updated_at: new Date().toISOString()
      });

      // Enviar email
      await this.emailService.sendConfirmationEmail(user.email, user.name, confirmationToken);

      return {
        success: true,
        message: 'Email de confirmação reenviado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  // Verificar token JWT
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const userResult = await this.supabase.getUserById(decoded.userId);

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      return {
        success: true,
        data: {
          user: {
            id: userResult.data.id,
            name: userResult.data.name,
            email: userResult.data.email,
            company: userResult.data.company,
            email_confirmed: userResult.data.email_confirmed
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: 'Token inválido ou expirado'
      };
    }
  }

  // Gerar token JWT
  generateToken(userId, expiresIn = this.jwtExpiresIn) {
    return jwt.sign(
      { userId },
      this.jwtSecret,
      { expiresIn }
    );
  }

  // Middleware de autenticação
  async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de acesso requerido'
        });
      }

      const result = await this.verifyToken(token);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: result.error
        });
      }

      req.user = result.data.user;
      next();

    } catch (error) {
      console.error('Erro na autenticação:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Alterar senha
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const userResult = await this.supabase.getUserById(userId);

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: 'Usuário não encontrado'
        };
      }

      const user = userResult.data;

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Senha atual incorreta'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'A nova senha deve ter pelo menos 6 caracteres'
        };
      }

      // Hash da nova senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha no banco
      await this.supabase.updateUser(userId, {
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Senha alterada com sucesso'
      };

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return {
        success: false,
        error: 'Erro interno do servidor'
      };
    }
  }
}

module.exports = AuthService;