// =====================================================
// 📺 AD NETWORK INTEGRATION
// =====================================================
// Integrates with real ad networks for revenue
//
// SETUP:
// 1. Sign up at https://adsterra.com (or https://a-ads.com for instant approval)
// 2. Get your publisher ID and ad unit IDs
// 3. Update config.ts with your IDs
// 4. Add the ad script tags to index.html

import { CONFIG } from '../config';

const isConfigured = CONFIG.ADSTERRA_PUBLISHER_ID !== 'YOUR_ADSTERRA_ID';

// Load Adsterra popunder ad (shows once per session)
export function loadPopunderAd(): void {
  if (!isConfigured) return;
  
  try {
    const script = document.createElement('script');
    script.src = `//www.topcreativeformat.com/${CONFIG.ADSTERRA_POPUNDER_ID}/invoke.js`;
    script.async = true;
    document.body.appendChild(script);
  } catch {
    console.log('[Ads] Popunder ad failed to load');
  }
}

// Load Adsterra banner ad into a container
export function loadBannerAd(containerId: string): void {
  if (!isConfigured) return;
  
  try {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const script = document.createElement('script');
    script.innerHTML = `
      atOptions = {
        'key' : '${CONFIG.ADSTERRA_BANNER_ID}',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;
    container.appendChild(script);
    
    const adScript = document.createElement('script');
    adScript.src = `//www.highperformanceformat.com/${CONFIG.ADSTERRA_BANNER_ID}/invoke.js`;
    container.appendChild(adScript);
  } catch {
    console.log('[Ads] Banner ad failed to load');
  }
}

// Trigger a rewarded ad view (Adsterra interstitial)
export function showRewardedAd(): Promise<boolean> {
  if (!isConfigured) {
    // Simulate ad view for demo/development
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1000);
    });
  }
  
  return new Promise((resolve) => {
    try {
      // Trigger Adsterra Social Bar or Interstitial
      const w = window as unknown as Record<string, unknown>;
      if (typeof w.show_ads === 'function') {
        (w.show_ads as () => void)();
        resolve(true);
      } else {
        // Fallback: open ad in new tab
        window.open(`https://www.adsterra.com/`, '_blank');
        resolve(true);
      }
    } catch {
      resolve(false);
    }
  });
}

// Calculate reward for an ad view
export function calculateAdReward(adType: 'banner' | 'video' | 'premium'): number {
  const base = CONFIG.REWARDS.AD_VIEW_MIN;
  const max = CONFIG.REWARDS.AD_VIEW_MAX;
  
  switch (adType) {
    case 'banner': return base;
    case 'video': return Math.floor(base + (max - base) * 0.5);
    case 'premium': return max;
    default: return base;
  }
}
