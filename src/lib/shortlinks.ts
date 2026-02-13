// =====================================================
// 🔗 SHORTLINK INTEGRATION
// =====================================================
// Integrates with ShrinkMe.io and Fc.lc for earning from link visits
//
// SETUP:
// 1. Sign up at https://shrinkme.io (or https://fc.lc)
// 2. Get your API key from Dashboard > API
// 3. Update config.ts with your API key

import { CONFIG } from '../config';

const isConfigured = CONFIG.SHRINKME_API_KEY !== 'YOUR_SHRINKME_API_KEY';

// URLs to shorten (use your own content URLs or partner URLs)
const targetUrls = [
  'https://www.coingecko.com/',
  'https://www.coinmarketcap.com/',
  'https://bitcoin.org/',
  'https://ethereum.org/',
  'https://www.binance.com/',
  'https://www.kraken.com/',
  'https://www.coinbase.com/',
  'https://decrypt.co/',
  'https://www.blockchain.com/',
  'https://defillama.com/',
];

// Generate a shortened link via ShrinkMe API
export async function generateShortLink(): Promise<{ url: string; id: string } | null> {
  const targetUrl = targetUrls[Math.floor(Math.random() * targetUrls.length)];
  
  if (!isConfigured) {
    // Demo mode: return a simulated link
    const id = Math.random().toString(36).substr(2, 8);
    return { url: targetUrl, id };
  }
  
  try {
    const response = await fetch(
      `https://shrinkme.io/api?api=${CONFIG.SHRINKME_API_KEY}&url=${encodeURIComponent(targetUrl)}`
    );
    const data = await response.json();
    
    if (data.status === 'success') {
      return { 
        url: data.shortenedUrl, 
        id: data.id || Math.random().toString(36).substr(2, 8) 
      };
    }
    return null;
  } catch {
    console.log('[ShortLinks] API call failed, using demo mode');
    const id = Math.random().toString(36).substr(2, 8);
    return { url: targetUrl, id };
  }
}

// Open a shortened link in a new tab
export function openShortLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Calculate reward for link completion (varies by difficulty)
export function calculateLinkReward(difficulty: 'easy' | 'medium' | 'hard' | 'premium'): number {
  const base = CONFIG.REWARDS.SHORTLINK;
  switch (difficulty) {
    case 'easy': return base;
    case 'medium': return Math.floor(base * 1.5);
    case 'hard': return Math.floor(base * 2.5);
    case 'premium': return Math.floor(base * 3.75);
    default: return base;
  }
}
