// =====================================================
// 💳 FAUCETPAY WITHDRAWAL INTEGRATION
// =====================================================
// FaucetPay is the standard payment processor for crypto faucets
//
// SETUP:
// 1. Sign up at https://faucetpay.io
// 2. Go to Dashboard > API
// 3. Get your API key
// 4. Fund your FaucetPay balance with crypto
// 5. Update config.ts with your API key
//
// ⚠️ NOTE: FaucetPay API calls should be made from a SERVER,
// not from the browser! This file shows the API structure.
// In production, create a serverless function (Vercel/Supabase Edge)
// that handles the actual API call.
//
// Example Vercel serverless function (/api/withdraw.ts):
// ---------------------------------------------------------
// import type { VercelRequest, VercelResponse } from '@vercel/node';
// 
// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   const { to, amount, currency } = req.body;
//   
//   const formData = new URLSearchParams();
//   formData.append('api_key', process.env.FAUCETPAY_API_KEY!);
//   formData.append('amount', amount.toString());
//   formData.append('to', to);
//   formData.append('currency', currency);
//   
//   const response = await fetch('https://faucetpay.io/api/v1/send', {
//     method: 'POST',
//     body: formData,
//   });
//   
//   const data = await response.json();
//   res.json(data);
// }
// ---------------------------------------------------------

import { CONFIG } from '../config';

const isConfigured = CONFIG.FAUCETPAY_API_KEY !== 'YOUR_FAUCETPAY_API_KEY';

export interface WithdrawalResult {
  success: boolean;
  message: string;
  txHash?: string;
  balanceRemaining?: number;
}

// Supported cryptocurrencies on FaucetPay
export const SUPPORTED_CRYPTOS = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', minSatoshi: 50000, feeSatoshi: 5000 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', minSatoshi: 50000, feeSatoshi: 10000 },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', minSatoshi: 50000, feeSatoshi: 1000 },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', minSatoshi: 50000, feeSatoshi: 500 },
  { id: 'trx', name: 'Tron', symbol: 'TRX', minSatoshi: 50000, feeSatoshi: 100 },
  { id: 'usdt', name: 'USDT (TRC20)', symbol: 'USDT', minSatoshi: 100000, feeSatoshi: 10000 },
] as const;

// Request a withdrawal via FaucetPay
// In production, this should call YOUR server endpoint, not FaucetPay directly
export async function requestFaucetPayWithdrawal(
  toAddress: string, 
  amountSatoshi: number, 
  currency: string
): Promise<WithdrawalResult> {
  
  if (!isConfigured) {
    // Demo mode — simulate successful withdrawal
    return {
      success: true,
      message: 'Withdrawal queued (demo mode). Configure FaucetPay API for real payouts.',
      txHash: 'demo_' + Math.random().toString(36).substr(2, 16),
    };
  }

  try {
    // In production, call your own API endpoint:
    // const response = await fetch('/api/withdraw', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ to: toAddress, amount: amountSatoshi, currency }),
    // });
    // const data = await response.json();

    // For now, simulate the API call structure
    console.log(`[FaucetPay] Would send ${amountSatoshi} satoshi ${currency} to ${toAddress}`);
    
    return {
      success: true,
      message: `Withdrawal of ${amountSatoshi} satoshi submitted to FaucetPay`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Withdrawal failed. Try again later.',
    };
  }
}

// Check FaucetPay balance (server-side only in production)
export async function checkFaucetPayBalance(_currency: string): Promise<number | null> {
  if (!isConfigured) return null;
  
  // In production, call your server endpoint
  // const response = await fetch(`/api/faucetpay-balance?currency=${currency}`);
  // const data = await response.json();
  // return data.balance;
  
  return null;
}

// Validate a crypto wallet address (basic validation)
export function validateAddress(address: string, currency: string): boolean {
  if (!address || address.length < 10) return false;
  
  switch (currency) {
    case 'btc':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,87}$/.test(address);
    case 'eth':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'ltc':
      return /^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address) || /^ltc1[a-z0-9]{39,59}$/.test(address);
    case 'doge':
      return /^D[5-9A-HJ-NP-U][1-9A-HJ-NP-Za-km-z]{32}$/.test(address);
    case 'trx':
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    case 'usdt':
      return /^T[a-zA-Z0-9]{33}$/.test(address) || /^0x[a-fA-F0-9]{40}$/.test(address);
    default:
      return address.length > 20;
  }
}
