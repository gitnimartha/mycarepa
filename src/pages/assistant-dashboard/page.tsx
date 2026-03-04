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
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
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
          expiry: Date.now() + 8 * 60 * 60 * 1000
        }));
        setStatus('idle');
      } else {
        setMessage('Invalid password');
        setStatus('error');
      }
    } catch {
      setMessage('Network error');
      setStatus('error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword('');
    setCustomer(null);
    setSearchQuery('');
    setSearchResults([]);
    localStorage.removeItem('assistant_session');
  };

  const selectCustomer = async (selectedCustomer: SearchResult) => {
    setShowDropdown(false);
    setSearchQuery(selectedCustomer.email);
    setStatus('loading');
    setMessage('');

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
    setStatus('loading');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/api/assistant/report-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.customerId,
          hours: parseFloat(hours),
          password,
          inputtedBy,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Successfully logged ${hours} hours!`);
        setStatus('success');
        setHours('');
        // Refresh customer data
        const refreshResponse = await fetch(`${API_URL}/api/assistant/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: customer.email, password }),
        });
        if (refreshResponse.ok) {
          setCustomer(await refreshResponse.json());
        }
      } else {
        setMessage(data.error || 'Failed to log usage');
        setStatus('error');
      }
    } catch {
      setMessage('Network error');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A8B89F] via-[#FFF8F0] to-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <i className="ri-user-settings-line text-[#A8B89F] text-3xl"></i>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2C2C2C]">
            Assistant Dashboard
          </h1>
          {isLoggedIn && (
            <button onClick={handleLogout} className="text-sm text-[#6B6B6B] hover:text-red-500 mt-1">
              <i className="ri-logout-box-line mr-1"></i>Logout
            </button>
          )}
        </div>

        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none"
                placeholder="Enter assistant password"
                required
              />
            </div>
            {status === 'error' && (
              <p className="text-red-500 text-sm">{message}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Customer Search with Autocomplete */}
            <div ref={searchRef} className="relative">
              <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                Search Customer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCustomer(null);
                  }}
                  className="w-full px-4 py-2 pr-10 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none"
                  placeholder="Type name or email..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearching ? (
                    <i className="ri-loader-4-line animate-spin text-[#6B6B6B]"></i>
                  ) : (
                    <i className="ri-search-line text-[#6B6B6B]"></i>
                  )}
                </div>
              </div>

              {/* Dropdown Results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.customerId}
                      type="button"
                      onClick={() => selectCustomer(result)}
                      className="w-full px-4 py-3 text-left hover:bg-[#FFF8F0] border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[#2C2C2C]">
                            {result.name || 'No Name'}
                          </p>
                          <p className="text-sm text-[#6B6B6B]">{result.email}</p>
                        </div>
                        {result.hasSubscription && (
                          <span className="text-xs px-2 py-1 bg-[#A8B89F] text-white rounded-full">
                            {result.plan}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg p-4 text-center text-[#6B6B6B]">
                  No customers found
                </div>
              )}
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {message}
              </div>
            )}

            {/* Success Message */}
            {status === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            {/* Customer Card */}
            {customer && (
              <div className="bg-[#FFF8F0] rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#A8B89F] rounded-full flex items-center justify-center">
                    <i className="ri-user-line text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2C2C2C]">{customer.customerName || 'No Name'}</h3>
                    <p className="text-sm text-[#6B6B6B]">{customer.email}</p>
                  </div>
                </div>

                {customer.hasSubscription ? (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-center py-4 border-y border-gray-200">
                      <div>
                        <p className="text-2xl font-bold text-[#A8B89F]">{customer.remainingHours}</p>
                        <p className="text-xs text-[#6B6B6B]">Hours Left</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#6B6B6B]">{customer.usedHours}</p>
                        <p className="text-xs text-[#6B6B6B]">Used</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#6B6B6B]">{customer.includedHours}</p>
                        <p className="text-xs text-[#6B6B6B]">Included</p>
                      </div>
                    </div>

                    <div className="text-sm text-[#6B6B6B]">
                      <p><strong>Plan:</strong> {customer.plan?.toUpperCase()}</p>
                      <p><strong>Period:</strong> {customer.periodStartDate} - {customer.periodEndDate}</p>
                    </div>

                    {/* Add Usage Form */}
                    <form onSubmit={handleReportUsage} className="pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="w-full sm:w-28">
                          <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                            Hours Used:
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none text-center"
                            placeholder="e.g. 0.5"
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                            Logged by:
                          </label>
                          <input
                            type="text"
                            value={inputtedBy}
                            onChange={(e) => setInputtedBy(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none"
                            placeholder="Your name"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={status === 'loading' || !hours || !inputtedBy}
                        className="w-full px-6 py-2 bg-[#A8B89F] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {status === 'loading' ? 'Adding...' : 'Add Hours'}
                      </button>
                    </form>
                  </>
                ) : (
                  <p className="text-[#6B6B6B] text-center py-4">No active subscription</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <Link to="/" className="text-sm text-[#6B6B6B] hover:text-[#A8B89F]">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
