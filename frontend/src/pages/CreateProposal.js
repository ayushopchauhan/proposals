import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { 
  Flame, ArrowLeft, ArrowRight, FileText, User, Upload,
  Briefcase, Globe, Mail, Linkedin, Building2, Sparkles,
  Loader2, CheckCircle, AlertCircle, Copy, ExternalLink,
  X
} from 'lucide-react';

// Platform options for job description
const platforms = [
  { id: 'upwork', name: 'Upwork', color: '#6FDA44' },
  { id: 'fiverr', name: 'Fiverr', color: '#1DBF73' },
  { id: 'freelancer', name: 'Freelancer', color: '#29B2FE' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
  { id: 'cold_email', name: 'Cold Email', color: '#FF4500' },
  { id: 'other', name: 'Other', color: '#6B7280' }
];

// Input method tabs
const inputMethods = [
  { id: 'job_description', name: 'Job Description', icon: FileText, desc: 'Paste from Upwork, Fiverr, etc.' },
  { id: 'single_lead', name: 'Single Lead', icon: User, desc: 'Enter lead details manually' },
  { id: 'csv', name: 'CSV Upload', icon: Upload, desc: 'Upload multiple leads' }
];

const CreateProposal = () => {
  const { user, api, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [inputMethod, setInputMethod] = useState('job_description');
  const [platform, setPlatform] = useState('upwork');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  
  // Form states
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  
  // Single lead form
  const [leadForm, setLeadForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    company_website: '',
    company_description: '',
    job_title: '',
    linkedin: '',
    industry: ''
  });
  
  // CSV upload
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  
  // Processing states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalResult, setProposalResult] = useState(null);
  const [error, setError] = useState('');

  const handleLeadFormChange = (field, value) => {
    setLeadForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setCsvFile(file);
    
    // Preview first few rows
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').slice(0, 6);
      setCsvPreview(lines);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }
    
    // Check proposal limits
    const remaining = (user?.proposals_limit || 5) - (user?.proposals_used || 0);
    if (remaining <= 0) {
      setError('You have reached your proposal limit. Please upgrade your plan.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (inputMethod === 'csv' && csvFile) {
        // CSV upload
        const formData = new FormData();
        formData.append('file', csvFile);
        
        response = await api.post('/proposals/batch', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Navigate to dashboard for batch
        navigate('/dashboard');
        return;
      } else {
        // Single proposal
        const leadInput = {
          input_type: inputMethod,
          platform: platform,
          job_description: inputMethod === 'job_description' ? jobDescription : '',
          job_url: inputMethod === 'job_description' ? jobUrl : '',
          additional_context: additionalContext,
          ...leadForm
        };
        
        response = await api.post('/proposals', { lead_input: leadInput });
        setProposalResult(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Render result screen
  if (proposalResult) {
    const isCompleted = proposalResult.status === 'completed';
    const isProcessing = ['pending', 'processing'].includes(proposalResult.status);
    const isFailed = proposalResult.status === 'failed';

    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4" data-testid="proposal-result">
        <div className="noise-overlay" />
        
        <div className="max-w-lg w-full text-center">
          {isProcessing && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center animate-pulse-fire">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Creating Your Proposal</h2>
              <p className="text-gray-400 mb-8">
                Our AI is researching and crafting a personalized proposal. This typically takes 30-60 seconds.
              </p>
              
              {/* Progress Steps */}
              <div className="space-y-4 text-left glass p-6 rounded-lg mb-8">
                {['Analyzing lead data', 'Scraping company website', 'Generating personalization', 'Building proposal'].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#FF4500] animate-spin" />
                    <span className="text-gray-300">{step}...</span>
                  </div>
                ))}
              </div>
              
              <Link to="/dashboard" className="text-[#FF4500] hover:text-[#FF8C00]">
                View in Dashboard →
              </Link>
            </>
          )}
          
          {isCompleted && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center glow-fire">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Proposal Ready!</h2>
              <p className="text-gray-400 mb-8">
                Your AI-powered proposal has been generated and is ready to share.
              </p>
              
              {proposalResult.icp_score && (
                <div className="glass-fire p-6 rounded-lg mb-6">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold fire-text">{proposalResult.icp_score}</div>
                      <div className="text-sm text-gray-400">ICP Score</div>
                    </div>
                    {proposalResult.recommended_tier && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{proposalResult.recommended_tier}</div>
                        <div className="text-sm text-gray-400">Recommended Tier</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {proposalResult.proposal_url && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 glass rounded">
                    <input 
                      type="text" 
                      value={proposalResult.proposal_url} 
                      readOnly 
                      className="flex-1 bg-transparent text-gray-300 text-sm outline-none"
                      data-testid="proposal-url"
                    />
                    <button 
                      onClick={() => copyToClipboard(proposalResult.proposal_url)}
                      className="p-2 hover:bg-white/10 rounded"
                      data-testid="copy-url-btn"
                    >
                      <Copy className="w-4 h-4 text-[#FF4500]" />
                    </button>
                    <a 
                      href={proposalResult.proposal_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white/10 rounded"
                      data-testid="open-proposal-btn"
                    >
                      <ExternalLink className="w-4 h-4 text-[#FF4500]" />
                    </a>
                  </div>
                  
                  <div className="flex gap-4">
                    <Link 
                      to="/dashboard" 
                      className="flex-1 btn-outline-fire py-3 rounded text-center"
                      data-testid="back-to-dashboard-btn"
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => {
                        setProposalResult(null);
                        setJobDescription('');
                        setLeadForm({
                          first_name: '',
                          last_name: '',
                          email: '',
                          company_name: '',
                          company_website: '',
                          company_description: '',
                          job_title: '',
                          linkedin: '',
                          industry: ''
                        });
                      }}
                      className="flex-1 btn-fire py-3 rounded"
                      data-testid="create-another-btn"
                    >
                      Create Another
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          
          {isFailed && (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Something Went Wrong</h2>
              <p className="text-gray-400 mb-8">
                {proposalResult.error_message || 'Failed to generate proposal. Please try again.'}
              </p>
              <button 
                onClick={() => setProposalResult(null)}
                className="btn-fire px-8 py-3 rounded"
                data-testid="try-again-btn"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="create-proposal">
      <div className="noise-overlay" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">Back</span>
            </Link>
            
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF4500] to-[#FF8C00] flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-white">PITCH</span>
                <span className="fire-text">FIRE</span>
              </span>
            </Link>
            
            <div className="text-sm text-gray-400">
              {isAuthenticated ? (
                <span>{(user?.proposals_limit || 5) - (user?.proposals_used || 0)} proposals left</span>
              ) : (
                <button onClick={() => openAuth('login')} className="text-[#FF4500]" data-testid="login-link">
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-white">CREATE</span>{' '}
              <span className="fire-text">PROPOSAL</span>
            </h1>
            <p className="text-gray-400">Enter your lead's information and let AI do the rest</p>
          </div>

          {/* Input Method Tabs */}
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {inputMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setInputMethod(method.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-lg transition-all ${
                  inputMethod === method.id 
                    ? 'glass-fire glow-fire' 
                    : 'glass hover:bg-white/5'
                }`}
                data-testid={`method-${method.id}`}
              >
                <method.icon className={`w-5 h-5 ${inputMethod === method.id ? 'text-[#FF4500]' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className={`font-medium ${inputMethod === method.id ? 'text-white' : 'text-gray-300'}`}>
                    {method.name}
                  </div>
                  <div className="text-xs text-gray-500">{method.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="glass rounded-lg p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2" data-testid="error-message">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Job Description Input */}
            {inputMethod === 'job_description' && (
              <div className="space-y-6">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                          platform === p.id 
                            ? 'text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                        style={{ 
                          backgroundColor: platform === p.id ? p.color : 'transparent',
                          border: `1px solid ${platform === p.id ? p.color : 'rgba(255,255,255,0.1)'}`
                        }}
                        data-testid={`platform-${p.id}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Job URL (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Job URL (optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      placeholder="https://www.upwork.com/jobs/..."
                      className="w-full pl-10 pr-4 py-3 input-dark rounded"
                      data-testid="job-url-input"
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Description <span className="text-[#FF4500]">*</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    required
                    rows={8}
                    className="w-full p-4 input-dark rounded resize-none"
                    data-testid="job-description-input"
                  />
                </div>
              </div>
            )}

            {/* Single Lead Form */}
            {inputMethod === 'single_lead' && (
              <div className="space-y-6">
                {/* Name Row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                    <input
                      type="text"
                      value={leadForm.first_name}
                      onChange={(e) => handleLeadFormChange('first_name', e.target.value)}
                      placeholder="John"
                      className="w-full p-3 input-dark rounded"
                      data-testid="first-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={leadForm.last_name}
                      onChange={(e) => handleLeadFormChange('last_name', e.target.value)}
                      placeholder="Doe"
                      className="w-full p-3 input-dark rounded"
                      data-testid="last-name-input"
                    />
                  </div>
                </div>

                {/* Email & LinkedIn */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => handleLeadFormChange('email', e.target.value)}
                        placeholder="john@company.com"
                        className="w-full pl-10 pr-4 py-3 input-dark rounded"
                        data-testid="email-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn (optional)</label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="url"
                        value={leadForm.linkedin}
                        onChange={(e) => handleLeadFormChange('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/johndoe"
                        className="w-full pl-10 pr-4 py-3 input-dark rounded"
                        data-testid="linkedin-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name <span className="text-[#FF4500]">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        value={leadForm.company_name}
                        onChange={(e) => handleLeadFormChange('company_name', e.target.value)}
                        placeholder="Acme Inc"
                        required
                        className="w-full pl-10 pr-4 py-3 input-dark rounded"
                        data-testid="company-name-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="url"
                        value={leadForm.company_website}
                        onChange={(e) => handleLeadFormChange('company_website', e.target.value)}
                        placeholder="https://acme.com"
                        className="w-full pl-10 pr-4 py-3 input-dark rounded"
                        data-testid="company-website-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Title & Industry */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="text"
                        value={leadForm.job_title}
                        onChange={(e) => handleLeadFormChange('job_title', e.target.value)}
                        placeholder="Marketing Manager"
                        className="w-full pl-10 pr-4 py-3 input-dark rounded"
                        data-testid="job-title-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                    <input
                      type="text"
                      value={leadForm.industry}
                      onChange={(e) => handleLeadFormChange('industry', e.target.value)}
                      placeholder="E-commerce"
                      className="w-full p-3 input-dark rounded"
                      data-testid="industry-input"
                    />
                  </div>
                </div>

                {/* Company Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Description (optional)</label>
                  <textarea
                    value={leadForm.company_description}
                    onChange={(e) => handleLeadFormChange('company_description', e.target.value)}
                    placeholder="Brief description of what the company does..."
                    rows={4}
                    className="w-full p-4 input-dark rounded resize-none"
                    data-testid="company-description-input"
                  />
                </div>
              </div>
            )}

            {/* CSV Upload */}
            {inputMethod === 'csv' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Upload CSV File</label>
                  <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-[#FF4500]/50 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="hidden"
                      id="csv-upload"
                      data-testid="csv-upload-input"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-300 mb-2">
                        {csvFile ? csvFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-gray-500">CSV file with columns: first_name, last_name, email, company_name, company_website</p>
                    </label>
                  </div>
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preview</label>
                    <div className="bg-[#121212] rounded p-4 overflow-x-auto">
                      <code className="text-xs text-gray-400 whitespace-pre">
                        {csvPreview.join('\n')}
                      </code>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{csvPreview.length - 1} leads detected</p>
                  </div>
                )}
              </div>
            )}

            {/* Additional Context (for all methods) */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Context (optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any specific angle or information you want to emphasize in the proposal..."
                rows={3}
                className="w-full p-4 input-dark rounded resize-none"
                data-testid="additional-context-input"
              />
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-fire py-4 rounded text-lg font-bold flex items-center justify-center gap-2 glow-fire disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Proposal <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  You'll need to sign up to view your proposal
                </p>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialMode={authMode}
      />
    </div>
  );
};

export default CreateProposal;
