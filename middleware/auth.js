const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware para verificar autenticação
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware opcional - continua se não autenticado
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (!error && user) {
        req.user = user;
        req.userId = user.id;
        req.userEmail = user.email;
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    console.warn('Optional auth error:', error);
    next();
  }
};

// Verificar se usuário tem permissão para recurso
const checkResourcePermission = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação requerida',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.userId !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a este recurso',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

// Extrair informações do usuário do token (para uso interno)
const extractUserFromToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return error ? null : user;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
  checkResourcePermission,
  extractUserFromToken,
  supabase
};