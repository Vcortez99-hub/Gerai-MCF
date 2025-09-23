const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Supabase URL e Anon Key são obrigatórios');
    }

    // Cliente público (para operações do frontend)
    this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);

    // Cliente de serviço (para operações administrativas)
    if (this.supabaseServiceKey) {
      this.supabaseAdmin = createClient(this.supabaseUrl, this.supabaseServiceKey);
    }
  }

  // Operações de usuário
  async createUser(userData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserByEmail(email) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserById(id) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(id, userData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return { success: false, error: error.message };
    }
  }

  async confirmEmail(token) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          email_confirmed: true,
          email_confirmed_at: new Date().toISOString(),
          confirmation_token: null
        })
        .eq('confirmation_token', token)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao confirmar email:', error);
      return { success: false, error: error.message };
    }
  }

  // Operações de apresentações (com associação ao usuário)
  async createPresentation(userId, presentationData) {
    try {
      const { data, error } = await this.supabase
        .from('presentations')
        .insert([{
          ...presentationData,
          user_id: userId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar apresentação:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserPresentations(userId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar apresentações do usuário:', error);
      return { success: false, error: error.message };
    }
  }

  async deletePresentation(userId, presentationId) {
    try {
      const { data, error } = await this.supabase
        .from('presentations')
        .delete()
        .eq('id', presentationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao deletar apresentação:', error);
      return { success: false, error: error.message };
    }
  }

  // Operações de templates (com associação ao usuário)
  async createTemplate(userId, templateData) {
    try {
      const { data, error } = await this.supabase
        .from('templates')
        .insert([{
          ...templateData,
          user_id: userId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar template:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserTemplates(userId) {
    try {
      const { data, error } = await this.supabase
        .from('templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar templates do usuário:', error);
      return { success: false, error: error.message };
    }
  }

  // Configurações de usuário
  async updateUserSettings(userId, settings) {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .upsert([{
          user_id: userId,
          settings: settings,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserSettings(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return { success: false, error: error.message };
    }
  }

  // Estatísticas
  async getUserStats(userId) {
    try {
      const [presentations, templates] = await Promise.all([
        this.supabase.from('presentations').select('id', { count: 'exact' }).eq('user_id', userId),
        this.supabase.from('templates').select('id', { count: 'exact' }).eq('user_id', userId)
      ]);

      return {
        success: true,
        data: {
          presentations_count: presentations.count || 0,
          templates_count: templates.count || 0
        }
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { success: false, error: error.message };
    }
  }

  // Método para testar conexão
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;
      return { success: true, message: 'Conexão com Supabase estabelecida com sucesso' };
    } catch (error) {
      console.error('Erro de conexão com Supabase:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SupabaseService;