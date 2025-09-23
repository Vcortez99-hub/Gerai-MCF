const { createClient } = require('@supabase/supabase-js');

class SupabaseAuthService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Cliente administrativo para operações backend
    this.adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Middleware para verificar autenticação
  async authMiddleware(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token de acesso requerido'
        });
      }

      const token = authHeader.substring(7);

      const { data: user, error } = await this.supabase.auth.getUser(token);

      if (error || !user.user) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido ou expirado'
        });
      }

      // Adicionar usuário ao request
      req.user = user.user;
      next();
    } catch (error) {
      console.error('Erro no middleware de auth:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  // Obter perfil do usuário
  async getUserProfile(userId) {
    try {
      const { data, error } = await this.adminClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar perfil: ${error.message}`);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar perfil do usuário
  async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await this.adminClient
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter configurações do usuário
  async getUserSettings(userId) {
    try {
      const { data, error } = await this.adminClient
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(`Erro ao buscar configurações: ${error.message}`);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro ao obter configurações:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar configurações do usuário
  async updateUserSettings(userId, settings) {
    try {
      const { data, error } = await this.adminClient
        .from('user_settings')
        .update({ settings })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar configurações: ${error.message}`);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar apresentações do usuário
  async getUserPresentations(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await this.adminClient
        .from('presentations')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Erro ao buscar apresentações: ${error.message}`);
      }

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao obter apresentações:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar apresentação
  async createPresentation(userId, presentationData) {
    try {
      const { data, error } = await this.adminClient
        .from('presentations')
        .insert({
          user_id: userId,
          ...presentationData
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar apresentação: ${error.message}`);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Erro ao criar apresentação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Testar conexão
  async testConnection() {
    try {
      const { data, error } = await this.adminClient
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Erro de conexão: ${error.message}`);
      }

      return {
        success: true,
        message: 'Conexão com Supabase Auth estabelecida com sucesso',
        stats: {
          profiles: data || 0
        }
      };
    } catch (error) {
      console.error('Erro na conexão:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SupabaseAuthService;