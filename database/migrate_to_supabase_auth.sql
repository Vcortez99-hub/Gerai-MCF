-- Migração para Supabase Auth nativo
-- Execute este script no Supabase SQL Editor

-- 1. Remover tabela users customizada (Supabase Auth gerenciará isso)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS presentations CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Tabela de perfis de usuário (complementa auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255),
    company VARCHAR(255),
    avatar_url VARCHAR(500),
    website VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de apresentações (referencia auth.users)
CREATE TABLE public.presentations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    template_id VARCHAR(255),
    briefing TEXT,
    ai_content JSONB,
    config JSONB,
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'completed',
    slide_count INTEGER DEFAULT 6,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de templates (referencia auth.users)
CREATE TABLE public.templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'custom',
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de configurações de usuário (referencia auth.users)
CREATE TABLE public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    settings JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Índices para performance
CREATE INDEX idx_profiles_updated_at ON public.profiles(updated_at DESC);
CREATE INDEX idx_presentations_user_id ON public.presentations(user_id);
CREATE INDEX idx_presentations_created_at ON public.presentations(created_at DESC);
CREATE INDEX idx_presentations_status ON public.presentations(status);
CREATE INDEX idx_templates_user_id ON public.templates(user_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_is_public ON public.templates(is_public);
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- 8. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers para atualizar updated_at
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_presentations_updated_at
    BEFORE UPDATE ON public.presentations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. RLS (Row Level Security) com auth.uid()
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS usando auth.uid() (funciona com Supabase Auth)
CREATE POLICY "profiles_policy" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "presentations_policy" ON public.presentations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "templates_select_policy" ON public.templates
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "templates_insert_policy" ON public.templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "templates_update_policy" ON public.templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "templates_delete_policy" ON public.templates
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "user_settings_policy" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- 12. Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, created_at)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NOW());

    INSERT INTO public.user_settings (user_id, settings, preferences)
    VALUES (
        NEW.id,
        '{"theme": "light", "language": "pt-BR", "notifications": true}',
        '{"defaultSlideCount": 6, "defaultTone": "professional"}'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Habilitar realtime (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presentations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;