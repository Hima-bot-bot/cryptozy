// =====================================================
// 🎁 OFFER WALL INTEGRATION
// =====================================================
// Integrates with CPAGrip and AdGateMedia for offer completions
//
// SETUP:
// 1. Sign up at https://cpagrip.com (or https://adgatemedia.com)
// 2. Create an Offer Wall
// 3. Get your publisher ID and wall ID
// 4. Set up a Postback URL:
//    https://your-site.com/api/postback?user_id={user_id}&amount={payout}&offer={offer_name}&sig={hash}
// 5. Update config.ts with your IDs

import { CONFIG } from '../config';

const isConfigured = CONFIG.CPAGRIP_PUBLISHER_ID !== 'YOUR_CPAGRIP_PUBLISHER_ID';

// Get the offer wall iframe URL for a user
export function getOfferWallUrl(userId: string): string {
  if (!isConfigured) {
    return ''; // No URL in demo mode
  }
  
  return `https://cpagrip.com/show.php?id=${CONFIG.CPAGRIP_WALL_ID}&uid=${userId}`;
}

// Check if offer wall is configured
export function isOfferWallReady(): boolean {
  return isConfigured;
}

// Calculate reward for an offer based on difficulty
export function calculateOfferReward(difficulty: 'easy' | 'medium' | 'hard'): number {
  const base = CONFIG.REWARDS.OFFER_COMPLETION;
  switch (difficulty) {
    case 'easy': return base;
    case 'medium': return Math.floor(base * 3);
    case 'hard': return Math.floor(base * 10);
    default: return base;
  }
}

// In production, offer completions are tracked via Postback URLs
// The server receives a callback from CPAGrip/AdGateMedia when a user completes an offer
// The server then credits the user's balance
//
// Example Postback handler (server-side):
// app.get('/api/postback', async (req, res) => {
//   const { user_id, amount, offer, sig } = req.query;
//   // Verify signature
//   // Credit user balance
//   // Log transaction
//   res.send('OK');
// });
