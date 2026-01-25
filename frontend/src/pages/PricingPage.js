import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { 
  Flame, Check, X, Zap, ArrowRight, Crown, 
  Building2, Briefcase, Star, Loader2
} from 'lucide-react';

const PricingPage = () => {
  const { isAuthenticated, user, api } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // Payment links - PLACEHOLDER: Replace with actual Skydo links
  const PAYMENT_LINKS = {
    starter: {
      monthly: 'PLACEHOLDER_SKYDO_STARTER_MONTHLY_LINK',
      annual: 'PLACEHOLDER_SKYDO_STARTER_ANNUAL_LINK'
    },
    pro: {
      monthly: 'PLACEHOLDER_SKYDO_PRO_MONTHLY_LINK',
      annual: 'PLACEHOLDER_SKYDO_PRO_ANNUAL_LINK'
    },
    agency: {
      monthly: 'PLACEHOLDER_SKYDO_AGENCY_MONTHLY_LINK',
      annual: 'PLACEHOLDER_SKYDO_AGENCY_ANNUAL_LINK'
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Try PitchFire risk-free',
      price: { monthly: 0, annual: 0 },
      proposals: '5 total',
      proposalsNum: 5,
      features: [
        { text: '5 proposals total', included: true },
        { text: 'AI-powered research', included: true },
        { text: 'Personalized proposals', included: true },
        { text: 'Shareable links', included: true },
        { text: 'CSV upload', included: false },
        { text: 'GitHub hosting', included: false },
        { text: 'Priority support', included: false }
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For solo freelancers',
      price: { monthly: 4.98, annual: 47.88 },
      proposals: '30/month',
      proposalsNum: 30,
      features: [
        { text: '30 proposals per month', included: true },
        { text: 'AI-powered research', included: true },
        { text: 'Personalized proposals', included: true },
        { text: 'Shareable links', included: true },
        { text: 'CSV upload', included: true },
        { text: 'GitHub hosting', included: true },
        { text: 'Email support', included: true }
      ],
      cta: 'Start Starter',
      popular: false,
      icon: Briefcase
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For power users',
      price: { monthly: 9.98, annual: 95.88 },
      proposals: '100/month',
      proposalsNum: 100,
      features: [
        { text: '100 proposals per month', included: true },
        { text: 'Everything in Starter', included: true },
        { text: 'Advanced analytics', included: true },
        { text: '3 team members', included: true },
        { text: 'API access', included: true },
        { text: 'Priority support', included: true },
        { text: 'Custom branding', included: true }
      ],
      cta: 'Go Pro',
      popular: true,
      icon: Star
    },
    {
      id: 'agency',
      name: 'Agency',
      description: 'For teams & agencies',
      price: { monthly: 19.98, annual: 191.88 },
      proposals: 'Unlimited',
      proposalsNum: 999999,
      features: [
        { text: 'Unlimited proposals', included: true },
        { text: 'Everything in Pro', included: true },
        { text: '10 team members', included: true },
        { text: 'Custom integrations', included: true },
        { text: 'Dedicated support', included: true },
        { text: 'SLA guarantee', included: true },
        { text: 'Onboarding call', included: true }
      ],
      cta: 'Contact Sales',
      popular: false,
      icon: Building2
    }
  ];

  const calculateSavings = (plan) => {
    if (plan.price.monthly === 0) return 0;
    const monthlyTotal = plan.price.monthly * 12;
    const annualTotal = plan.price.annual;
    return Math.round(((monthlyTotal - annualTotal) / monthlyTotal) * 100);
  };

  const handleSelectPlan = async (plan) => {
    if (plan.id === 'free') {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        setShowAuthModal(true);
      }
      return;
    }

    if (!isAuthenticated) {
      setSelectedPlan(plan.id);
      setShowAuthModal(true);
      return;
    }

    // For paid plans, redirect to payment
    const paymentLink = PAYMENT_LINKS[plan.id]?.[billingCycle];
    if (paymentLink && !paymentLink.startsWith('PLACEHOLDER')) {
      // Add user email to payment link for tracking
      const finalLink = `${paymentLink}?email=${encodeURIComponent(user.email)}&user_id=${user.id}`;
      window.open(finalLink, '_blank');
    } else {
      // Placeholder behavior - show coming soon or direct upgrade
      alert(`Payment integration coming soon! Plan: ${plan.name} (${billingCycle})`);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (selectedPlan && selectedPlan !== 'free') {
      // Redirect to payment after auth
      const plan = plans.find(p => p.id === selectedPlan);
      if (plan) {
        handleSelectPlan(plan);
      }
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="pricing-page">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="pricing-logo">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center glow-fire">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">PITCH</span>
                <span className="fire-text">FIRE</span>
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-fire px-4 py-2 rounded text-sm" data-testid="go-to-dashboard">
                  Dashboard
                </Link>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)} 
                  className="btn-fire px-4 py-2 rounded text-sm"
                  data-testid="pricing-signup-btn"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Zap className="w-4 h-4 text-[#FFD700]" />
              <span className="text-sm text-gray-300">Simple, transparent pricing</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-4">
              <span className="text-white">CHOOSE YOUR</span><br />
              <span className="fire-text">FIRE POWER</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free, upgrade when you're ready. All plans include AI-powered proposals.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-[#FF4500]' : 'bg-gray-700'
              }`}
              data-testid="billing-toggle"
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
            <span className={`text-sm ${billingCycle === 'annual' ? 'text-white' : 'text-gray-500'}`}>
              Annual
            </span>
            <span className="px-2 py-1 rounded bg-[#FF4500]/20 text-[#FF4500] text-xs font-bold">
              Save 20%
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              const savings = calculateSavings(plan);
              const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual / 12;
              const isCurrentPlan = user?.plan === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                    plan.popular 
                      ? 'glass-fire glow-fire scale-105 lg:scale-110 z-10' 
                      : 'glass hover:border-[#FF4500]/30'
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 py-2 bg-gradient-to-r from-[#FF4500] to-[#FF8C00] text-center">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className={`p-6 ${plan.popular ? 'pt-12' : ''}`}>
                    {/* Plan Header */}
                    <div className="mb-6">
                      {Icon && (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF4500]/20 to-transparent flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-[#FF4500]" />
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>
                    
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold fire-text">
                          ${price.toFixed(2)}
                        </span>
                        <span className="text-gray-500">/mo</span>
                      </div>
                      {billingCycle === 'annual' && plan.price.monthly > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          Billed ${plan.price.annual.toFixed(2)}/year
                        </p>
                      )}
                      <div className="mt-2 text-sm">
                        <span className="text-[#FF4500] font-bold">{plan.proposals}</span>
                        <span className="text-gray-500"> proposals</span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan}
                      className={`w-full py-3 rounded font-bold transition-all ${
                        plan.popular
                          ? 'btn-fire glow-fire'
                          : isCurrentPlan
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'btn-outline-fire'
                      }`}
                      data-testid={`select-plan-${plan.id}`}
                    >
                      {isCurrentPlan ? 'Current Plan' : plan.cta}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              <span className="text-white">FREQUENTLY</span>{' '}
              <span className="fire-text">ASKED</span>
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  q: "What happens when I run out of proposals?",
                  a: "On the free plan, you get 5 proposals total. On paid plans, your limit resets monthly. You can upgrade anytime to get more proposals."
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes! You can cancel your subscription at any time. You'll keep access until the end of your billing period."
                },
                {
                  q: "What's GitHub hosting?",
                  a: "Paid plans can host proposals on their own GitHub repository, giving you custom URLs and full control over your proposal pages."
                },
                {
                  q: "Do unused proposals roll over?",
                  a: "No, unused proposals don't roll over to the next month. Use 'em or lose 'em!"
                },
                {
                  q: "Is there a free trial for paid plans?",
                  a: "The free plan IS your trial! Try 5 proposals to see how PitchFire works before upgrading."
                }
              ].map((faq, i) => (
                <div key={i} className="glass rounded-lg p-6" data-testid={`faq-${i}`}>
                  <h3 className="font-bold text-white mb-2">{faq.q}</h3>
                  <p className="text-gray-400 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-gray-500">© 2024 AOC. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          setSelectedPlan(null);
        }} 
        initialMode="signup"
      />
    </div>
  );
};

export default PricingPage;
