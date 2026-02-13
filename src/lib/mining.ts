// =====================================================
// ⛏️ BROWSER MINING INTEGRATION
// =====================================================
// Integrates with CoinImp for browser-based Monero mining
//
// SETUP:
// 1. Sign up at https://coinimp.com
// 2. Create a new site
// 3. Get your site key
// 4. Update config.ts with your site key
// 5. Add the CoinImp script to index.html:
//    <script src="https://www.hostingcloud.racing/oHNi.js"></script>
//
// ⚠️ IMPORTANT: Always ask user permission before mining!
// Mining without consent is illegal in many jurisdictions.

import { CONFIG } from '../config';

const isConfigured = CONFIG.COINIMP_SITE_KEY !== 'YOUR_COINIMP_SITE_KEY';

interface MinerInstance {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
  getHashesPerSecond: () => number;
  getTotalHashes: () => number;
  setThrottle: (throttle: number) => void;
}

let miner: MinerInstance | null = null;

// Initialize the miner
export function initMiner(throttle: number = 0.5): boolean {
  if (!isConfigured) {
    console.log('[Mining] CoinImp not configured. Using simulated mining.');
    return false;
  }

  try {
    const w = window as unknown as Record<string, unknown>;
    const Client = w.Client as { Anonymous: new (key: string, opts?: Record<string, unknown>) => MinerInstance } | undefined;
    
    if (Client) {
      miner = new Client.Anonymous(CONFIG.COINIMP_SITE_KEY, {
        throttle: throttle,
        c: 'w',
      });
      return true;
    }
    return false;
  } catch {
    console.log('[Mining] Failed to initialize CoinImp miner');
    return false;
  }
}

// Start mining
export function startMining(): void {
  if (miner) {
    miner.start();
  }
}

// Stop mining
export function stopMining(): void {
  if (miner) {
    miner.stop();
  }
}

// Check if mining is active
export function isMiningActive(): boolean {
  if (miner) {
    return miner.isRunning();
  }
  return false;
}

// Get current hash rate
export function getHashRate(): number {
  if (miner) {
    return miner.getHashesPerSecond();
  }
  return 0;
}

// Get total hashes mined
export function getTotalHashes(): number {
  if (miner) {
    return miner.getTotalHashes();
  }
  return 0;
}

// Set CPU throttle (0 = full speed, 1 = paused)
export function setThrottle(cpuPercent: number): void {
  // Convert from CPU % to throttle (inverse)
  const throttle = 1 - (cpuPercent / 100);
  if (miner) {
    miner.setThrottle(throttle);
  }
}

// Calculate satoshi reward from hashes
export function hashesToSatoshi(hashes: number): number {
  return Math.floor(hashes / 1000) * CONFIG.REWARDS.MINING_PER_HASH;
}

// Check if real miner is available
export function isRealMinerAvailable(): boolean {
  return isConfigured && miner !== null;
}
