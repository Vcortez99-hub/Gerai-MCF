-- Script para corrigir políticas RLS para funcionar com JWT próprio
-- Execute este script no Supabase SQL Editor

-- Desabilitar RLS temporariamente para permitir operações administrativas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE presentations DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS presentations_policy ON presentations;
DROP POLICY IF EXISTS templates_select_policy ON templates;
DROP POLICY IF EXISTS templates_insert_policy ON templates;
DROP POLICY IF EXISTS templates_update_policy ON templates;
DROP POLICY IF EXISTS templates_delete_policy ON templates;
DROP POLICY IF EXISTS user_settings_policy ON user_settings;

-- Criar função para verificar se é administrador do sistema
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Para permitir operações administrativas via service role
    RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reabilitar RLS com políticas mais permissivas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Política para users - permite operações administrativas
CREATE POLICY users_admin_policy ON users
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Política para presentations - permite operações administrativas
CREATE POLICY presentations_admin_policy ON presentations
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Política para templates - permite operações administrativas
CREATE POLICY templates_admin_policy ON templates
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Política para user_settings - permite operações administrativas
CREATE POLICY user_settings_admin_policy ON user_settings
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);