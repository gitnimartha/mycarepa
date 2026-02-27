import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../config/api';

export default function AssistantDashboardPage() {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
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
    localStorage.removeItem('assistant_session');
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setCustomer(null);
    try {
      const response = await fetch(`${API_URL}/api/assistant/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
            {/* Customer Lookup */}
            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] mb-2">Customer Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none"
                    placeholder="customer@email.com"
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-4 py-2 bg-[#2C2C2C] text-white rounded-lg hover:bg-[#444] transition-colors disabled:opacity-50"
                  >
                    <i className="ri-search-line"></i>
                  </button>
                </div>
              </div>
            </form>

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
                      <label className="block text-sm font-medium text-[#2C2C2C]">
                        Log Hours Used
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inputtedBy}
                          onChange={(e) => setInputtedBy(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none"
                          placeholder="Your name"
                          required
                        />
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          className="w-24 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none"
                          placeholder="Hours"
                          required
                        />
                        <button
                          type="submit"
                          disabled={status === 'loading' || !hours || !inputtedBy}
                          className="px-6 py-2 bg-[#A8B89F] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {status === 'loading' ? '...' : 'Add'}
                        </button>
                      </div>
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
