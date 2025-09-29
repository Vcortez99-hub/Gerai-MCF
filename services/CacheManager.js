/**
 * Cache Manager - Sistema de cache inteligente para otimizar performance
 * Evita reprocessamento desnecessário de análises complexas
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxSize = 500;
    this.maxAge = 15 * 60 * 1000; // 15 minutos

    console.log('💾 CacheManager inicializado');

    // Limpeza automática a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Gera chave única para cache baseada no conteúdo
   */
  generateKey(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Armazena item no cache com timestamp
   */
  set(key, value, customAge = null) {
    // Limpar cache se estiver muito cheio
    if (this.cache.size >= this.maxSize) {
      this.cleanup(true);
    }

    const cacheItem = {
      value,
      timestamp: Date.now(),
      age: customAge || this.maxAge
    };

    this.cache.set(key, cacheItem);
    console.log(`💾 Cache SET: ${key} (size: ${this.cache.size})`);
  }

  /**
   * Recupera item do cache se ainda válido
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    const age = Date.now() - item.timestamp;
    if (age > item.age) {
      this.cache.delete(key);
      console.log(`💾 Cache EXPIRED: ${key}`);
      return null;
    }

    console.log(`💾 Cache HIT: ${key} (age: ${Math.round(age/1000)}s)`);
    return item.value;
  }

  /**
   * Verifica se existe no cache
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove item específico
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`💾 Cache DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Limpeza do cache (remove itens expirados)
   */
  cleanup(force = false) {
    const beforeSize = this.cache.size;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      const age = now - item.timestamp;
      if (force || age > item.age) {
        this.cache.delete(key);
      }
    }

    const afterSize = this.cache.size;
    const cleaned = beforeSize - afterSize;

    if (cleaned > 0) {
      console.log(`💾 Cache CLEANUP: removidos ${cleaned} itens (${afterSize} restantes)`);
    }
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`💾 Cache CLEAR: removidos ${size} itens`);
  }

  /**
   * Estatísticas do cache
   */
  getStats() {
    const now = Date.now();
    const items = Array.from(this.cache.values());

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize * 100).toFixed(1) + '%',
      averageAge: items.length > 0 ?
        Math.round(items.reduce((sum, item) => sum + (now - item.timestamp), 0) / items.length / 1000) + 's' :
        '0s'
    };
  }
}

module.exports = CacheManager;