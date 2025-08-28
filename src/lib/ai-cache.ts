'use client';

/**
 * AI Flow Caching Utility
 * Provides caching and rate limiting for AI flow calls to improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class AIFlowCache {
  private cache = new Map<string, CacheEntry<any>>();
  private rateLimits = new Map<string, RateLimitEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  /**
   * Generate a cache key from function name and parameters
   */
  private generateKey(flowName: string, params: any): string {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${flowName}:${btoa(paramString).slice(0, 32)}`;
  }

  /**
   * Check if rate limit is exceeded
   */
  private isRateLimited(flowName: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(flowName);
    
    if (!entry || now > entry.resetTime) {
      this.rateLimits.set(flowName, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return false;
    }
    
    if (entry.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return true;
    }
    
    entry.count++;
    return false;
  }

  /**
   * Get cached result if available and not expired
   */
  get<T>(flowName: string, params: any): T | null {
    const key = this.generateKey(flowName, params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(flowName: string, params: any, data: T, ttl: number = this.DEFAULT_TTL): void {
    const key = this.generateKey(flowName, params);
    const now = Date.now();
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  /**
   * Wrapper for AI flow calls with caching and rate limiting
   */
  async executeFlow<T>(
    flowName: string,
    flowFunction: () => Promise<T>,
    params: any,
    options: {
      ttl?: number;
      skipCache?: boolean;
      skipRateLimit?: boolean;
    } = {}
  ): Promise<T> {
    const { ttl = this.DEFAULT_TTL, skipCache = false, skipRateLimit = false } = options;

    // Check rate limit
    if (!skipRateLimit && this.isRateLimited(flowName)) {
      throw new Error(`Rate limit exceeded for ${flowName}. Please try again later.`);
    }

    // Check cache first
    if (!skipCache) {
      const cached = this.get<T>(flowName, params);
      if (cached) {
        return cached;
      }
    }

    try {
      // Execute the flow
      const result = await flowFunction();
      
      // Cache the result
      if (!skipCache) {
        this.set(flowName, params, result, ttl);
      }
      
      return result;
    } catch (error: any) {
      // Handle specific AI service errors
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        throw new Error('AI service rate limit exceeded. Please try again later.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        throw new Error('Daily AI usage limit reached. Please try again tomorrow.');
      }
      
      throw error;
    }
  }

  /**
   * Clear expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.rateLimits.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      rateLimitEntries: this.rateLimits.size
    };
  }
}

// Global cache instance
export const aiFlowCache = new AIFlowCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    aiFlowCache.cleanup();
  }, 5 * 60 * 1000);
}

// Helper function for common AI flows
export async function cachedAIFlow<T>(
  flowName: string,
  flowFunction: () => Promise<T>,
  params: any,
  options?: {
    ttl?: number;
    skipCache?: boolean;
  }
): Promise<T> {
  return aiFlowCache.executeFlow(flowName, flowFunction, params, options);
}