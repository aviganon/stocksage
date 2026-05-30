'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

// ============ TYPEWRITER HOOK ============
function useTypewriter(words: string[], typingSpeed = 100, deletingSpeed = 50, pauseTime = 2000) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.slice(0, text.length + 1));
        if (text === currentWord) {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        setText(currentWord.slice(0, text.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

  return text;
}

// ============ COUNT UP HOOK ============
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [hasStarted, end, duration]);

  return { count, ref };
}

// ============ INTERSECTION OBSERVER HOOK ============
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// ============ MARKET DATA ============
const MARKETS = [
  { flag: '🇮🇱', name: 'TASE', sample: 'TEVA' },
  { flag: '🇺🇸', name: 'NASDAQ', sample: 'AAPL' },
  { flag: '🇺🇸', name: 'NYSE', sample: 'JPM' },
  { flag: '🇬🇧', name: 'LSE', sample: 'HSBC' },
  { flag: '🇩🇪', name: 'XETRA', sample: 'SAP' },
  { flag: '🇫🇷', name: 'Euronext', sample: 'LVMH' },
  { flag: '🇨🇦', name: 'TSX', sample: 'SHOP' },
  { flag: '🇦🇺', name: 'ASX', sample: 'BHP' },
];

// ============ STEPS DATA ============
const STEPS = [
  { num: '01', icon: '🏢', title: 'פרופיל חברה', desc: 'תיאור, מוצרים, מיילסטונים והקשר ישראלי', color: 'indigo' },
  { num: '02', icon: '📈', title: 'ניתוח פיננסי', desc: 'הכנסות, שולי רווח, מכפילים ובריאות פיננסית', color: 'green' },
  { num: '03', icon: '📅', title: 'ציר אירועים', desc: 'חדשות, הגשות רגולטוריות וסנטימנט', color: 'amber' },
  { num: '04', icon: '🎯', title: 'ניתוח תחרותי', desc: 'מיקום בשוק, מתחרים וגלי רוח', color: 'purple' },
  { num: '05', icon: '⚠️', title: 'הערכת סיכונים', desc: 'סיכוני חברה, ענף ומאקרו', color: 'red' },
  { num: '06', icon: '🧠', title: 'סינתזה', desc: 'תקציר מנהלים ותרחישי bull/bear', color: 'cyan' },
];

// ============ DATA SOURCES ============
const DATA_SOURCES = [
  { name: 'Yahoo Finance', icon: '📊' },
  { name: 'FRED', icon: '🏛️' },
  { name: 'TASE Maya', icon: '🇮🇱' },
  { name: 'SEC Edgar', icon: '📑' },
  { name: 'Google News', icon: '📰' },
  { name: 'Israeli News', icon: '🗞️' },
];

// ============ MAIN COMPONENT ============
export default function LandingPage() {
  const typewriterText = useTypewriter(['בדקות', 'in Minutes', 'за минуты', 'en minutes'], 120, 80, 2500);
  const reportsCount = useCountUp(18);
  const marketsCount = useCountUp(7);
  const languagesCount = useCountUp(5);
  
  const heroRef = useInView(0.3);
  const marketsRef = useInView(0.2);
  const aiRef = useInView(0.2);
  const stepsRef = useInView(0.2);
  const previewRef = useInView(0.2);
  const pricingRef = useInView(0.2);
  const trustRef = useInView(0.2);

  const [activeDepth, setActiveDepth] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [checkmarks, setCheckmarks] = useState<number[]>([]);

  useEffect(() => {
    if (previewRef.isInView && checkmarks.length < 6) {
      const interval = setInterval(() => {
        setCheckmarks(prev => prev.length < 6 ? [...prev, prev.length] : prev);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [previewRef.isInView, checkmarks.length]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] overflow-x-hidden" dir="rtl">
      {/* ============ CSS ANIMATIONS ============ */}
      <style jsx global>{`
        @keyframes gradientMove {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
        }
        @keyframes draw-line {
          to { stroke-dashoffset: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-gradient { animation: gradientMove 15s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: floatSlow 8s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
        .stagger-7 { animation-delay: 0.7s; }
        .stagger-8 { animation-delay: 0.8s; }
      `}</style>

      {/* ============ 1. NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">
              Stock<span className="text-indigo-400">[Sage]</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
              Beta
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">תכונות</a>
            <a href="#pricing" className="hover:text-white transition-colors">תמחור</a>
            <a href="#markets" className="hover:text-white transition-colors">שווקים</a>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
            >
              כניסה
            </Link>
            <Link 
              href="/signup" 
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-indigo-500/25"
            >
              נסה חינם
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ 2. HERO SECTION ============ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-gradient" />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[100px] animate-gradient" style={{ animationDelay: '-5s' }} />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-indigo-400/10 blur-[80px] animate-gradient" style={{ animationDelay: '-10s' }} />
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-indigo-400/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div 
          ref={heroRef.ref}
          className={`relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center ${heroRef.isInView ? 'opacity-100' : 'opacity-0'}`}
          style={{ transition: 'opacity 0.8s ease-out' }}
        >
          {/* Left content */}
          <div className="text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              מופעל על ידי Claude AI
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4 animate-fade-in-up stagger-1">
              מחקר מניות מעמיק
            </h1>
            
            <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-indigo-400 mb-8 h-[1.2em] animate-fade-in-up stagger-2">
              {typewriterText}<span className="animate-pulse">|</span>
            </div>

            <p className="text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 lg:mr-0 mb-10 leading-relaxed animate-fade-in-up stagger-3">
              ניתוח AI מקיף ל-7 בורסות עולמיות. Claude Sonnet מנתח פרופיל, פיננסים, אירועים, תחרות וסיכונים — והכל בדוח אחד ברור.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up stagger-4">
              <Link 
                href="/dashboard" 
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                נסה עכשיו — חינם
                <svg className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center border border-white/10 hover:border-white/30 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg transition-all hover:bg-white/5"
              >
                כניסה לחשבון
              </Link>
            </div>

            <p className="text-sm text-gray-500 mt-6 animate-fade-in-up stagger-5">
              ללא כרטיס אשראי · ללא הרשמה · 3 סריקות חינם
            </p>
          </div>

          {/* Right - Floating mockup card */}
          <div className="hidden lg:block animate-fade-in-up stagger-6">
            <div className="relative animate-float-slow">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-[#12121e] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg">🏢</div>
                    <div>
                      <div className="text-white font-semibold">טבע תעשיות</div>
                      <div className="text-xs text-gray-500">TASE:TEVA · ניתוח מלא</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">בריא</span>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-300">חברת תרופות גלובלית עם נוכחות ב-60 מדינות</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span className="text-gray-300">צמיחה של 12% בהכנסות ברבעון האחרון</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">!</span>
                    <span className="text-gray-300">חשיפה לסיכוני רגולציה בארה״ב</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                  <span>נוצר לפני 2 דקות</span>
                  <span className="text-indigo-400">Claude Sonnet 4</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="absolute bottom-12 left-0 right-0">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-8 md:gap-16 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <span ref={reportsCount.ref}>{reportsCount.count}</span>+
                </div>
                <div className="text-sm text-gray-500 mt-1">דוחות</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <span ref={marketsCount.ref}>{marketsCount.count}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">בורסות</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl md:text-4xl font-bold text-white">
                  <span ref={languagesCount.ref}>{languagesCount.count}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">שפות</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl md:text-4xl font-bold text-indigo-400">Claude</div>
                <div className="text-sm text-gray-500 mt-1">AI</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 3. MARKETS SECTION ============ */}
      <section id="markets" className="py-32 relative">
        <div 
          ref={marketsRef.ref}
          className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ${marketsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              7 שווקים. מחקר אחד.
            </h2>
            <p className="text-xl text-gray-400">כיסוי גלובלי מלא לכל הבורסות המובילות</p>
          </div>

          {/* Globe SVG */}
          <div className="relative max-w-4xl mx-auto">
            <svg viewBox="0 0 400 200" className="w-full h-auto opacity-20">
              <ellipse cx="200" cy="100" rx="180" ry="80" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="4 4">
                <animate attributeName="stroke-dashoffset" from="0" to="8" dur="2s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="200" cy="100" rx="120" ry="80" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="4 4">
                <animate attributeName="stroke-dashoffset" from="8" to="0" dur="3s" repeatCount="indefinite" />
              </ellipse>
              <line x1="20" y1="100" x2="380" y2="100" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="4 4" />
            </svg>

            {/* Market cards */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
                {MARKETS.map((market, i) => (
                  <div
                    key={market.name}
                    className={`group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-default ${marketsRef.isInView ? 'animate-scale-in' : 'opacity-0'}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="text-2xl mb-2">{market.flag}</div>
                    <div className="text-white font-semibold text-sm">{market.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-indigo-300 transition-colors">{market.sample}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 4. AI TECHNOLOGY SECTION ============ */}
      <section className="py-32 relative bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
        <div 
          ref={aiRef.ref}
          className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ${aiRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              מופעל על ידי Claude AI
            </h2>
            <p className="text-xl text-gray-400">6 מקורות נתונים. מנוע אחד חכם. דוח מקיף.</p>
          </div>

          {/* Flow diagram */}
          <div className="relative max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Data sources */}
              <div className="space-y-3">
                <div className="text-sm text-gray-500 text-center mb-4">מקורות נתונים</div>
                {DATA_SOURCES.map((source, i) => (
                  <div 
                    key={source.name}
                    className={`flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3 ${aiRef.isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="text-xl">{source.icon}</span>
                    <span className="text-sm text-gray-300">{source.name}</span>
                  </div>
                ))}
              </div>

              {/* Center engine */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center animate-pulse-glow">
                    <div className="text-center">
                      <div className="text-white font-bold text-sm">StockSage</div>
                      <div className="text-indigo-200 text-xs">Engine</div>
                    </div>
                  </div>
                </div>
                
                {/* Connecting lines animation placeholder */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 hidden md:block" style={{ zIndex: -1 }}>
                  <line x1="25%" y1="50%" x2="40%" y2="50%" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 4">
                    <animate attributeName="stroke-dashoffset" from="12" to="0" dur="1s" repeatCount="indefinite" />
                  </line>
                  <line x1="60%" y1="50%" x2="75%" y2="50%" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 4">
                    <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1s" repeatCount="indefinite" />
                  </line>
                </svg>
              </div>

              {/* Output steps */}
              <div className="space-y-3">
                <div className="text-sm text-gray-500 text-center mb-4">שלבי ניתוח</div>
                {['פרופיל', 'פיננסים', 'אירועים', 'תחרות', 'סיכונים', 'סינתזה'].map((step, i) => (
                  <div 
                    key={step}
                    className={`flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3 ${aiRef.isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                  >
                    <span className="text-indigo-400 font-mono text-sm">0{i + 1}</span>
                    <span className="text-sm text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom badges */}
            <div className="flex items-center justify-center gap-4 mt-12 flex-wrap">
              {['claude-sonnet-4-6', 'claude-haiku-4-5', 'Real-time data'].map((badge) => (
                <span key={badge} className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 5. 6-STEP ANALYSIS SECTION ============ */}
      <section id="features" className="py-32 relative">
        <div 
          ref={stepsRef.ref}
          className={`max-w-7xl mx-auto px-6 transition-all duration-1000 ${stepsRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ניתוח מלא ב-6 שלבים
            </h2>
            <p className="text-xl text-gray-400">כל דוח עובר תהליך מקיף ושיטתי</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const colorMap: Record<string, string> = {
                indigo: 'border-indigo-500/30 hover:bg-indigo-500/10',
                green: 'border-green-500/30 hover:bg-green-500/10',
                amber: 'border-amber-500/30 hover:bg-amber-500/10',
                purple: 'border-purple-500/30 hover:bg-purple-500/10',
                red: 'border-red-500/30 hover:bg-red-500/10',
                cyan: 'border-cyan-500/30 hover:bg-cyan-500/10',
              };
              const numColorMap: Record<string, string> = {
                indigo: 'text-indigo-400',
                green: 'text-green-400',
                amber: 'text-amber-400',
                purple: 'text-purple-400',
                red: 'text-red-400',
                cyan: 'text-cyan-400',
              };
              
              return (
                <div
                  key={step.num}
                  className={`group bg-white/5 border-r-2 ${colorMap[step.color]} rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl cursor-default ${stepsRef.isInView ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`font-mono text-3xl font-bold ${numColorMap[step.color]} mb-3 group-hover:scale-110 transition-transform inline-block`}>
                    {step.num}
                  </div>
                  <div className="text-2xl mb-3">{step.icon}</div>
                  <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 6. LIVE REPORT PREVIEW ============ */}
      <section className="py-32 relative bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div 
          ref={previewRef.ref}
          className={`max-w-6xl mx-auto px-6 transition-all duration-1000 ${previewRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              תצוגה מקדימה
            </h2>
            <p className="text-xl text-gray-400">בחר רמת עומק וקבל דוח מותאם</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Depth selector */}
            <div className="space-y-4">
              {[
                { id: 'quick' as const, icon: '⚡', name: 'מהיר', price: 'חינם', color: 'green', desc: '3 שלבי ניתוח בסיסיים' },
                { id: 'standard' as const, icon: '📊', name: 'מלא', price: '$1.99', color: 'amber', desc: '6 שלבי ניתוח מקיפים' },
                { id: 'deep' as const, icon: '🔬', name: 'עמוק', price: '$3.99', color: 'purple', desc: 'Claude Sonnet + ניתוח מעמיק' },
              ].map((depth) => {
                const isActive = activeDepth === depth.id;
                const borderColor = depth.color === 'green' ? 'border-green-500' : depth.color === 'amber' ? 'border-amber-500' : 'border-purple-500';
                const bgColor = depth.color === 'green' ? 'bg-green-500/10' : depth.color === 'amber' ? 'bg-amber-500/10' : 'bg-purple-500/10';
                
                return (
                  <button
                    key={depth.id}
                    onClick={() => setActiveDepth(depth.id)}
                    className={`w-full text-right p-4 rounded-xl border transition-all ${isActive ? `${borderColor} ${bgColor}` : 'border-white/10 hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{depth.icon}</span>
                      <div className="flex-1">
                        <div className="text-white font-semibold">{depth.name}</div>
                        <div className="text-sm text-gray-500">{depth.desc}</div>
                      </div>
                      <div className={`font-bold ${depth.color === 'green' ? 'text-green-400' : depth.color === 'amber' ? 'text-amber-400' : 'text-purple-400'}`}>
                        {depth.price}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Report preview */}
            <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-xl">🏢</div>
                  <div>
                    <div className="text-white font-semibold">טבע תעשיות</div>
                    <div className="text-xs text-gray-500">TASE:TEVA</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${activeDepth === 'quick' ? 'bg-green-500/20 text-green-400' : activeDepth === 'standard' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {activeDepth === 'quick' ? 'מהיר' : activeDepth === 'standard' ? 'מלא' : 'עמוק'}
                </span>
              </div>

              <div className="space-y-3">
                {STEPS.slice(0, activeDepth === 'quick' ? 3 : 6).map((step, i) => (
                  <div key={step.num} className="flex items-center gap-3 text-sm">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all ${checkmarks.includes(i) ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                      {checkmarks.includes(i) ? '✓' : i + 1}
                    </span>
                    <span className={`transition-colors ${checkmarks.includes(i) ? 'text-white' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                <div className="animate-shimmer h-3 rounded bg-white/5 mb-2" />
                <div className="animate-shimmer h-3 rounded bg-white/5 w-3/4" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 7. PRICING SECTION ============ */}
      <section id="pricing" className="py-32 relative">
        <div 
          ref={pricingRef.ref}
          className={`max-w-6xl mx-auto px-6 transition-all duration-1000 ${pricingRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              תמחור שקוף
            </h2>
            <p className="text-xl text-gray-400">שלם רק על מה שאתה צריך</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Quick - Free */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:-translate-y-2 transition-all hover:shadow-xl">
              <div className="text-3xl mb-4">⚡</div>
              <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 mb-4">חינמי תמיד</span>
              <div className="text-green-300 font-medium mb-2">מהיר</div>
              <div className="text-4xl font-bold text-white mb-1">חינם</div>
              <div className="text-sm text-gray-500 mb-8">3 סריקות ביום</div>
              
              <ul className="space-y-3 mb-8 text-sm">
                {['פרופיל חברה', 'ניתוח פיננסי', 'סינתזה בסיסית'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block text-center border border-white/10 hover:border-green-500/50 hover:bg-green-500/10 text-gray-300 hover:text-white py-3 rounded-xl transition-all font-medium">
                התחל חינם
              </Link>
            </div>

            {/* Standard - Recommended */}
            <div className="relative bg-amber-500/5 border-2 border-amber-500/30 rounded-2xl p-8 hover:-translate-y-2 transition-all hover:shadow-xl hover:shadow-amber-500/10 md:-my-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-1.5 rounded-full">
                מומלץ
              </div>
              <div className="text-3xl mb-4">📊</div>
              <div className="text-amber-300 font-medium mb-2">מלא</div>
              <div className="text-4xl font-bold text-white mb-1">$1.99</div>
              <div className="text-sm text-gray-500 mb-8">לדוח</div>
              
              <ul className="space-y-3 mb-8 text-sm">
                {['פרופיל חברה', 'ניתוח פיננסי', 'ציר אירועים', 'ניתוח תחרותי', 'הערכת סיכונים', 'סינתזה מקיפה'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300">
                    <span className="text-amber-400">✓</span> {f}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block text-center bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white py-3 rounded-xl transition-all font-medium">
                התחל עכשיו
              </Link>
            </div>

            {/* Deep */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-8 hover:-translate-y-2 transition-all hover:shadow-xl hover:shadow-purple-500/10">
              <div className="text-3xl mb-4">🔬</div>
              <div className="text-purple-300 font-medium mb-2">עמוק</div>
              <div className="text-4xl font-bold text-white mb-1">$3.99</div>
              <div className="text-sm text-gray-500 mb-8">לדוח</div>
              
              <ul className="space-y-3 mb-8 text-sm">
                {['כל תכונות מלא', 'Claude Sonnet 4', 'ניתוח מעמיק יותר', 'תובנות מתקדמות'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-gray-300">
                    <span className="text-purple-400">✓</span> {f}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block text-center bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 hover:text-white py-3 rounded-xl transition-all font-medium">
                התחל עכשיו
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 8. TRUST SECTION ============ */}
      <section className="py-20 border-y border-white/5">
        <div 
          ref={trustRef.ref}
          className={`max-w-6xl mx-auto px-6 transition-all duration-1000 ${trustRef.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
            {[
              { name: 'Claude AI', desc: 'בינה מלאכותית' },
              { name: 'Firebase', desc: 'תשתית מאובטחת' },
              { name: 'Google Cloud', desc: 'ענן אמין' },
              { name: 'Paddle', desc: 'תשלומים בטוחים' },
              { name: '5 שפות', desc: 'תמיכה גלובלית' },
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div className="text-white font-semibold">{item.name}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 9. FINAL CTA SECTION ============ */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-indigo-600/20 blur-[150px] animate-gradient" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            מוכן להתחיל?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            3 סריקות מהירות חינמיות. ללא כרטיס אשראי.
          </p>
          
          <Link 
            href="/dashboard" 
            className="group inline-flex items-center justify-center gap-3 bg-gradient-to-l from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold px-10 py-5 rounded-xl text-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
          >
            נסה עכשיו — חינם
            <svg className="w-6 h-6 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>

          <p className="text-sm text-gray-600 mt-8">
            * אינו מהווה ייעוץ השקעות. המידע מוצג למטרות מחקר בלבד.
          </p>
        </div>
      </section>

      {/* ============ 10. FOOTER ============ */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">
                Stock<span className="text-indigo-400">[Sage]</span>
              </span>
              <span className="text-sm text-gray-500">מחקר מניות מופעל AI</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/terms" className="hover:text-white transition-colors">תנאי שימוש</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">מדיניות פרטיות</Link>
              <Link href="/accessibility" className="hover:text-white transition-colors">נגישות</Link>
              <Link href="/refund" className="hover:text-white transition-colors">החזרים</Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            © 2026 StockSage. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
