import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../config/api';

type SearchResult = {
  customerId: string;
  name: string;
  email: string;
  hasSubscription: boolean;
  plan: string | null;
};

export default function AssistantDashboardPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [hours, setHours] = useState('');
  const [inputtedBy, setInputtedBy] = useState('');
  const [customer, setCustomer] = useState<{
    customerId: string;
    customerName: string;
    email: string;
    hasSubscription: boolean;
    plan?: string;
    includedHours?: number;
    usedHours?: number;
    remainingHours?: number;
    periodStartDate?: string;
    periodEndDate?: string;
    subscriptions?: Array<{
      subscriptionId: string;
      customerId: string;
      customerName: string;
      plan: string;
      includedHours: number;
      usedHours: number;
      remainingHours: number;
      periodStartDate: string;
      periodEndDate: string;
      hasSubscription: boolean;
    }>;
  } | null>(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const saved = localStorage.getItem('assistant_session');
    if (saved) {
      const session = JSON.parse(saved);
      if (session.expiry > Date.now()) {
        setPassword(session.password);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('assistant_session');
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`${API_URL}/api/assistant/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, password }),
        });
        const data = await response.json();
        if (response.ok) {
          setSearchResults(data.customers);
          setShowDropdown(data.customers.length > 0);
        }
      } catch {
        console.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/assistant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setIsLoggedIn(true);
        localStorage.setItem('assistant_session', JSON.stringify({
          password,
          expiry: Date.now() + 8 * 60 * 60 * 1000,
        }));
        setStatus('idle');
      } else {
        setMessage('Invalid password. Please try again.');
        setStatus('error');
      }
    } catch {
      setMessage('Network error. Please check your connection.');
      setStatus('error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    setCustomer(null);
    setSelectedSubIndex(0);
    setSearchQuery('');
    setSearchResults([]);
    localStorage.removeItem('assistant_session');
  };

  const selectCustomer = async (selectedCustomer: SearchResult) => {
    setShowDropdown(false);
    setSearchQuery(selectedCustomer.email);
    setStatus('loading');
    setMessage('');
    setSelectedSubIndex(0);
    try {
      const response = await fetch(`${API_URL}/api/assistant/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedCustomer.email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setCustomer(data);
        setStatus('idle');
      } else {
        setMessage(data.error || 'Customer not found');
        setStatus('error');
      }
    } catch {
      setMessage('Network error');
      setStatus('error');
    }
  };

  const handleReportUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    const subs = customer.subscriptions || [];
    const selectedSub = subs[selectedSubIndex];
    const customerId = selectedSub?.customerId || customer.customerId;

    const hoursToAdd = parseFloat(hours);
    const previousCustomer = { ...customer, subscriptions: customer.subscriptions ? [...customer.subscriptions] : undefined };

    // Optimistic update
    if (customer.subscriptions && customer.subscriptions[selectedSubIndex]) {
      const updatedSubs = [...customer.subscriptions];
      updatedSubs[selectedSubIndex] = {
        ...updatedSubs[selectedSubIndex],
        usedHours: updatedSubs[selectedSubIndex].usedHours + hoursToAdd,
        remainingHours: Math.max(0, updatedSubs[selectedSubIndex].remainingHours - hoursToAdd),
      };
      setCustomer({ ...customer, subscriptions: updatedSubs });
    } else {
      setCustomer({
        ...customer,
        usedHours: (customer.usedHours || 0) + hoursToAdd,
        remainingHours: Math.max(0, (customer.remainingHours || 0) - hoursToAdd),
      });
    }

    setMessage(`Successfully logged ${hours} hour${parseFloat(hours) !== 1 ? 's' : ''}!`);
    setStatus('success');
    setHours('');
    try {
      const response = await fetch(`${API_URL}/api/assistant/report-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          hours: hoursToAdd,
          password,
          inputtedBy,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setCustomer(previousCustomer);
        setMessage(data.error || 'Failed to log usage');
        setStatus('error');
      }
    } catch {
      setCustomer(previousCustomer);
      setMessage('Network error — hours not saved');
      setStatus('error');
    }
  };

  // Get selected subscription data
  const subs = customer?.subscriptions || [];
  const selectedSub = subs[selectedSubIndex];
  const displayData = selectedSub || customer;

  const usagePercent = displayData?.includedHours
    ? Math.min(100, Math.round(((displayData.usedHours || 0) / displayData.includedHours) * 100))
    : 0;

  const planColor = (plan?: string | null) => {
    if (!plan) return 'bg-gray-100 text-gray-600';
    const p = plan.toLowerCase();
    if (p.includes('premium') || p.includes('pro')) return 'bg-emerald-100 text-emerald-700';
    if (p.includes('basic') || p.includes('starter')) return 'bg-amber-100 text-amber-700';
    return 'bg-[#A8B89F]/20 text-[#5a7a52]';
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col">
      {/* Top bar */}
      <header className="w-full bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[#2C2C2C] hover:text-[#A8B89F] transition-colors">
          <i className="ri-heart-fill text-[#A8B89F] text-xl"></i>
          <span className="font-serif text-base font-semibold hidden sm:inline">My Care PA</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#A8B89F]"></div>
          <span className="text-sm font-medium text-[#2C2C2C]">Assistant Portal</span>
        </div>
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-logout-box-r-line"></i>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        )}
        {!isLoggedIn && <div className="w-20" />}
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl space-y-5">

          {/* Login Panel */}
          {!isLoggedIn ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#A8B89F]/30 to-[#FFF8F0] px-8 py-8 text-center border-b border-gray-100">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                  <i className="ri-shield-keyhole-line text-[#A8B89F] text-2xl"></i>
                </div>
                <h1 className="font-serif text-2xl font-bold text-[#2C2C2C]">Welcome back</h1>
                <p className="text-sm text-[#6B6B6B] mt-1">Sign in to access the assistant portal</p>
              </div>

              <form onSubmit={handleLogin} className="px-8 py-8 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                    Portal Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:border-[#A8B89F] focus:outline-none focus:ring-2 focus:ring-[#A8B89F]/20 transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                    </button>
                  </div>
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <i className="ri-error-warning-line flex-shrink-0"></i>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 bg-[#A8B89F] hover:bg-[#8FA085] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      Signing in…
                    </>
                  ) : (
                    <>
                      <i className="ri-login-box-line"></i>
                      Sign In
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Search Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="ri-search-2-line text-[#A8B89F]"></i>
                  Find a Customer
                </h2>
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCustomer(null);
                        setStatus('idle');
                        setMessage('');
                      }}
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:border-[#A8B89F] focus:outline-none focus:ring-2 focus:ring-[#A8B89F]/20 transition-all"
                      placeholder="Search by name or email…"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-gray-400">
                      <i className="ri-search-line text-base"></i>
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                      {isSearching ? (
                        <i className="ri-loader-4-line animate-spin text-[#A8B89F] text-base"></i>
                      ) : searchQuery.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(''); setCustomer(null); setStatus('idle'); setMessage(''); }}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <i className="ri-close-line text-base"></i>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                      {searchResults.map((result, idx) => (
                        <button
                          key={result.customerId}
                          type="button"
                          onClick={() => selectCustomer(result)}
                          className={`w-full px-4 py-3 text-left hover:bg-[#F7F5F2] transition-colors flex items-center justify-between gap-3 cursor-pointer ${idx < searchResults.length - 1 ? 'border-b border-gray-50' : ''}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#A8B89F]/20 flex items-center justify-center flex-shrink-0">
                              <i className="ri-user-line text-[#A8B89F] text-sm"></i>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#2C2C2C] truncate">{result.name || 'No Name'}</p>
                              <p className="text-xs text-[#6B6B6B] truncate">{result.email}</p>
                            </div>
                          </div>
                          {result.hasSubscription && result.plan && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${planColor(result.plan)}`}>
                              {result.plan}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg p-4 text-center text-sm text-[#6B6B6B]">
                      <i className="ri-user-search-line text-2xl text-gray-300 block mb-1"></i>
                      No customers found
                    </div>
                  )}
                </div>
              </div>

              {/* Status Messages */}
              {status === 'error' && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  <i className="ri-error-warning-line flex-shrink-0 text-base"></i>
                  {message}
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm">
                  <i className="ri-checkbox-circle-line flex-shrink-0 text-base"></i>
                  {message}
                </div>
              )}
              {status === 'loading' && !customer && (
                <div className="flex items-center gap-2 p-4 bg-white border border-gray-100 rounded-xl text-[#6B6B6B] text-sm">
                  <i className="ri-loader-4-line animate-spin flex-shrink-0 text-base text-[#A8B89F]"></i>
                  Loading customer…
                </div>
              )}

              {/* Customer Card */}
              {customer && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Customer Header */}
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A8B89F]/40 to-[#A8B89F]/10 flex items-center justify-center flex-shrink-0">
                      <i className="ri-user-3-line text-[#5a7a52] text-xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#2C2C2C] truncate">{customer.customerName || 'No Name'}</h3>
                      <p className="text-sm text-[#6B6B6B] truncate">{customer.email}</p>
                    </div>
                  </div>

                  {/* Subscription Tabs */}
                  {customer.subscriptions && customer.subscriptions.length > 1 && (
                    <div className="px-6 pt-4 pb-2 border-b border-gray-50">
                      <div className="flex gap-2 flex-wrap">
                        {customer.subscriptions.map((sub, idx) => {
                          const samePlanBefore = customer.subscriptions!.slice(0, idx).filter(s => s.plan.toUpperCase() === sub.plan.toUpperCase()).length;
                          const samePlanTotal = customer.subscriptions!.filter(s => s.plan.toUpperCase() === sub.plan.toUpperCase()).length;
                          const tabLabel = samePlanTotal > 1
                            ? `${sub.plan.toUpperCase()} (${samePlanBefore + 1})`
                            : sub.plan.toUpperCase();
                          return (
                            <button
                              key={sub.subscriptionId}
                              type="button"
                              onClick={() => setSelectedSubIndex(idx)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                selectedSubIndex === idx
                                  ? 'bg-[#A8B89F] text-white'
                                  : 'bg-gray-100 text-[#6B6B6B] hover:bg-gray-200'
                              }`}
                            >
                              {tabLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {customer.hasSubscription ? (
                    <>
                      {/* Plan Badge */}
                      <div className="px-6 pt-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${planColor(displayData?.plan)}`}>
                          {displayData?.plan?.toUpperCase()}
                        </span>
                      </div>

                      {/* Hours Stats */}
                      <div className="px-6 py-5 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-[#F7F5F2] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#A8B89F]">{displayData?.remainingHours ?? '—'}</p>
                            <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium">Remaining</p>
                          </div>
                          <div className="bg-[#F7F5F2] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#2C2C2C]">{displayData?.usedHours ?? '—'}</p>
                            <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium">Used</p>
                          </div>
                          <div className="bg-[#F7F5F2] rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-[#2C2C2C]">{displayData?.includedHours ?? '—'}</p>
                            <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium">Included</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[#6B6B6B]">Usage this period</span>
                            <span className="text-xs font-semibold text-[#2C2C2C]">{usagePercent}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${usagePercent >= 90 ? 'bg-red-400' : usagePercent >= 70 ? 'bg-amber-400' : 'bg-[#A8B89F]'}`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Period - hide for Trial since it's one-time, not recurring */}
                        {displayData?.plan !== 'trial' && (displayData?.periodStartDate || displayData?.periodEndDate) && (
                          <div className="flex items-center gap-2 text-xs text-[#6B6B6B] bg-[#F7F5F2] rounded-xl px-4 py-3">
                            <i className="ri-calendar-line text-[#A8B89F]"></i>
                            <span>
                              Billing period:&nbsp;
                              <strong className="text-[#2C2C2C]">{displayData?.periodStartDate}</strong>
                              &nbsp;→&nbsp;
                              <strong className="text-[#2C2C2C]">{displayData?.periodEndDate}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Log Hours Form */}
                      <div className="px-6 pb-6 border-t border-gray-50 pt-5">
                        <h4 className="text-sm font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
                          <i className="ri-time-line text-[#A8B89F]"></i>
                          Log Hours
                        </h4>
                        <form onSubmit={handleReportUsage} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Hours Used</label>
                              <input
                                type="number"
                                step="0.25"
                                min="0.25"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:border-[#A8B89F] focus:outline-none focus:ring-2 focus:ring-[#A8B89F]/20 transition-all"
                                placeholder="e.g. 0.5"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[#6B6B6B] mb-1.5">Logged By</label>
                              <input
                                type="text"
                                value={inputtedBy}
                                onChange={(e) => setInputtedBy(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-[#A8B89F] focus:outline-none focus:ring-2 focus:ring-[#A8B89F]/20 transition-all"
                                placeholder="Your name"
                                required
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={status === 'loading' || !hours || !inputtedBy}
                            className="w-full py-3 bg-[#A8B89F] hover:bg-[#8FA085] text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2 text-sm"
                          >
                            {status === 'loading' ? (
                              <>
                                <i className="ri-loader-4-line animate-spin"></i>
                                Saving…
                              </>
                            ) : (
                              <>
                                <i className="ri-add-circle-line"></i>
                                Log {hours ? `${hours} hr${parseFloat(hours) !== 1 ? 's' : ''}` : 'Hours'}
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="px-6 py-10 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="ri-forbid-line text-gray-400 text-xl"></i>
                      </div>
                      <p className="text-sm font-medium text-[#2C2C2C]">No active subscription</p>
                      <p className="text-xs text-[#6B6B6B] mt-1">This customer doesn't have a current plan.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer link */}
          <div className="text-center pb-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#A8B89F] transition-colors">
              <i className="ri-arrow-left-line text-xs"></i>
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
