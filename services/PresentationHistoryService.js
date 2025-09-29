const { createClient } = require('@supabase/supabase-js');
const path = require('path');

class PresentationHistoryService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Initialize table on startup
    this.initializeTable().catch(error => {
      console.error('Failed to initialize presentation history table:', error);
    });
  }

  async initializeTable() {
    try {
      // Check if table exists by trying to select from it
      const { data, error } = await this.supabase
        .from('presentations')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        console.log('📋 Creating presentations table...');
        await this.createTable();
      } else {
        console.log('📋 presentations table exists');
      }
    } catch (error) {
      console.error('Error checking/creating table:', error);
    }
  }

  async createTable() {
    try {
      // Use raw SQL to create table
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS presentations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL,
            title VARCHAR(255) NOT NULL,
            briefing TEXT NOT NULL,
            template_id VARCHAR(100) NOT NULL,
            template_name VARCHAR(255),
            config JSONB DEFAULT '{}',
            ai_content JSONB NOT NULL,
            generated_file_path VARCHAR(500),
            generated_file_url VARCHAR(500),
            status VARCHAR(50) DEFAULT 'completed',
            generation_time_ms INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_presentations_user_id
            ON presentations(user_id);
          CREATE INDEX IF NOT EXISTS idx_presentations_created_at
            ON presentations(created_at DESC);

          ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Users can view own presentations" ON presentations;
          CREATE POLICY "Users can view own presentations"
            ON presentations FOR ALL
            USING (user_id::text = auth.uid()::text);
        `
      });

      if (error) {
        console.error('Error creating table:', error);
        throw error;
      }

      console.log('✅ presentations table created successfully');
    } catch (error) {
      console.error('Failed to create table:', error);
      // If RPC doesn't exist, create table without RLS for now
      console.log('⚠️ Falling back to basic table creation...');
      await this.createBasicTable();
    }
  }

  async createBasicTable() {
    // Create a basic table for testing
    console.log('📋 Creating basic presentations table...');

    // Try to insert a test record and let the error guide us
    const { error } = await this.supabase
      .from('presentations')
      .insert([{
        user_id: 'test-user-id',
        title: 'Test Presentation',
        briefing: 'Test briefing',
        template_id: 'test-template',
        ai_content: { test: true },
        status: 'completed'
      }]);

    if (error) {
      console.log('📋 Table needs to be created manually in Supabase dashboard');
      console.log('📋 Use the SQL from database/presentations_schema.sql');
    }
  }

  // Salvar apresentação no histórico
  async savePresentation(userId, presentationData) {
    try {
      const {
        title,
        briefing,
        templateId,
        templateName,
        config,
        aiContent,
        generatedFilePath,
        generatedFileUrl,
        generationTimeMs
      } = presentationData;

      const { data, error } = await this.supabase
        .from('presentations')
        .insert([{
          user_id: userId,
          title: title || 'Apresentação Sem Título',
          briefing,
          template_id: templateId,
          template_name: templateName,
          config: config || {},
          ai_content: aiContent,
          generated_file_path: generatedFilePath,
          generated_file_url: generatedFileUrl,
          generation_time_ms: generationTimeMs,
          status: 'completed'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving presentation:', error);
        throw new Error(`Erro ao salvar apresentação: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Save presentation error:', error);
      throw error;
    }
  }

  // Buscar histórico do usuário
  async getUserHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        status = null,
        search = null
      } = options;

      let query = this.supabase
        .from('presentations')
        .select(`
          id,
          title,
          briefing,
          template_id,
          template_name,
          config,
          generated_file_url,
          status,
          generation_time_ms,
          created_at,
          updated_at
        `)
        .eq('user_id', userId);

      // Filtros
      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,briefing.ilike.%${search}%`);
      }

      // Ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching user history:', error);
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      return {
        presentations: data || [],
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Get user history error:', error);
      throw error;
    }
  }

  // Buscar apresentação específica
  async getPresentation(userId, presentationId) {
    try {
      const { data, error } = await this.supabase
        .from('presentations')
        .select('*')
        .eq('user_id', userId)
        .eq('id', presentationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        console.error('Error fetching presentation:', error);
        throw new Error(`Erro ao buscar apresentação: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Get presentation error:', error);
      throw error;
    }
  }

  // Atualizar apresentação
  async updatePresentation(userId, presentationId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('presentations')
        .update(updates)
        .eq('user_id', userId)
        .eq('id', presentationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating presentation:', error);
        throw new Error(`Erro ao atualizar apresentação: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Update presentation error:', error);
      throw error;
    }
  }

  // Deletar apresentação
  async deletePresentation(userId, presentationId) {
    try {
      const { error } = await this.supabase
        .from('presentations')
        .delete()
        .eq('user_id', userId)
        .eq('id', presentationId);

      if (error) {
        console.error('Error deleting presentation:', error);
        throw new Error(`Erro ao deletar apresentação: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Delete presentation error:', error);
      throw error;
    }
  }

  // Buscar estatísticas do usuário
  async getUserStats(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_presentation_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Usuário sem apresentações ainda
          return {
            total_presentations: 0,
            completed_presentations: 0,
            failed_presentations: 0,
            avg_generation_time_ms: 0,
            first_presentation: null,
            last_presentation: null
          };
        }
        console.error('Error fetching user stats:', error);
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }

  // Marcar apresentação como falha
  async markAsFailed(userId, presentationData, errorMessage) {
    try {
      const {
        title,
        briefing,
        templateId,
        templateName,
        config
      } = presentationData;

      const { data, error } = await this.supabase
        .from('presentations')
        .insert([{
          user_id: userId,
          title: title || 'Apresentação (Falha)',
          briefing,
          template_id: templateId,
          template_name: templateName,
          config: config || {},
          ai_content: { error: errorMessage },
          status: 'failed'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error marking as failed:', error);
        throw new Error(`Erro ao registrar falha: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Mark as failed error:', error);
      throw error;
    }
  }

  // Buscar apresentações recentes
  async getRecentPresentations(userId, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from('presentations')
        .select(`
          id,
          title,
          template_name,
          status,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent presentations:', error);
        throw new Error(`Erro ao buscar apresentações recentes: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Get recent presentations error:', error);
      throw error;
    }
  }
}

module.exports = new PresentationHistoryService();