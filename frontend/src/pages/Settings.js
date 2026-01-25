import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Flame, ArrowLeft, Save, Loader2, Check, Plus, Trash2,
  User, Building2, Globe, Calendar, Camera, Link2, 
  Github, Key, Eye, EyeOff, AlertCircle, CheckCircle
} from 'lucide-react';

const Settings = () => {
  const { user, api, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [githubStatus, setGithubStatus] = useState(null);
  
  // Business Config State
  const [config, setConfig] = useState({
    business_name: '',
    business_description: '',
    services_offered: '',
    target_audience: '',
    unique_value_proposition: '',
    pricing_tiers: [],
    owner_name: '',
    owner_email: '',
    owner_photo_url: '',
    calendar_link: '',
    website_url: '',
    demo_videos: [''],
    portfolio_links: [''],
    github_username: '',
    github_repo: '',
    github_token: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/business-config');
      if (response.data.config) {
        setConfig(prev => ({
          ...prev,
          ...response.data.config,
          demo_videos: response.data.config.demo_videos?.length ? response.data.config.demo_videos : [''],
          portfolio_links: response.data.config.portfolio_links?.length ? response.data.config.portfolio_links : [''],
          pricing_tiers: response.data.config.pricing_tiers?.length ? response.data.config.pricing_tiers : []
        }));
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleArrayChange = (field, index, value) => {
    setConfig(prev => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
    setSaved(false);
  };

  const addArrayItem = (field) => {
    setConfig(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setConfig(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handlePricingTierChange = (index, field, value) => {
    setConfig(prev => {
      const tiers = [...prev.pricing_tiers];
      tiers[index] = { ...tiers[index], [field]: value };
      return { ...prev, pricing_tiers: tiers };
    });
    setSaved(false);
  };

  const addPricingTier = () => {
    setConfig(prev => ({
      ...prev,
      pricing_tiers: [...prev.pricing_tiers, { name: '', price: '', description: '', features: '' }]
    }));
  };

  const removePricingTier = (index) => {
    setConfig(prev => ({
      ...prev,
      pricing_tiers: prev.pricing_tiers.filter((_, i) => i !== index)
    }));
  };

  const testGithubConnection = async () => {
    if (!config.github_username || !config.github_repo || !config.github_token) {
      setGithubStatus({ success: false, message: 'Please fill all GitHub fields' });
      return;
    }

    setTestingGithub(true);
    setGithubStatus(null);

    try {
      const response = await fetch(`https://api.github.com/repos/${config.github_username}/${config.github_repo}`, {
        headers: {
          'Authorization': `token ${config.github_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        setGithubStatus({ success: true, message: 'Connection successful! Repository found.' });
      } else if (response.status === 404) {
        setGithubStatus({ success: false, message: 'Repository not found. Check username and repo name.' });
      } else if (response.status === 401) {
        setGithubStatus({ success: false, message: 'Invalid token. Check your personal access token.' });
      } else {
        setGithubStatus({ success: false, message: `Error: ${response.status}` });
      }
    } catch (err) {
      setGithubStatus({ success: false, message: 'Connection failed. Check your internet.' });
    } finally {
      setTestingGithub(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Filter out empty strings from arrays
      const cleanConfig = {
        ...config,
        demo_videos: config.demo_videos.filter(v => v.trim()),
        portfolio_links: config.portfolio_links.filter(v => v.trim())
      };

      await api.put('/business-config', cleanConfig);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'business', name: 'Business Info', icon: Building2 },
    { id: 'pricing', name: 'Your Pricing', icon: Globe },
    { id: 'contact', name: 'Contact Info', icon: User },
    { id: 'github', name: 'GitHub', icon: Github }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="settings-page">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2" data-testid="back-to-dashboard">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">Dashboard</span>
            </Link>
            
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
            </Link>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-fire px-4 py-2 rounded text-sm flex items-center gap-2"
              data-testid="save-btn"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">
            <span className="text-white">BUSINESS</span>{' '}
            <span className="fire-text">SETTINGS</span>
          </h1>

          {error && (
            <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2" data-testid="settings-error">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-all ${
                  activeTab === tab.id
                    ? 'glass-fire text-white'
                    : 'glass text-gray-400 hover:text-white'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="glass rounded-lg p-6 sm:p-8">
            {/* Business Info Tab */}
            {activeTab === 'business' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={config.business_name}
                    onChange={(e) => handleChange('business_name', e.target.value)}
                    placeholder="Your Business Name"
                    className="w-full p-3 input-dark rounded"
                    data-testid="business-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">What do you offer? *</label>
                  <textarea
                    value={config.services_offered}
                    onChange={(e) => handleChange('services_offered', e.target.value)}
                    placeholder="Describe your services (e.g., AI-powered UGC video ads for e-commerce brands)"
                    rows={3}
                    className="w-full p-3 input-dark rounded resize-none"
                    data-testid="services-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={config.target_audience}
                    onChange={(e) => handleChange('target_audience', e.target.value)}
                    placeholder="Who are your ideal clients? (e.g., DTC brands, e-commerce stores)"
                    className="w-full p-3 input-dark rounded"
                    data-testid="audience-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Unique Value Proposition</label>
                  <textarea
                    value={config.unique_value_proposition}
                    onChange={(e) => handleChange('unique_value_proposition', e.target.value)}
                    placeholder="What makes you different? (e.g., 70% cheaper than traditional UGC, 24-48h delivery)"
                    rows={3}
                    className="w-full p-3 input-dark rounded resize-none"
                    data-testid="uvp-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Demo Videos (URLs)</label>
                  {config.demo_videos.map((video, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={video}
                        onChange={(e) => handleArrayChange('demo_videos', i, e.target.value)}
                        placeholder="https://example.com/demo.mp4"
                        className="flex-1 p-3 input-dark rounded"
                        data-testid={`demo-video-${i}`}
                      />
                      {config.demo_videos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('demo_videos', i)}
                          className="p-3 glass hover:bg-red-500/20 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem('demo_videos')}
                    className="flex items-center gap-2 text-sm text-[#FF4500] hover:text-[#FF8C00]"
                  >
                    <Plus className="w-4 h-4" /> Add another video
                  </button>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <p className="text-gray-400 text-sm mb-4">
                  Define your pricing tiers. These will appear in your proposals.
                </p>

                {config.pricing_tiers.map((tier, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-lg space-y-4" data-testid={`pricing-tier-${i}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white">Tier {i + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removePricingTier(i)}
                        className="p-2 hover:bg-red-500/20 rounded text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => handlePricingTierChange(i, 'name', e.target.value)}
                          placeholder="e.g., Starter, Growth, Scale"
                          className="w-full p-2 input-dark rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Price</label>
                        <input
                          type="text"
                          value={tier.price}
                          onChange={(e) => handlePricingTierChange(i, 'price', e.target.value)}
                          placeholder="e.g., $750, $1,500/mo"
                          className="w-full p-2 input-dark rounded text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) => handlePricingTierChange(i, 'description', e.target.value)}
                        placeholder="Brief description of this tier"
                        className="w-full p-2 input-dark rounded text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Features (comma-separated)</label>
                      <textarea
                        value={tier.features}
                        onChange={(e) => handlePricingTierChange(i, 'features', e.target.value)}
                        placeholder="10 videos, 48-hour delivery, 1 revision"
                        rows={2}
                        className="w-full p-2 input-dark rounded text-sm resize-none"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPricingTier}
                  className="w-full py-3 glass hover:bg-white/5 rounded flex items-center justify-center gap-2 text-[#FF4500]"
                  data-testid="add-tier-btn"
                >
                  <Plus className="w-5 h-5" /> Add Pricing Tier
                </button>
              </div>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Your Name *</label>
                    <input
                      type="text"
                      value={config.owner_name}
                      onChange={(e) => handleChange('owner_name', e.target.value)}
                      placeholder="Your full name"
                      className="w-full p-3 input-dark rounded"
                      data-testid="owner-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email *</label>
                    <input
                      type="email"
                      value={config.owner_email}
                      onChange={(e) => handleChange('owner_email', e.target.value)}
                      placeholder="you@example.com"
                      className="w-full p-3 input-dark rounded"
                      data-testid="owner-email-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Profile Photo URL</label>
                  <input
                    type="url"
                    value={config.owner_photo_url}
                    onChange={(e) => handleChange('owner_photo_url', e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full p-3 input-dark rounded"
                    data-testid="photo-url-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Calendar Link (Calendly, Cal.com, etc.)</label>
                  <input
                    type="url"
                    value={config.calendar_link}
                    onChange={(e) => handleChange('calendar_link', e.target.value)}
                    placeholder="https://cal.com/yourname/15min"
                    className="w-full p-3 input-dark rounded"
                    data-testid="calendar-link-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={config.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full p-3 input-dark rounded"
                    data-testid="website-url-input"
                  />
                </div>
              </div>
            )}

            {/* GitHub Tab */}
            {activeTab === 'github' && (
              <div className="space-y-6">
                {user?.plan === 'free' ? (
                  <div className="text-center py-8">
                    <Github className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">GitHub Hosting</h3>
                    <p className="text-gray-400 mb-6">
                      Host proposals on your own GitHub repository. Available on paid plans.
                    </p>
                    <Link to="/pricing" className="btn-fire px-6 py-2 rounded" data-testid="upgrade-for-github">
                      Upgrade to Enable
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
                      <h4 className="font-bold text-blue-400 mb-2">Setup Instructions</h4>
                      <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                        <li>Create a new GitHub repository (must be public for GitHub Pages)</li>
                        <li>Enable GitHub Pages in repository Settings → Pages</li>
                        <li>Generate a Personal Access Token at github.com/settings/tokens</li>
                        <li>Select "repo" scope when creating the token</li>
                        <li>Enter your details below and test the connection</li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">GitHub Username</label>
                      <input
                        type="text"
                        value={config.github_username}
                        onChange={(e) => handleChange('github_username', e.target.value)}
                        placeholder="yourusername"
                        className="w-full p-3 input-dark rounded"
                        data-testid="github-username-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Repository Name</label>
                      <input
                        type="text"
                        value={config.github_repo}
                        onChange={(e) => handleChange('github_repo', e.target.value)}
                        placeholder="proposals"
                        className="w-full p-3 input-dark rounded"
                        data-testid="github-repo-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Personal Access Token</label>
                      <div className="relative">
                        <input
                          type={showGithubToken ? 'text' : 'password'}
                          value={config.github_token}
                          onChange={(e) => handleChange('github_token', e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full p-3 pr-12 input-dark rounded"
                          data-testid="github-token-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGithubToken(!showGithubToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          {showGithubToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={testGithubConnection}
                      disabled={testingGithub}
                      className="btn-outline-fire px-6 py-2 rounded flex items-center gap-2"
                      data-testid="test-github-btn"
                    >
                      {testingGithub ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      Test Connection
                    </button>

                    {githubStatus && (
                      <div className={`p-4 rounded flex items-center gap-2 ${
                        githubStatus.success 
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                          : 'bg-red-500/10 border border-red-500/20 text-red-400'
                      }`} data-testid="github-status">
                        {githubStatus.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {githubStatus.message}
                      </div>
                    )}

                    {config.github_username && config.github_repo && (
                      <div className="p-4 bg-white/5 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Your proposals will be hosted at:</p>
                        <code className="text-[#FF4500] text-sm">
                          https://{config.github_username}.github.io/{config.github_repo}/[proposal-slug].html
                        </code>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
