import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Flame, Mail, Lock, User, Loader2 } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="auth-modal">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-fire rounded-lg overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors z-10"
            data-testid="close-auth-modal"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="p-8 pb-6 text-center border-b border-white/10">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FF8C00] glow-fire">
              <Flame size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold fire-text">
              {mode === 'login' ? 'Welcome Back' : 'Join PitchFire'}
            </h2>
            <p className="mt-2 text-gray-400">
              {mode === 'login' 
                ? 'Sign in to access your proposals' 
                : 'Start creating winning proposals'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm" data-testid="auth-error">
                {error}
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full pl-10 pr-4 py-3 input-dark rounded"
                    data-testid="auth-name-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 input-dark rounded"
                  data-testid="auth-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 input-dark rounded"
                  data-testid="auth-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn-fire rounded flex items-center justify-center gap-2"
              data-testid="auth-submit-btn"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-[#FF4500] hover:text-[#FF8C00] font-medium"
                    data-testid="switch-to-signup"
                  >
                    Sign up free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-[#FF4500] hover:text-[#FF8C00] font-medium"
                    data-testid="switch-to-login"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
