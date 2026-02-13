import { useState, useEffect, useCallback } from 'react';

// ============================================
// TYPES
// ============================================
type Page = 'dashboard' | 'ads' | 'links' | 'offers' | 'mining' | 'withdraw' | 'referrals';

interface Transaction {
  id: string;
  type: 'earn' | 'withdraw' | 'bonus';
  amount: number;
  description: string;
  timestamp: Date;
}

interface Ad {
  id: string;
  title: string;
  reward: number;
  duration: number;
  type: 'video' | 'banner' | 'interactive';
  completed: boolean;
}

interface ShortLink {
  id: string;
  title: string;
  reward: number;
  steps: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  cooldown: number;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  reward: number;
  provider: string;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
}

// ============================================
// HOOKS
// ============================================
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// ============================================
// LOGO COMPONENT - Clean Geometric Hexagon
// ============================================
const CryptozyLogo = ({ size = 48 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 56 56" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <defs>
      {/* Main gradient */}
      <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      
      {/* Shine gradient */}
      <linearGradient id="shineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.4" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      
      {/* Glow filter */}
      <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8b5cf6" floodOpacity="0.5" />
      </filter>
    </defs>
    
    {/* Hexagon background */}
    <g filter="url(#logoGlow)">
      <polygon 
        points="28,4 50,16 50,40 28,52 6,40 6,16" 
        fill="url(#hexGrad)"
      />
    </g>
    
    {/* Inner hexagon border */}
    <polygon 
      points="28,8 46,18 46,38 28,48 10,38 10,18" 
      fill="none"
      stroke="white"
      strokeWidth="1"
      opacity="0.25"
    />
    
    {/* Glass shine on top half */}
    <polygon 
      points="28,4 50,16 50,28 6,28 6,16" 
      fill="url(#shineGrad)"
    />
    
    {/* Stylized C letter */}
    <path
      d="M35 18C35 18 31 15 26 15C20 15 15 21 15 28C15 35 20 41 26 41C31 41 35 38 35 38"
      stroke="white"
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
    
    {/* Accent nodes */}
    <circle cx="40" cy="22" r="3" fill="white" opacity="0.9" />
    <circle cx="42" cy="32" r="2.5" fill="white" opacity="0.7" />
    <circle cx="38" cy="40" r="2" fill="white" opacity="0.5" />
  </svg>
);

// Logo Text Component
const CryptozyText = ({ size = '1.5rem' }: { size?: string }) => (
  <span style={{
    background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(168, 85, 247))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 700,
    fontSize: size,
    letterSpacing: '-0.5px',
    fontFamily: '"Space Grotesk", sans-serif',
  }}>
    Cryptozy
  </span>
);

// ============================================
// MAIN APP
// ============================================
export default function App() {
  // Theme
  const [isDark, setIsDark] = useLocalStorage('theme-dark', true);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('is-logged-in', false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  
  // App State
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balance, setBalance] = useLocalStorage('user-balance', 0.00012450);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Daily Bonus
  const [lastClaim, setLastClaim] = useLocalStorage<number | null>('last-claim', null);
  const [streak, setStreak] = useLocalStorage('streak', 0);
  const [showBonusWheel, setShowBonusWheel] = useState(false);
  const [wheelResult, setWheelResult] = useState<number | null>(null);
  const [timeUntilClaim, setTimeUntilClaim] = useState<string>('');
  const [canClaim, setCanClaim] = useState(false);
  
  // Watch Ads
  const [ads] = useState<Ad[]>([
    { id: '1', title: 'Premium Video Ad', reward: 150, duration: 30, type: 'video', completed: false },
    { id: '2', title: 'Interactive Survey', reward: 200, duration: 45, type: 'interactive', completed: false },
    { id: '3', title: 'Brand Showcase', reward: 100, duration: 20, type: 'banner', completed: false },
    { id: '4', title: 'Game Trailer', reward: 180, duration: 35, type: 'video', completed: false },
    { id: '5', title: 'Product Demo', reward: 250, duration: 60, type: 'interactive', completed: false },
    { id: '6', title: 'Quick Ad', reward: 80, duration: 15, type: 'banner', completed: false },
  ]);
  const [watchingAd, setWatchingAd] = useState<Ad | null>(null);
  const [adProgress, setAdProgress] = useState(0);
  const [completedAds, setCompletedAds] = useLocalStorage<string[]>('completed-ads', []);
  
  // Short Links
  const [links] = useState<ShortLink[]>([
    { id: '1', title: 'CryptoNews Daily', reward: 50, steps: 3, difficulty: 'easy', completed: false, cooldown: 0 },
    { id: '2', title: 'Tech Updates', reward: 75, steps: 4, difficulty: 'medium', completed: false, cooldown: 0 },
    { id: '3', title: 'Finance Hub', reward: 100, steps: 5, difficulty: 'hard', completed: false, cooldown: 0 },
    { id: '4', title: 'Gaming Portal', reward: 60, steps: 3, difficulty: 'easy', completed: false, cooldown: 0 },
    { id: '5', title: 'Social Media', reward: 85, steps: 4, difficulty: 'medium', completed: false, cooldown: 0 },
    { id: '6', title: 'Premium Content', reward: 120, steps: 5, difficulty: 'hard', completed: false, cooldown: 0 },
  ]);
  const [activeLink, setActiveLink] = useState<ShortLink | null>(null);
  const [linkStep, setLinkStep] = useState(0);
  const [completedLinks, setCompletedLinks] = useLocalStorage<string[]>('completed-links', []);
  
  // Offers
  const [offers] = useState<Offer[]>([
    { id: '1', title: 'Complete Survey', description: 'Answer 10 questions about shopping habits', reward: 500, provider: 'SurveyTime', difficulty: 'easy', completed: false },
    { id: '2', title: 'Install App', description: 'Download and open the mobile game', reward: 750, provider: 'GameHub', difficulty: 'medium', completed: false },
    { id: '3', title: 'Sign Up Bonus', description: 'Create account on partner site', reward: 300, provider: 'CryptoExchange', difficulty: 'easy', completed: false },
    { id: '4', title: 'Watch & Earn', description: 'Watch 5 promotional videos', reward: 400, provider: 'AdNetwork', difficulty: 'easy', completed: false },
    { id: '5', title: 'Refer Friends', description: 'Invite 3 friends to join', reward: 1000, provider: 'Referral', difficulty: 'hard', completed: false },
    { id: '6', title: 'Premium Task', description: 'Complete verification process', reward: 1500, provider: 'Identity', difficulty: 'hard', completed: false },
  ]);
  const [completedOffers, setCompletedOffers] = useLocalStorage<string[]>('completed-offers', []);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);
  
  // Mining
  const [isMining, setIsMining] = useState(false);
  const [hashRate, setHashRate] = useState(0);
  const [miningEarnings, setMiningEarnings] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(50);
  
  // Withdraw
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  
  // Admin
  const [, setLogoClicks] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);
  
  // Daily bonus timer
  useEffect(() => {
    const checkClaimStatus = () => {
      if (!lastClaim) {
        setCanClaim(true);
        setTimeUntilClaim('');
        return;
      }
      
      const now = Date.now();
      const timeSince = now - lastClaim;
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours
      
      if (timeSince >= cooldown) {
        setCanClaim(true);
        setTimeUntilClaim('');
      } else {
        setCanClaim(false);
        const remaining = cooldown - timeSince;
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
        setTimeUntilClaim(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    checkClaimStatus();
    const interval = setInterval(checkClaimStatus, 1000);
    return () => clearInterval(interval);
  }, [lastClaim]);
  
  // Mining effect
  useEffect(() => {
    if (!isMining) {
      setHashRate(0);
      return;
    }
    
    const interval = setInterval(() => {
      const rate = (cpuUsage / 100) * (Math.random() * 20 + 30);
      setHashRate(rate);
      const earned = rate * 0.0000001;
      setMiningEarnings(prev => prev + earned);
      setBalance(prev => prev + earned);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isMining, cpuUsage, setBalance]);
  
  // Notification auto-hide
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ============================================
  // HANDLERS
  // ============================================
  
  const showNotification = (message: string) => {
    setNotification(message);
  };
  
  const addTransaction = (type: 'earn' | 'withdraw' | 'bonus', amount: number, description: string) => {
    const tx: Transaction = {
      id: Date.now().toString(),
      type,
      amount,
      description,
      timestamp: new Date()
    };
    setTransactions(prev => [tx, ...prev].slice(0, 50));
  };
  
  const handleAuth = () => {
    if (authMode === 'login') {
      if (authEmail && authPassword) {
        setIsLoggedIn(true);
        setShowAuthModal(false);
        showNotification('Welcome back! 🎉');
      }
    } else {
      if (authEmail && authPassword && authUsername) {
        setIsLoggedIn(true);
        setShowAuthModal(false);
        showNotification('Account created! 🚀');
      }
    }
  };
  
  const handleClaimBonus = () => {
    if (!canClaim) return;
    setShowBonusWheel(true);
  };
  
  const spinWheel = () => {
    const multipliers = [1, 1.5, 2, 1, 2.5, 1.5, 3, 1, 1.5, 5];
    const result = multipliers[Math.floor(Math.random() * multipliers.length)];
    setWheelResult(result);
    
    setTimeout(() => {
      const baseReward = 100;
      const streakMultiplier = Math.min(1 + (streak * 0.1), 3);
      const finalReward = Math.floor(baseReward * streakMultiplier * result);
      const satoshis = finalReward / 100000000;
      
      setBalance(prev => prev + satoshis);
      setLastClaim(Date.now());
      setStreak(prev => prev + 1);
      addTransaction('bonus', satoshis, `Daily bonus (${result}x multiplier)`);
      showNotification(`+${finalReward} sats! 🎉`);
      
      setTimeout(() => {
        setShowBonusWheel(false);
        setWheelResult(null);
      }, 2000);
    }, 3000);
  };
  
  const handleWatchAd = (ad: Ad) => {
    if (completedAds.includes(ad.id)) return;
    setWatchingAd(ad);
    setAdProgress(0);
    
    const interval = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / ad.duration);
      });
    }, 1000);
  };
  
  const completeAd = () => {
    if (!watchingAd) return;
    const satoshis = watchingAd.reward / 100000000;
    setBalance(prev => prev + satoshis);
    setCompletedAds(prev => [...prev, watchingAd.id]);
    addTransaction('earn', satoshis, `Watched: ${watchingAd.title}`);
    showNotification(`+${watchingAd.reward} sats! 🎬`);
    setWatchingAd(null);
    setAdProgress(0);
  };
  
  const handleStartLink = (link: ShortLink) => {
    if (completedLinks.includes(link.id)) return;
    setActiveLink(link);
    setLinkStep(1);
  };
  
  const handleNextLinkStep = () => {
    if (!activeLink) return;
    if (linkStep >= activeLink.steps) {
      const satoshis = activeLink.reward / 100000000;
      setBalance(prev => prev + satoshis);
      setCompletedLinks(prev => [...prev, activeLink.id]);
      addTransaction('earn', satoshis, `Completed: ${activeLink.title}`);
      showNotification(`+${activeLink.reward} sats! 🔗`);
      setActiveLink(null);
      setLinkStep(0);
    } else {
      setLinkStep(prev => prev + 1);
    }
  };
  
  const handleCompleteOffer = (offer: Offer) => {
    if (completedOffers.includes(offer.id)) return;
    setProcessingOffer(offer.id);
    
    setTimeout(() => {
      const satoshis = offer.reward / 100000000;
      setBalance(prev => prev + satoshis);
      setCompletedOffers(prev => [...prev, offer.id]);
      addTransaction('earn', satoshis, `Offer: ${offer.title}`);
      showNotification(`+${offer.reward} sats! 🎁`);
      setProcessingOffer(null);
    }, 2000);
  };
  
  const handleWithdraw = () => {
    if (!withdrawAmount || !walletAddress) return;
    const amount = parseFloat(withdrawAmount);
    if (amount > balance) {
      showNotification('Insufficient balance! ❌');
      return;
    }
    
    setBalance(prev => prev - amount);
    addTransaction('withdraw', -amount, `Withdraw to ${selectedCrypto}`);
    showNotification('Withdrawal submitted! 💸');
    setShowWithdrawConfirm(false);
    setWithdrawAmount('');
    setWalletAddress('');
  };
  
  const handleLogoClick = () => {
    setLogoClicks(prev => {
      if (prev >= 4) {
        setShowAdminLogin(true);
        return 0;
      }
      return prev + 1;
    });
    
    setTimeout(() => setLogoClicks(0), 2000);
  };
  
  const handleAdminLogin = () => {
    if (adminPassword === 'admin@2024') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    }
  };

  // ============================================
  // RIPPLE EFFECT
  // ============================================
  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  // ============================================
  // LANDING PAGE
  // ============================================
  if (!isLoggedIn) {
    return (
      <div className={isDark ? '' : 'light'}>
        <div className="landing-hero">
          {/* Background Orbs */}
          <div className="bg-orbs">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
          </div>
          
          {/* Header */}
          <header className="landing-header">
            <div className="flex items-center gap-md">
              <CryptozyLogo size={44} />
              <CryptozyText size="1.5rem" />
            </div>
            <div className="flex items-center gap-md">
              <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
                <div className="theme-toggle-knob">{isDark ? '🌙' : '☀️'}</div>
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              >
                Sign In
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              >
                Get Started
              </button>
            </div>
          </header>
          
          {/* Hero Content */}
          <div className="landing-content">
            <div className="landing-badge">
              <span>🔥</span>
              <span>Earn up to 0.001 BTC daily</span>
            </div>
            
            <h1 className="landing-title">
              <span className="text-gradient">Earn Crypto</span>
              <br />
              While You Browse
            </h1>
            
            <p className="landing-subtitle">
              Watch ads, complete tasks, mine crypto — all from your browser. 
              Join 150,000+ users earning cryptocurrency every day.
            </p>
            
            <div className="flex gap-md">
              <button 
                className="btn btn-primary btn-lg animate-pulse-glow"
                onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              >
                Start Earning Now →
              </button>
              <button className="btn btn-secondary btn-lg">
                Learn More
              </button>
            </div>
            
            <div className="landing-stats">
              <div className="landing-stat">
                <div className="landing-stat-value">150K+</div>
                <div className="landing-stat-label">Active Users</div>
              </div>
              <div className="landing-stat">
                <div className="landing-stat-value">5.2 BTC</div>
                <div className="landing-stat-label">Paid Out</div>
              </div>
              <div className="landing-stat">
                <div className="landing-stat-value">98%</div>
                <div className="landing-stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth Modal */}
        {showAuthModal && (
          <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
                <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="flex flex-col gap-lg">
                  {authMode === 'signup' && (
                    <div className="input-group">
                      <label className="input-label">Username</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Choose a username"
                        value={authUsername}
                        onChange={e => setAuthUsername(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="Enter your email"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Enter your password"
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary btn-lg w-full" onClick={handleAuth}>
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <span 
                      style={{ color: 'var(--accent-primary)', cursor: 'pointer' }}
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    >
                      {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // ADMIN DASHBOARD
  // ============================================
  if (isAdmin) {
    return (
      <div className={isDark ? '' : 'light'}>
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 'var(--space-xl)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xl)' }}>
              <h1 className="font-display" style={{ fontSize: '1.5rem' }}>🔐 Admin Dashboard</h1>
              <button className="btn btn-secondary" onClick={() => setIsAdmin(false)}>Exit Admin</button>
            </div>
            
            <div className="grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="stat-card">
                <div className="stat-card-icon">👥</div>
                <div className="stat-card-value">1,234</div>
                <div className="stat-card-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">📊</div>
                <div className="stat-card-value">567</div>
                <div className="stat-card-label">Active Today</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">💰</div>
                <div className="stat-card-value">0.45 BTC</div>
                <div className="stat-card-label">Total Balance</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon">📤</div>
                <div className="stat-card-value">12</div>
                <div className="stat-card-label">Pending Withdrawals</div>
              </div>
            </div>
            
            <div className="glass-card-static" style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-md)' }}>Recent Users</h3>
              <div className="flex flex-col gap-sm">
                {['user123', 'cryptofan', 'btclover', 'satoshi99'].map((user, i) => (
                  <div key={i} className="task-card">
                    <div className="task-icon">👤</div>
                    <div className="task-info">
                      <div className="task-title">{user}</div>
                      <div className="task-meta">Joined {i + 1} hours ago</div>
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN APP
  // ============================================
  const navItems = [
    { id: 'dashboard' as Page, icon: '🏠', label: 'Dashboard' },
    { id: 'ads' as Page, icon: '🎬', label: 'Watch Ads', badge: ads.filter(a => !completedAds.includes(a.id)).length },
    { id: 'links' as Page, icon: '🔗', label: 'Short Links', badge: links.filter(l => !completedLinks.includes(l.id)).length },
    { id: 'offers' as Page, icon: '🎁', label: 'Offers', badge: offers.filter(o => !completedOffers.includes(o.id)).length },
    { id: 'mining' as Page, icon: '⛏️', label: 'Mining', badge: isMining ? '●' : undefined },
    { id: 'withdraw' as Page, icon: '💳', label: 'Withdraw' },
    { id: 'referrals' as Page, icon: '👥', label: 'Referrals' },
  ];

  return (
    <div className={isDark ? '' : 'light'}>
      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          {/* Logo */}
          <div className="sidebar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <CryptozyLogo size={44} />
            <CryptozyText size="1.5rem" />
          </div>
          
          {/* User Card */}
          <div className="sidebar-user">
            <div className="user-card">
              <div className="flex items-center gap-md">
                <div className="user-avatar" style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: 'white',
                  fontWeight: 600
                }}>CZ</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>CryptoUser</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Level 5 • 2,450 XP</div>
                </div>
              </div>
              <div className="user-level-bar">
                <div className="user-level-progress" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-title">Main Menu</div>
              {navItems.slice(0, 5).map((item, i) => (
                <div
                  key={item.id}
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="nav-item-badge">{item.badge}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="nav-section">
              <div className="nav-section-title">Account</div>
              {navItems.slice(5).map((item, i) => (
                <div
                  key={item.id}
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                  style={{ animationDelay: `${(i + 5) * 0.05}s` }}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  <span className="nav-item-text">{item.label}</span>
                </div>
              ))}
            </div>
          </nav>
          
          {/* Footer */}
          <div className="sidebar-footer">
            <button 
              className="btn btn-secondary w-full"
              onClick={() => { setIsLoggedIn(false); showNotification('Logged out'); }}
            >
              Sign Out
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="main-wrapper">
          {/* Header */}
          <header className="header">
            <div className="header-left">
              <button 
                className="header-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ display: 'none' }}
              >
                ☰
              </button>
              <h1 className="header-title">{navItems.find(n => n.id === currentPage)?.label}</h1>
            </div>
            <div className="header-right">
              <div className="header-balance">
                <span className="header-balance-icon">₿</span>
                <span className="header-balance-amount">{balance.toFixed(8)}</span>
              </div>
              <button className="header-btn">🔔</button>
              <button className="theme-toggle" onClick={() => setIsDark(!isDark)}>
                <div className="theme-toggle-knob">{isDark ? '🌙' : '☀️'}</div>
              </button>
            </div>
          </header>
          
          {/* Page Content */}
          <main className="main-content">
            {/* Dashboard */}
            {currentPage === 'dashboard' && (
              <div className="flex flex-col gap-xl">
                {/* Welcome Card */}
                <div className="bonus-card">
                  <div className="bonus-card-content">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="bonus-streak">🔥 {streak} Day Streak</div>
                        <h2 className="bonus-title">Welcome Back!</h2>
                        <p className="bonus-desc">Claim your daily bonus and start earning today.</p>
                        {canClaim ? (
                          <button 
                            className="btn btn-primary btn-lg animate-pulse-glow"
                            onClick={e => { createRipple(e); handleClaimBonus(); }}
                          >
                            🎁 Claim Daily Bonus
                          </button>
                        ) : (
                          <div className="bonus-timer">
                            {timeUntilClaim.split(':').map((val, i) => (
                              <div key={i} className="bonus-timer-item">
                                <div className="bonus-timer-value">{val}</div>
                                <div className="bonus-timer-label">{['Hours', 'Minutes', 'Seconds'][i]}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '6rem', opacity: 0.3 }}>🎁</div>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid-4">
                  <div className="stat-card">
                    <div className="stat-card-icon">💰</div>
                    <div className="stat-card-value">{balance.toFixed(8)}</div>
                    <div className="stat-card-label">BTC Balance</div>
                    <span className="stat-card-change positive">↑ +5.2%</span>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">📈</div>
                    <div className="stat-card-value">{(balance * 0.3).toFixed(8)}</div>
                    <div className="stat-card-label">Today's Earnings</div>
                    <span className="stat-card-change positive">↑ +12%</span>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">✅</div>
                    <div className="stat-card-value">{completedAds.length + completedLinks.length + completedOffers.length}</div>
                    <div className="stat-card-label">Tasks Completed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">🔥</div>
                    <div className="stat-card-value">{streak}</div>
                    <div className="stat-card-label">Day Streak</div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Quick Actions</h3>
                  <div className="grid-4">
                    {[
                      { icon: '🎬', title: 'Watch Ads', desc: 'Earn per view', page: 'ads' as Page },
                      { icon: '🔗', title: 'Short Links', desc: 'Visit & earn', page: 'links' as Page },
                      { icon: '🎁', title: 'Offers', desc: 'Complete tasks', page: 'offers' as Page },
                      { icon: '⛏️', title: 'Mining', desc: 'Use CPU power', page: 'mining' as Page },
                    ].map((action, i) => (
                      <div 
                        key={i} 
                        className="action-card"
                        onClick={() => setCurrentPage(action.page)}
                      >
                        <div className="action-card-icon">{action.icon}</div>
                        <div className="action-card-title">{action.title}</div>
                        <div className="action-card-desc">{action.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="glass-card-static" style={{ padding: 'var(--space-lg)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Recent Activity</h3>
                  <div className="flex flex-col gap-sm">
                    {transactions.slice(0, 5).map((tx, i) => (
                      <div key={i} className="task-card">
                        <div className="task-icon">
                          {tx.type === 'earn' ? '💰' : tx.type === 'bonus' ? '🎁' : '📤'}
                        </div>
                        <div className="task-info">
                          <div className="task-title">{tx.description}</div>
                          <div className="task-meta">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div className="task-reward" style={{ color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(8)} BTC
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-lg)' }}>
                        No transactions yet. Start earning! 🚀
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Watch Ads */}
            {currentPage === 'ads' && (
              <div className="flex flex-col gap-lg">
                <p style={{ color: 'var(--text-secondary)' }}>Watch advertisements to earn satoshis. Each ad has a different reward based on duration.</p>
                <div className="grid-3">
                  {ads.map((ad, i) => (
                    <div key={ad.id} className="action-card" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                        <span className="badge badge-primary">{ad.type}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ad.duration}s</span>
                      </div>
                      <div className="action-card-icon">🎬</div>
                      <div className="action-card-title">{ad.title}</div>
                      <div className="action-card-reward">+{ad.reward} sats</div>
                      <button
                        className={`btn ${completedAds.includes(ad.id) ? 'btn-secondary' : 'btn-primary'} w-full`}
                        style={{ marginTop: 'var(--space-md)' }}
                        disabled={completedAds.includes(ad.id)}
                        onClick={e => { createRipple(e); handleWatchAd(ad); }}
                      >
                        {completedAds.includes(ad.id) ? '✓ Completed' : 'Watch Now'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Short Links */}
            {currentPage === 'links' && (
              <div className="flex flex-col gap-lg">
                <p style={{ color: 'var(--text-secondary)' }}>Visit short links and complete all steps to earn rewards.</p>
                <div className="grid-3">
                  {links.map((link, i) => (
                    <div key={link.id} className="action-card" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                        <span className={`badge ${
                          link.difficulty === 'easy' ? 'badge-success' : 
                          link.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                        }`}>{link.difficulty}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{link.steps} steps</span>
                      </div>
                      <div className="action-card-icon">🔗</div>
                      <div className="action-card-title">{link.title}</div>
                      <div className="action-card-reward">+{link.reward} sats</div>
                      <button
                        className={`btn ${completedLinks.includes(link.id) ? 'btn-secondary' : 'btn-primary'} w-full`}
                        style={{ marginTop: 'var(--space-md)' }}
                        disabled={completedLinks.includes(link.id)}
                        onClick={e => { createRipple(e); handleStartLink(link); }}
                      >
                        {completedLinks.includes(link.id) ? '✓ Completed' : 'Start Link'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Offers */}
            {currentPage === 'offers' && (
              <div className="flex flex-col gap-lg">
                <p style={{ color: 'var(--text-secondary)' }}>Complete offers from our partners to earn larger rewards.</p>
                <div className="grid-3">
                  {offers.map((offer, i) => (
                    <div key={offer.id} className="action-card" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
                        <span className={`badge ${
                          offer.difficulty === 'easy' ? 'badge-success' : 
                          offer.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'
                        }`}>{offer.difficulty}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{offer.provider}</span>
                      </div>
                      <div className="action-card-icon">🎁</div>
                      <div className="action-card-title">{offer.title}</div>
                      <div className="action-card-desc">{offer.description}</div>
                      <div className="action-card-reward">+{offer.reward} sats</div>
                      <button
                        className={`btn ${completedOffers.includes(offer.id) ? 'btn-secondary' : 'btn-primary'} w-full`}
                        style={{ marginTop: 'var(--space-md)' }}
                        disabled={completedOffers.includes(offer.id) || processingOffer === offer.id}
                        onClick={e => { createRipple(e); handleCompleteOffer(offer); }}
                      >
                        {completedOffers.includes(offer.id) ? '✓ Completed' : 
                         processingOffer === offer.id ? 'Processing...' : 'Complete Offer'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mining */}
            {currentPage === 'mining' && (
              <div className="flex flex-col gap-lg">
                <p style={{ color: 'var(--text-secondary)' }}>Use your CPU to mine cryptocurrency. Adjust settings to balance performance and earnings.</p>
                
                <div className="grid-2">
                  <div className="glass-card-static" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                    <div className="mining-viz" style={{ margin: '0 auto var(--space-lg)' }}>
                      {isMining && (
                        <>
                          <div className="mining-ring mining-ring-1"></div>
                          <div className="mining-ring mining-ring-2"></div>
                          <div className="mining-ring mining-ring-3"></div>
                        </>
                      )}
                      <div className="mining-center">{isMining ? '⚡' : '⛏️'}</div>
                    </div>
                    
                    <h3 style={{ fontSize: '1.3rem', marginBottom: 'var(--space-sm)' }}>
                      {isMining ? 'Mining Active' : 'Mining Stopped'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                      {isMining ? `Hash Rate: ${hashRate.toFixed(2)} H/s` : 'Click start to begin mining'}
                    </p>
                    
                    <button
                      className={`btn ${isMining ? 'btn-secondary' : 'btn-primary'} btn-lg`}
                      onClick={e => { createRipple(e); setIsMining(!isMining); }}
                    >
                      {isMining ? '⏹ Stop Mining' : '▶ Start Mining'}
                    </button>
                  </div>
                  
                  <div className="glass-card-static" style={{ padding: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-lg)' }}>Mining Stats</h3>
                    
                    <div className="flex flex-col gap-lg">
                      <div>
                        <div className="flex justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Session Earnings</span>
                          <span className="text-gradient" style={{ fontWeight: 600 }}>{miningEarnings.toFixed(8)} BTC</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(miningEarnings * 10000, 100)}%` }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between" style={{ marginBottom: 'var(--space-sm)' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>CPU Usage</span>
                          <span style={{ fontWeight: 600 }}>{cpuUsage}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={cpuUsage}
                          onChange={e => setCpuUsage(Number(e.target.value))}
                          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                        />
                      </div>
                      
                      <div className="task-card">
                        <div className="task-icon">💡</div>
                        <div className="task-info">
                          <div className="task-title">Estimated Daily</div>
                          <div className="task-meta">Based on current settings</div>
                        </div>
                        <div className="task-reward">{((cpuUsage / 100) * 0.0001).toFixed(8)} BTC</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Withdraw */}
            {currentPage === 'withdraw' && (
              <div className="flex flex-col gap-lg">
                <p style={{ color: 'var(--text-secondary)' }}>Withdraw your earnings to your crypto wallet. Minimum withdrawal: 0.0001 BTC</p>
                
                <div className="grid-2">
                  <div className="glass-card-static" style={{ padding: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-lg)' }}>Select Currency</h3>
                    <div className="grid-2" style={{ gap: 'var(--space-md)' }}>
                      {['BTC', 'ETH', 'LTC', 'USDT'].map(crypto => (
                        <div
                          key={crypto}
                          className={`task-card ${selectedCrypto === crypto ? 'active' : ''}`}
                          onClick={() => setSelectedCrypto(crypto)}
                          style={{ 
                            cursor: 'pointer',
                            border: selectedCrypto === crypto ? '1px solid var(--accent-primary)' : undefined
                          }}
                        >
                          <div className="task-icon">
                            {crypto === 'BTC' ? '₿' : crypto === 'ETH' ? 'Ξ' : crypto === 'LTC' ? 'Ł' : '₮'}
                          </div>
                          <div className="task-info">
                            <div className="task-title">{crypto}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="glass-card-static" style={{ padding: 'var(--space-xl)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-lg)' }}>Withdrawal Details</h3>
                    <div className="flex flex-col gap-md">
                      <div className="input-group">
                        <label className="input-label">Amount ({selectedCrypto})</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="0.00000000"
                          value={withdrawAmount}
                          onChange={e => setWithdrawAmount(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Wallet Address</label>
                        <input
                          type="text"
                          className="input"
                          placeholder={`Enter your ${selectedCrypto} address`}
                          value={walletAddress}
                          onChange={e => setWalletAddress(e.target.value)}
                        />
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Available: <span style={{ color: 'var(--accent-primary)' }}>{balance.toFixed(8)} BTC</span>
                      </div>
                      <button
                        className="btn btn-primary btn-lg w-full"
                        disabled={!withdrawAmount || !walletAddress}
                        onClick={e => { createRipple(e); setShowWithdrawConfirm(true); }}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Referrals */}
            {currentPage === 'referrals' && (
              <div className="flex flex-col gap-lg">
                <p style={{ color: 'var(--text-secondary)' }}>Invite friends and earn 10% of their earnings forever!</p>
                
                <div className="bonus-card">
                  <div className="bonus-card-content">
                    <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-sm)' }}>Your Referral Link</h3>
                    <div className="flex gap-md" style={{ marginTop: 'var(--space-md)' }}>
                      <input
                        type="text"
                        className="input"
                        value="https://cryptozy.io/ref/user123"
                        readOnly
                        style={{ flex: 1 }}
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={e => { 
                          createRipple(e); 
                          navigator.clipboard.writeText('https://cryptozy.io/ref/user123');
                          showNotification('Link copied! 📋');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="grid-4">
                  <div className="stat-card">
                    <div className="stat-card-icon">👥</div>
                    <div className="stat-card-value">24</div>
                    <div className="stat-card-label">Total Referrals</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">🟢</div>
                    <div className="stat-card-value">18</div>
                    <div className="stat-card-label">Active Referrals</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">💰</div>
                    <div className="stat-card-value">0.00234</div>
                    <div className="stat-card-label">Total Earned</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-icon">📈</div>
                    <div className="stat-card-value">10%</div>
                    <div className="stat-card-label">Commission Rate</div>
                  </div>
                </div>
                
                <div className="glass-card-static" style={{ padding: 'var(--space-lg)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>Commission Tiers</h3>
                  <div className="flex flex-col gap-sm">
                    {[
                      { level: 'Bronze', refs: '0-10', rate: '10%', progress: 100 },
                      { level: 'Silver', refs: '11-50', rate: '12%', progress: 48 },
                      { level: 'Gold', refs: '51-100', rate: '15%', progress: 0 },
                      { level: 'Diamond', refs: '100+', rate: '20%', progress: 0 },
                    ].map((tier, i) => (
                      <div key={i} className="task-card">
                        <div className="task-icon">{['🥉', '🥈', '🥇', '💎'][i]}</div>
                        <div className="task-info" style={{ flex: 1 }}>
                          <div className="flex justify-between">
                            <span className="task-title">{tier.level}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tier.refs} referrals</span>
                          </div>
                          <div className="progress-bar" style={{ marginTop: 'var(--space-xs)' }}>
                            <div className="progress-fill gold" style={{ width: `${tier.progress}%` }}></div>
                          </div>
                        </div>
                        <div className="task-reward">{tier.rate}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-xl)',
          right: 'var(--space-xl)',
          background: 'var(--gradient-primary)',
          color: 'white',
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slide-up 0.3s ease',
          zIndex: 1000,
          fontWeight: 500
        }}>
          {notification}
        </div>
      )}
      
      {/* Ad Watch Modal */}
      {watchingAd && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🎬 {watchingAd.title}</h3>
              <button className="modal-close" onClick={() => setWatchingAd(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-md)', 
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-lg)'
              }}>
                <span style={{ fontSize: '4rem' }}>📺</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 'var(--space-md)' }}>
                <div className="progress-fill" style={{ width: `${adProgress}%` }}></div>
              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                {adProgress < 100 ? `Watching... ${Math.ceil((100 - adProgress) / (100 / watchingAd.duration))}s remaining` : 'Ad complete!'}
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary w-full"
                disabled={adProgress < 100}
                onClick={e => { createRipple(e); completeAd(); }}
              >
                {adProgress < 100 ? 'Please wait...' : `Claim ${watchingAd.reward} sats`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Link Steps Modal */}
      {activeLink && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🔗 {activeLink.title}</h3>
              <button className="modal-close" onClick={() => { setActiveLink(null); setLinkStep(0); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flex justify-center gap-sm" style={{ marginBottom: 'var(--space-xl)' }}>
                {Array.from({ length: activeLink.steps }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: i < linkStep ? 'var(--gradient-primary)' : 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    {i < linkStep ? '✓' : i + 1}
                  </div>
                ))}
              </div>
              <p style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                Step {linkStep} of {activeLink.steps}
              </p>
              <button 
                className="btn btn-primary w-full"
                onClick={e => { createRipple(e); handleNextLinkStep(); }}
              >
                {linkStep >= activeLink.steps ? `Claim ${activeLink.reward} sats` : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bonus Wheel Modal */}
      {showBonusWheel && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-body" style={{ padding: 'var(--space-2xl)' }}>
              <h2 className="font-display text-gradient" style={{ fontSize: '1.5rem', marginBottom: 'var(--space-lg)' }}>
                🎰 Spin to Win!
              </h2>
              <div style={{
                width: '200px',
                height: '200px',
                margin: '0 auto var(--space-xl)',
                background: 'var(--gradient-primary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                animation: wheelResult ? 'none' : 'spin-slow 1s linear infinite',
                boxShadow: 'var(--shadow-glow)'
              }}>
                {wheelResult ? `${wheelResult}x` : '🎲'}
              </div>
              {wheelResult ? (
                <p style={{ fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                  You won {wheelResult}x multiplier! 🎉
                </p>
              ) : (
                <button className="btn btn-gold btn-lg" onClick={e => { createRipple(e); spinWheel(); }}>
                  Spin Now!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Withdraw Confirm Modal */}
      {showWithdrawConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Withdrawal</h3>
              <button className="modal-close" onClick={() => setShowWithdrawConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flex flex-col gap-md">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
                  <span style={{ fontWeight: 600 }}>{withdrawAmount} {selectedCrypto}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Network Fee</span>
                  <span style={{ fontWeight: 600 }}>0.00001 {selectedCrypto}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>You Receive</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {(parseFloat(withdrawAmount || '0') - 0.00001).toFixed(8)} {selectedCrypto}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowWithdrawConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={e => { createRipple(e); handleWithdraw(); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="modal-overlay" onClick={() => setShowAdminLogin(false)}>
          <div className="modal" style={{ maxWidth: '350px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔐 Admin Access</h3>
              <button className="modal-close" onClick={() => setShowAdminLogin(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Enter admin password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                />
              </div>
              <button 
                className="btn btn-primary w-full" 
                style={{ marginTop: 'var(--space-md)' }}
                onClick={handleAdminLogin}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
