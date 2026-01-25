import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { 
  Flame, Zap, Target, Users, ChevronRight, Check, 
  FileText, Sparkles, Clock, ArrowRight, Star, 
  Building2, Briefcase, TrendingUp, Play
} from 'lucide-react';

// Ember Particles Component
const EmberParticles = () => {
  const [embers, setEmbers] = useState([]);

  useEffect(() => {
    const particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 4,
      size: 2 + Math.random() * 3
    }));
    setEmbers(particles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {embers.map(ember => (
        <div
          key={ember.id}
          className="absolute rounded-full bg-[#FF4500]"
          style={{
            left: `${ember.left}%`,
            bottom: '-10px',
            width: ember.size,
            height: ember.size,
            filter: 'blur(1px)',
            animation: `ember-float ${ember.duration}s ease-in-out infinite`,
            animationDelay: `${ember.delay}s`
          }}
        />
      ))}
    </div>
  );
};

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');

  const openAuth = (mode = 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Research",
      description: "Automatically scrapes and analyzes prospect websites to find personalization opportunities"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "ICP Scoring",
      description: "Instantly know which leads are worth pursuing with intelligent fit scoring"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Beautiful Proposals",
      description: "Generate stunning, personalized proposals that stand out and convert"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "60-Second Delivery",
      description: "From lead input to shareable proposal in under a minute"
    }
  ];

  const useCases = [
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "Freelancers",
      description: "Win more clients on Upwork, Fiverr, and Freelancer with personalized proposals"
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Agencies",
      description: "Scale your outreach without sacrificing personalization quality"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Sales Teams",
      description: "Boost cold outreach conversions with AI-crafted proposals"
    }
  ];

  const stats = [
    { value: "10x", label: "Faster Proposals" },
    { value: "3x", label: "Higher Response Rate" },
    { value: "60s", label: "Generation Time" }
  ];

  return (
    <div className="min-h-screen bg-[#050505] relative">
      {/* Noise Overlay */}
      <div className="noise-overlay" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center glow-fire">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">PITCH</span>
                <span className="fire-text">FIRE</span>
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors hidden sm:block" data-testid="nav-pricing">
                Pricing
              </Link>
              {isAuthenticated ? (
                <Link 
                  to="/dashboard" 
                  className="btn-fire px-4 py-2 rounded text-sm"
                  data-testid="nav-dashboard"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <button 
                    onClick={() => openAuth('login')}
                    className="text-gray-400 hover:text-white transition-colors"
                    data-testid="nav-login"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => openAuth('signup')}
                    className="btn-fire px-4 py-2 rounded text-sm"
                    data-testid="nav-signup"
                  >
                    Start Free
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <EmberParticles />
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-radial-fire opacity-30 pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Zap className="w-4 h-4 text-[#FFD700]" />
            <span className="text-sm text-gray-300">AI-Powered Proposal Generator</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold leading-none tracking-tighter mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-white">PROPOSALS THAT</span>
            <br />
            <span className="fire-text">WIN CLIENTS</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            Generate stunning, AI-personalized proposals in 60 seconds. 
            <span className="text-white"> Stop sending generic pitches.</span>
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {isAuthenticated ? (
              <Link 
                to="/create" 
                className="btn-fire px-8 py-4 rounded text-lg flex items-center gap-2 glow-fire"
                data-testid="hero-create-btn"
              >
                Create Proposal <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <button 
                onClick={() => openAuth('signup')}
                className="btn-fire px-8 py-4 rounded text-lg flex items-center gap-2 glow-fire"
                data-testid="hero-cta-btn"
              >
                Start Free — 5 Proposals <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <button className="btn-outline-fire px-8 py-4 rounded text-lg flex items-center gap-2" data-testid="hero-demo-btn">
              <Play className="w-5 h-5" /> Watch Demo
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl sm:text-5xl font-extrabold fire-text">{stat.value}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-white">WHY</span>{' '}
              <span className="fire-text">PITCHFIRE</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create proposals that actually get responses
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="card-dark p-6 rounded-lg group cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}
                data-testid={`feature-card-${i}`}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF4500]/20 to-[#FF8C00]/10 flex items-center justify-center mb-4 text-[#FF4500] group-hover:glow-fire transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A] relative">
        <div className="absolute inset-0 bg-grid opacity-30" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="fire-text">3 STEPS</span>{' '}
              <span className="text-white">TO WIN</span>
            </h2>
            <p className="text-xl text-gray-400">Create personalized proposals in under 60 seconds</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Input Your Lead", desc: "Paste a job description, fill a form, or upload a CSV file" },
              { step: "02", title: "AI Does Research", desc: "We scrape, analyze, and personalize for maximum impact" },
              { step: "03", title: "Share & Win", desc: "Get a beautiful proposal page with a shareable link" }
            ].map((item, i) => (
              <div key={i} className="relative" data-testid={`step-${i}`}>
                <div className="glass-fire p-8 rounded-lg h-full">
                  <div className="text-6xl font-extrabold fire-text opacity-50 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#FF4500] w-8 h-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-white">BUILT FOR</span>{' '}
              <span className="fire-text">CLOSERS</span>
            </h2>
            <p className="text-xl text-gray-400">Whether you're solo or scaling, PitchFire fits your workflow</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((uc, i) => (
              <div key={i} className="card-dark p-8 rounded-lg text-center" data-testid={`usecase-${i}`}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#FF4500]/20 to-transparent mb-6 text-[#FF4500]">
                  {uc.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{uc.title}</h3>
                <p className="text-gray-400">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-white">SIMPLE</span>{' '}
            <span className="fire-text">PRICING</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12">Start free, upgrade when you need more</p>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Free", price: "$0", features: ["5 proposals total", "AI personalization", "Basic branding"] },
              { name: "Starter", price: "$4.98", popular: false, features: ["30 proposals/mo", "CSV upload", "GitHub hosting"] },
              { name: "Pro", price: "$9.98", popular: true, features: ["100 proposals/mo", "Everything in Starter", "Priority support"] }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`relative p-6 rounded-lg ${plan.popular ? 'glass-fire glow-fire' : 'glass'}`}
                data-testid={`pricing-card-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#FF4500] to-[#FF8C00] rounded-full text-xs font-bold text-white">
                    POPULAR
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-3xl font-extrabold fire-text mb-1">{plan.price}</div>
                <div className="text-sm text-gray-500 mb-6">/month</div>
                <ul className="space-y-2 text-left">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray-400 text-sm">
                      <Check className="w-4 h-4 text-[#FF4500]" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <Link 
            to="/pricing" 
            className="inline-flex items-center gap-2 mt-8 text-[#FF4500] hover:text-[#FF8C00] font-medium"
            data-testid="view-all-plans"
          >
            View all plans <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <EmberParticles />
        <div className="absolute inset-0 bg-radial-fire opacity-20" />
        
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-4xl sm:text-6xl font-extrabold mb-6">
            <span className="text-white">READY TO</span><br />
            <span className="fire-text">WIN MORE CLIENTS?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Join freelancers and agencies who are closing more deals with PitchFire
          </p>
          
          {isAuthenticated ? (
            <Link 
              to="/create" 
              className="btn-fire px-10 py-5 rounded text-xl inline-flex items-center gap-3 glow-fire-strong"
              data-testid="cta-create-btn"
            >
              Create Your First Proposal <Flame className="w-6 h-6" />
            </Link>
          ) : (
            <button 
              onClick={() => openAuth('signup')}
              className="btn-fire px-10 py-5 rounded text-xl inline-flex items-center gap-3 glow-fire-strong"
              data-testid="cta-signup-btn"
            >
              Start Free — No Credit Card <Flame className="w-6 h-6" />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">
                <span className="text-white">PITCH</span>
                <span className="fire-text">FIRE</span>
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>© 2024 AOC. All rights reserved.</span>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
      />
    </div>
  );
};

export default LandingPage;
