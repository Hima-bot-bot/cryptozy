// =====================================================
// 🛡️ ANTI-FRAUD SYSTEM
// =====================================================
// Protects against bots, multi-accounts, and abuse

import { CONFIG } from '../config';

interface ActionLog {
  timestamp: number;
  type: string;
}

class AntiFraudSystem {
  private actionLog: ActionLog[] = [];
  private cooldowns: Map<string, number> = new Map();
  private fingerprint: string = '';

  constructor() {
    this.fingerprint = this.generateFingerprint();
    this.loadState();
  }

  // Generate a browser fingerprint for tracking
  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fp', 2, 2);
    }
    
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      canvas.toDataURL(),
    ];
    
    // Simple hash
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private loadState() {
    try {
      const saved = localStorage.getItem('tf-fraud-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.cooldowns = new Map(Object.entries(state.cooldowns || {}));
        this.actionLog = state.actionLog || [];
      }
    } catch { /* ignore */ }
  }

  private saveState() {
    try {
      localStorage.setItem('tf-fraud-state', JSON.stringify({
        cooldowns: Object.fromEntries(this.cooldowns),
        actionLog: this.actionLog.slice(-100), // Keep last 100
      }));
    } catch { /* ignore */ }
  }

  // Check if user is a bot
  isBot(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    const botPatterns = ['bot', 'crawl', 'spider', 'headless', 'phantom', 'selenium', 'puppeteer'];
    if (botPatterns.some(p => ua.includes(p))) return true;
    
    // Check for headless browser indicators
    if ((navigator as unknown as Record<string, unknown>).webdriver) return true;
    if (!(window as unknown as Record<string, unknown>).chrome && ua.includes('chrome')) return true;
    
    return false;
  }

  // Check rate limiting
  isRateLimited(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentActions = this.actionLog.filter(a => a.timestamp > oneMinuteAgo);
    return recentActions.length >= CONFIG.FRAUD.MAX_ACTIONS_PER_MINUTE;
  }

  // Check cooldown for a specific action type
  isOnCooldown(actionType: string): boolean {
    const cooldownEnd = this.cooldowns.get(actionType);
    if (!cooldownEnd) return false;
    return Date.now() < cooldownEnd;
  }

  // Get remaining cooldown time in seconds
  getCooldownRemaining(actionType: string): number {
    const cooldownEnd = this.cooldowns.get(actionType);
    if (!cooldownEnd) return 0;
    return Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
  }

  // Log an action and set cooldown
  logAction(actionType: string, cooldownSeconds?: number): { allowed: boolean; reason?: string } {
    // Bot check
    if (this.isBot()) {
      return { allowed: false, reason: 'Automated browsers are not allowed.' };
    }

    // Rate limit check
    if (this.isRateLimited()) {
      return { allowed: false, reason: 'Too many actions. Please wait a moment.' };
    }

    // Cooldown check
    if (this.isOnCooldown(actionType)) {
      const remaining = this.getCooldownRemaining(actionType);
      return { allowed: false, reason: `Please wait ${remaining} seconds before trying again.` };
    }

    // Log the action
    this.actionLog.push({ timestamp: Date.now(), type: actionType });

    // Set cooldown if specified
    if (cooldownSeconds) {
      this.cooldowns.set(actionType, Date.now() + (cooldownSeconds * 1000));
    }

    // Cleanup old entries
    const fiveMinutesAgo = Date.now() - 300000;
    this.actionLog = this.actionLog.filter(a => a.timestamp > fiveMinutesAgo);

    this.saveState();
    return { allowed: true };
  }

  // Check VPN/Proxy (calls free API)
  async checkIP(): Promise<{ isVPN: boolean; country: string }> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        isVPN: data.org?.toLowerCase().includes('vpn') || 
               data.org?.toLowerCase().includes('proxy') || false,
        country: data.country_code || 'XX',
      };
    } catch {
      return { isVPN: false, country: 'XX' };
    }
  }

  // Get device fingerprint
  getFingerprint(): string {
    return this.fingerprint;
  }

  // Clear all state (for logout)
  clear() {
    this.actionLog = [];
    this.cooldowns.clear();
    localStorage.removeItem('tf-fraud-state');
  }
}

// Singleton instance
export const antiFraud = new AntiFraudSystem();
