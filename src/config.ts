// =====================================================
// 🔧 CONFIGURATION — EDIT THESE VALUES BEFORE DEPLOYING
// =====================================================

export const CONFIG = {
  // ---- Site Info ----
  SITE_NAME: 'Trustify',
  SITE_URL: 'https://trustify.io',

  // ---- Supabase (Free database + auth) ----
  // Sign up at: https://supabase.com
  // Create a project, then copy URL and anon key from Settings > API
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // ---- FaucetPay (Crypto payouts) ----
  // Sign up at: https://faucetpay.io
  // Get API key from: Dashboard > API
  FAUCETPAY_API_KEY: 'YOUR_FAUCETPAY_API_KEY',

  // ---- Adsterra (Display ads) ----
  // Sign up at: https://adsterra.com
  // Get your publisher ID from dashboard
  ADSTERRA_PUBLISHER_ID: 'YOUR_ADSTERRA_ID',
  ADSTERRA_BANNER_ID: 'YOUR_BANNER_AD_ID',
  ADSTERRA_POPUNDER_ID: 'YOUR_POPUNDER_AD_ID',

  // ---- ShrinkMe (Shortlinks) ----
  // Sign up at: https://shrinkme.io
  // Get API key from: Dashboard > API
  SHRINKME_API_KEY: 'YOUR_SHRINKME_API_KEY',

  // ---- CPAGrip (Offer Wall) ----
  // Sign up at: https://cpagrip.com
  // Get publisher ID and wall ID from dashboard
  CPAGRIP_PUBLISHER_ID: 'YOUR_CPAGRIP_PUBLISHER_ID',
  CPAGRIP_WALL_ID: 'YOUR_CPAGRIP_WALL_ID',

  // ---- CoinImp (Browser Mining) ----
  // Sign up at: https://coinimp.com
  // Get site key from: Sites > Your Site
  COINIMP_SITE_KEY: 'YOUR_COINIMP_SITE_KEY',

  // ---- hCaptcha (Anti-bot) ----
  // Sign up at: https://hcaptcha.com
  // Get site key from: Dashboard > Sitekeys
  HCAPTCHA_SITE_KEY: 'YOUR_HCAPTCHA_SITE_KEY',

  // ---- Rewards (in satoshi: 1 BTC = 100,000,000 satoshi) ----
  REWARDS: {
    AD_VIEW_MIN: 30,       // 30 satoshi per ad view
    AD_VIEW_MAX: 150,      // 150 satoshi for premium ads
    SHORTLINK: 40,         // 40-150 satoshi per link
    OFFER_COMPLETION: 500, // 500-15000 satoshi per offer
    MINING_PER_HASH: 1,    // 1 satoshi per 1000 hashes
    DAILY_BONUS: 100,      // 100 satoshi daily bonus
    REFERRAL_PERCENT: 10,  // 10% referral commission
  },

  // ---- Anti-Fraud ----
  FRAUD: {
    MAX_ACTIONS_PER_MINUTE: 10,
    AD_COOLDOWN_SECONDS: 60,
    LINK_COOLDOWN_SECONDS: 300,
    MIN_WITHDRAWAL_SATOSHI: 50000, // 0.0005 BTC
    MIN_ACCOUNT_AGE_HOURS: 24,
    BLOCK_VPN: true,
  },
} as const;
