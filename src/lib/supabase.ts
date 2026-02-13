// =====================================================
// 📦 SUPABASE CLIENT — Database & Authentication
// =====================================================
// 
// SETUP INSTRUCTIONS:
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project
// 3. Go to Settings > API and copy:
//    - Project URL → paste into config.ts SUPABASE_URL
//    - anon/public key → paste into config.ts SUPABASE_ANON_KEY
// 4. Go to SQL Editor and run the schema below
//
// DATABASE SCHEMA — Copy this into Supabase SQL Editor:
// -------------------------------------------------------
/*
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  balance_satoshi BIGINT DEFAULT 0,
  total_earned_satoshi BIGINT DEFAULT 0,
  referral_code VARCHAR(10) UNIQUE NOT NULL,
  referred_by UUID REFERENCES profiles(id),
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_daily_claim TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL,
  amount_satoshi BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'completed',
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_satoshi BIGINT NOT NULL,
  fee_satoshi BIGINT DEFAULT 0,
  crypto VARCHAR(10) NOT NULL,
  wallet_address TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ad_id TEXT NOT NULL,
  reward_satoshi BIGINT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id),
  referred_id UUID REFERENCES profiles(id),
  commission_earned BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- Users can read their own transactions  
CREATE POLICY "Users read own transactions" ON transactions 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read their own withdrawals
CREATE POLICY "Users read own withdrawals" ON withdrawals 
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    substr(md5(NEW.id::text), 1, 8)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
*/
// -------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

// Check if Supabase is configured
const isConfigured = CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL' && CONFIG.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// Create client (or a dummy if not configured)
export const supabase = isConfigured
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  : null;

export const isSupabaseReady = isConfigured;

// ---- Auth Functions ----

export async function signUp(email: string, password: string, username: string) {
  if (!supabase) return { user: null, error: 'Supabase not configured. Using local mode.' };
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  
  return { user: data?.user ?? null, error: error?.message ?? null };
}

export async function signIn(email: string, password: string) {
  if (!supabase) return { user: null, error: 'Supabase not configured. Using local mode.' };
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user ?? null, error: error?.message ?? null };
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ---- Profile Functions ----

export async function getProfile(userId: string) {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function updateBalance(userId: string, amountSatoshi: number) {
  if (!supabase) return null;
  const { data } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: amountSatoshi
  });
  return data;
}

// ---- Transaction Functions ----

export async function addTransaction(userId: string, type: string, source: string, amountSatoshi: number) {
  if (!supabase) return null;
  const { data } = await supabase.from('transactions').insert({
    user_id: userId,
    type,
    source,
    amount_satoshi: amountSatoshi,
  }).select().single();
  return data;
}

export async function getTransactions(userId: string, limit = 50) {
  if (!supabase) return [];
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ---- Withdrawal Functions ----

export async function requestWithdrawal(userId: string, amountSatoshi: number, crypto: string, walletAddress: string) {
  if (!supabase) return null;
  const { data } = await supabase.from('withdrawals').insert({
    user_id: userId,
    amount_satoshi: amountSatoshi,
    crypto,
    wallet_address: walletAddress,
  }).select().single();
  return data;
}

// ---- Admin Functions ----

export async function getAllUsers() {
  if (!supabase) return [];
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  return data ?? [];
}

export async function getPendingWithdrawals() {
  if (!supabase) return [];
  const { data } = await supabase
    .from('withdrawals')
    .select('*, profiles(username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function processWithdrawal(withdrawalId: string, status: 'approved' | 'rejected') {
  if (!supabase) return null;
  const { data } = await supabase
    .from('withdrawals')
    .update({ status, processed_at: new Date().toISOString() })
    .eq('id', withdrawalId)
    .select()
    .single();
  return data;
}
