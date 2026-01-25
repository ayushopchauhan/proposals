import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, Plus, FileText, Clock, CheckCircle, XCircle, 
  AlertCircle, TrendingUp, Loader2, ExternalLink,
  Settings, LogOut, BarChart3, Crown, ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const { user, api, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [proposalsRes, statsRes] = await Promise.all([
        api.get('/proposals'),
        api.get('/stats')
      ]);
      setProposals(proposalsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
      case 'pending':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      processing: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return styles[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const proposalsRemaining = (user?.proposals_limit || 5) - (user?.proposals_used || 0);
  const usagePercent = ((user?.proposals_used || 0) / (user?.proposals_limit || 5)) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FF4500] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="dashboard">
      {/* Noise Overlay */}
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="dashboard-logo">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center glow-fire">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">PITCH</span>
                <span className="fire-text">FIRE</span>
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/create" 
                className="btn-fire px-4 py-2 rounded text-sm flex items-center gap-2"
                data-testid="create-proposal-btn"
              >
                <Plus className="w-4 h-4" /> New Proposal
              </Link>
              
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded glass hover:bg-white/5" data-testid="user-menu-btn">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF4500]/20 to-[#FF8C00]/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#FF4500]">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 glass rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/settings" className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-gray-300 text-sm" data-testid="settings-link">
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 text-red-400 text-sm" data-testid="logout-btn">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="text-white">WELCOME BACK,</span>{' '}
              <span className="fire-text">{user?.name?.toUpperCase()}</span>
            </h1>
            <p className="text-gray-400">Here's your proposal overview</p>
          </div>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Usage Card */}
            <div className="glass-fire p-6 rounded-lg" data-testid="usage-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400 uppercase tracking-wider">Usage</span>
                <FileText className="w-5 h-5 text-[#FF4500]" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {user?.proposals_used || 0} / {user?.proposals_limit || 5}
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full progress-fire rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">
                {proposalsRemaining} proposals remaining
              </p>
            </div>

            {/* Completed Card */}
            <div className="card-dark p-6 rounded-lg" data-testid="completed-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400 uppercase tracking-wider">Completed</span>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-white">{stats?.completed || 0}</div>
              <p className="text-sm text-gray-500">Successfully generated</p>
            </div>

            {/* Processing Card */}
            <div className="card-dark p-6 rounded-lg" data-testid="processing-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400 uppercase tracking-wider">Processing</span>
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-white">{stats?.pending || 0}</div>
              <p className="text-sm text-gray-500">In progress</p>
            </div>

            {/* Avg Score Card */}
            <div className="card-dark p-6 rounded-lg" data-testid="score-card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400 uppercase tracking-wider">Avg ICP Score</span>
                <BarChart3 className="w-5 h-5 text-[#FF4500]" />
              </div>
              <div className="text-3xl font-bold fire-text">{stats?.average_icp_score || 0}</div>
              <p className="text-sm text-gray-500">Lead quality score</p>
            </div>
          </div>

          {/* Upgrade Banner (if on free plan) */}
          {user?.plan === 'free' && (
            <div className="glass-fire p-6 rounded-lg mb-8 flex flex-col sm:flex-row items-center justify-between gap-4" data-testid="upgrade-banner">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FFD700] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Upgrade to Pro</h3>
                  <p className="text-gray-400 text-sm">Get 100 proposals/month and unlock all features</p>
                </div>
              </div>
              <Link 
                to="/pricing" 
                className="btn-fire px-6 py-2 rounded flex items-center gap-2"
                data-testid="upgrade-btn"
              >
                Upgrade Now <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Proposals List */}
          <div className="glass rounded-lg overflow-hidden" data-testid="proposals-list">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">RECENT PROPOSALS</h2>
              <Link to="/create" className="text-sm text-[#FF4500] hover:text-[#FF8C00] flex items-center gap-1">
                Create New <Plus className="w-4 h-4" />
              </Link>
            </div>

            {proposals.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No proposals yet</h3>
                <p className="text-gray-500 mb-6">Create your first AI-powered proposal</p>
                <Link 
                  to="/create" 
                  className="btn-fire px-6 py-3 rounded inline-flex items-center gap-2"
                  data-testid="create-first-proposal-btn"
                >
                  <Plus className="w-5 h-5" /> Create Proposal
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {proposals.map((proposal, i) => (
                  <div 
                    key={proposal.id} 
                    className="p-4 sm:p-6 hover:bg-white/5 transition-colors"
                    data-testid={`proposal-row-${i}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {getStatusIcon(proposal.status)}
                        <div>
                          <h3 className="font-bold text-white">
                            {proposal.lead_data?.company_name || proposal.lead_data?.first_name || 'Untitled Proposal'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {proposal.lead_data?.email || proposal.lead_data?.job_description?.substring(0, 60) + '...' || 'No details'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6">
                        {proposal.icp_score && (
                          <div className="text-center">
                            <div className="text-lg font-bold fire-text">{proposal.icp_score}</div>
                            <div className="text-xs text-gray-500">ICP</div>
                          </div>
                        )}
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(proposal.status)}`}>
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                        
                        <span className="text-sm text-gray-500 hidden sm:block">
                          {formatDate(proposal.created_at)}
                        </span>
                        
                        {proposal.status === 'completed' && proposal.proposal_url && (
                          <a 
                            href={proposal.proposal_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded glass hover:bg-white/10"
                            data-testid={`view-proposal-${i}`}
                          >
                            <ExternalLink className="w-4 h-4 text-[#FF4500]" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
