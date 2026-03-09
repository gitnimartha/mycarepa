import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, CALENDLY_URL_MEMBERS } from '../../config/api';

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

// Plan hierarchy for upgrade options
const PLAN_ORDER = ['trial', 'starter', 'plus', 'pro'];
const PLAN_DETAILS: Record<string, { name: string; price: string; hours: number }> = {
  starter: { name: 'Starter', price: '$99/mo', hours: 4 },
  plus: { name: 'Plus', price: '$249/mo', hours: 10 },
  pro: { name: 'Pro', price: '$499/mo', hours: 20 },
};

export default function SchedulePage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending-code' | 'code-sent' | 'verifying' | 'verified' | 'no-hours' | 'error'>('idle');
  const [customerData, setCustomerData] = useState<{
    canSchedule: boolean;
    customerId: string;
    customerName: string;
    plan: string;
    remainingHours: number;
    includedHours: number;
    usedHours: number;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [tempCode, setTempCode] = useState<string | null>(null);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);

  // Upgrade state
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Check for saved verified session
    const savedSession = localStorage.getItem('mycarepa_verified_session');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      // Check if session is still valid (30 days)
      if (session.expiry > Date.now()) {
        setEmail(session.email);
        setIsAutoVerifying(true);
        // Auto-verify by fetching customer data
        fetchCustomerData(session.email);
      } else {
        // Clear expired session
        localStorage.removeItem('mycarepa_verified_session');
      }
    }
  }, []);

  const fetchCustomerData = async (verifiedEmail: string) => {
    setStatus('verifying');
    try {
      const response = await fetch(`${API_URL}/api/verify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail.toLowerCase(), code: 'saved-session' }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Session invalid, clear it
        localStorage.removeItem('mycarepa_verified_session');
        setIsAutoVerifying(false);
        setStatus('idle');
        return;
      }

      setCustomerData(data);
      setIsAutoVerifying(false);
      if (data.canSchedule) {
        setStatus('verified');
      } else {
        setStatus('no-hours');
      }
    } catch {
      localStorage.removeItem('mycarepa_verified_session');
      setIsAutoVerifying(false);
      setStatus('idle');
    }
  };

  const clearSession = () => {
    localStorage.removeItem('mycarepa_verified_session');
    setEmail('');
    setCode('');
    setCustomerData(null);
    setStatus('idle');
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending-code');
    setErrorMessage('');
    setTempCode(null);

    try {
      const response = await fetch(`${API_URL}/api/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to send verification code.');
        setStatus('error');
        return;
      }

      if (data._tempCode) {
        setTempCode(data._tempCode);
      }

      setStatus('code-sent');
    } catch {
      setErrorMessage('Network error. Please try again.');
      setStatus('error');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('verifying');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/api/verify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), code }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to verify code.');
        setStatus('code-sent');
        return;
      }

      setCustomerData(data);
      if (data.canSchedule) {
        setStatus('verified');
      } else {
        setStatus('no-hours');
      }

      // Save verified session to localStorage (30 days)
      localStorage.setItem('mycarepa_verified_session', JSON.stringify({
        email: email.toLowerCase(),
        expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
      }));
    } catch {
      setErrorMessage('Network error. Please try again.');
      setStatus('code-sent');
    }
  };

  const handleResendCode = async () => {
    setCode('');
    setErrorMessage('');
    setStatus('sending-code');

    try {
      const response = await fetch(`${API_URL}/api/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to send verification code.');
        setStatus('code-sent');
        return;
      }

      if (data._tempCode) {
        setTempCode(data._tempCode);
      }

      setStatus('code-sent');
    } catch {
      setErrorMessage('Network error. Please try again.');
      setStatus('code-sent');
    }
  };

  const openCalendly = () => {
    const calendlyUrl = `${CALENDLY_URL_MEMBERS}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(customerData?.customerName || '')}&utm_content=${encodeURIComponent(customerData?.customerId || '')}`;
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: calendlyUrl });
    } else {
      window.open(calendlyUrl, '_blank');
    }
  };

  // Get available upgrade options based on current plan
  const getUpgradeOptions = () => {
    if (!customerData) return [];
    const currentPlanIndex = PLAN_ORDER.indexOf(customerData.plan.toLowerCase());
    return PLAN_ORDER
      .slice(currentPlanIndex + 1)
      .filter(plan => plan !== 'trial' && PLAN_DETAILS[plan]);
  };

  const handleUpgrade = async (newPlan: string) => {
    if (!customerData) return;

    setUpgrading(true);
    setUpgradeMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/upgrade-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerData.customerId,
          newPlan,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setUpgradeMessage({ type: 'error', text: data.message || data.error || 'Upgrade failed' });
        setUpgrading(false);
        return;
      }

      // Success - update customer data
      setUpgradeMessage({ type: 'success', text: data.message });
      setShowUpgradeOptions(false);

      // Refresh customer data to get new hours
      setTimeout(() => {
        fetchCustomerData(email);
      }, 1500);
    } catch (error) {
      console.error('Upgrade error:', error);
      setUpgradeMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFD4C4] via-[#FFF8F0] to-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <i className="ri-heart-fill text-[#A8B89F] text-3xl"></i>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#2C2C2C] mb-2">
            Schedule a Meeting
          </h1>
          {(status === 'code-sent' || status === 'verifying') && (
            <p className="text-[#6B6B6B]">
              Enter the verification code sent to your email.
            </p>
          )}
        </div>

        {/* Auto-verification loading state */}
        {isAutoVerifying && status === 'verifying' ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#A8B89F] border-t-transparent mx-auto mb-4"></div>
            <p className="text-[#6B6B6B]">Loading your account...</p>
          </div>
        ) : /* Step 1: Email Entry */
        (status === 'idle' || status === 'sending-code' || (status === 'error' && !code)) ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none transition-colors duration-200"
                placeholder="your@email.com"
              />
            </div>

            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <i className="ri-error-warning-line mr-2"></i>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending-code'}
              className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {status === 'sending-code' ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (status === 'code-sent' || status === 'verifying') ? (
          /* Step 2: Code Entry */
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="bg-[#E8F4E8] rounded-lg p-4 mb-4">
              <p className="text-sm text-[#2C2C2C]">
                <i className="ri-mail-check-line mr-2 text-[#A8B89F]"></i>
                Code sent to <strong>{email}</strong>
              </p>
            </div>

            {tempCode && (
              <div className="bg-[#FFD4C4] border-2 border-[#A8B89F] rounded-lg p-4 mb-4 relative">
                <button
                  type="button"
                  onClick={() => setTempCode(null)}
                  className="absolute top-2 right-2 text-[#6B6B6B] hover:text-[#2C2C2C]"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
                <p className="text-xs text-[#6B6B6B] mb-1">Demo Mode - Your code:</p>
                <p className="text-2xl font-mono font-bold text-[#2C2C2C] tracking-widest">{tempCode}</p>
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none transition-colors duration-200 text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <i className="ri-error-warning-line mr-2"></i>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'verifying' || code.length !== 6}
              className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              {status === 'verifying' ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => { setStatus('idle'); setCode(''); setErrorMessage(''); }}
                className="text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[#A8B89F] hover:underline"
              >
                Resend code
              </button>
            </div>
          </form>
        ) : status === 'verified' && customerData ? (
          <div className="text-center">
            <div className="bg-[#E8F4E8] rounded-2xl p-6 mb-6">
              <i className="ri-checkbox-circle-fill text-4xl text-[#A8B89F] mb-3"></i>
              <h3 className="font-semibold text-[#2C2C2C] mb-2">
                Welcome back, {customerData.customerName || 'Member'}!
              </h3>
              <p className="text-[#6B6B6B] text-sm mb-2">{customerData.message}</p>
              <p className="text-xs text-[#A8B89F] font-medium mb-4">
                Current Plan: {customerData.plan.toUpperCase()}
              </p>
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <span className="text-2xl font-bold text-[#A8B89F]">{customerData.remainingHours}</span>
                  <p className="text-[#6B6B6B]">Hours Left</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#6B6B6B]">{customerData.usedHours}</span>
                  <p className="text-[#6B6B6B]">Hours Used</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#6B6B6B]">{customerData.includedHours}</span>
                  <p className="text-[#6B6B6B]">Total Hours</p>
                </div>
              </div>
            </div>

            {/* Upgrade message */}
            {upgradeMessage && (
              <div className={`mb-4 p-4 rounded-lg text-sm ${
                upgradeMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <i className={`mr-2 ${upgradeMessage.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}`}></i>
                {upgradeMessage.text}
              </div>
            )}

            <button
              onClick={openCalendly}
              className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <i className="ri-calendar-line mr-2"></i>
              Schedule Meeting
            </button>

            {/* Upgrade button - only show if not on Pro */}
            {getUpgradeOptions().length > 0 && (
              <button
                onClick={() => setShowUpgradeOptions(!showUpgradeOptions)}
                className="mt-3 w-full px-6 py-3 border-2 border-[#A8B89F] text-[#A8B89F] font-semibold rounded-full hover:bg-[#A8B89F] hover:text-white transition-all duration-300 cursor-pointer"
              >
                <i className="ri-arrow-up-circle-line mr-2"></i>
                {showUpgradeOptions ? 'Hide Options' : 'Upgrade Plan'}
              </button>
            )}

            {/* Upgrade options */}
            {showUpgradeOptions && (
              <div className="mt-4 space-y-3">
                {getUpgradeOptions().map(plan => (
                  <button
                    key={plan}
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-[#A8B89F] transition-colors text-left disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-[#2C2C2C]">{PLAN_DETAILS[plan].name}</span>
                        <span className="text-[#6B6B6B] text-sm ml-2">({PLAN_DETAILS[plan].hours} hrs/mo)</span>
                      </div>
                      <span className="text-[#A8B89F] font-semibold">{PLAN_DETAILS[plan].price}</span>
                    </div>
                  </button>
                ))}
                <p className="text-xs text-[#6B6B6B] mt-2">
                  Upgrade takes effect immediately. Prorated charges apply.
                </p>
              </div>
            )}

            <button
              onClick={clearSession}
              className="mt-4 text-sm text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
            >
              Not {customerData.customerName || email}? Click here
            </button>
          </div>
        ) : status === 'no-hours' && customerData ? (
          <div className="text-center">
            <div className="bg-[#FFF8F0] rounded-2xl p-6 mb-6">
              <i className="ri-time-line text-4xl text-[#FFB347] mb-3"></i>
              <h3 className="font-semibold text-[#2C2C2C] mb-2">
                No Hours Remaining
              </h3>
              <p className="text-[#6B6B6B] text-sm mb-2">{customerData.message}</p>
              <p className="text-xs text-[#A8B89F] font-medium mb-4">
                Current Plan: {customerData.plan.toUpperCase()}
              </p>
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <span className="text-2xl font-bold text-[#FFB347]">0</span>
                  <p className="text-[#6B6B6B]">Hours Left</p>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[#6B6B6B]">{customerData.usedHours}</span>
                  <p className="text-[#6B6B6B]">Hours Used</p>
                </div>
              </div>
            </div>

            {/* Upgrade message */}
            {upgradeMessage && (
              <div className={`mb-4 p-4 rounded-lg text-sm ${
                upgradeMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <i className={`mr-2 ${upgradeMessage.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}`}></i>
                {upgradeMessage.text}
              </div>
            )}

            {/* Upgrade options - show directly for no-hours users */}
            {getUpgradeOptions().length > 0 ? (
              <div className="space-y-3 mb-4">
                <p className="text-sm font-medium text-[#2C2C2C]">Upgrade to get more hours:</p>
                {getUpgradeOptions().map(plan => (
                  <button
                    key={plan}
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading}
                    className="w-full p-4 border-2 border-[#A8B89F] rounded-xl hover:bg-[#A8B89F] hover:text-white transition-colors text-left disabled:opacity-50 cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-[#2C2C2C] group-hover:text-white">{PLAN_DETAILS[plan].name}</span>
                        <span className="text-[#6B6B6B] group-hover:text-white/80 text-sm ml-2">({PLAN_DETAILS[plan].hours} hrs/mo)</span>
                      </div>
                      <span className="text-[#A8B89F] group-hover:text-white font-semibold">{PLAN_DETAILS[plan].price}</span>
                    </div>
                  </button>
                ))}
                <p className="text-xs text-[#6B6B6B]">
                  Upgrade takes effect immediately. Prorated charges apply.
                </p>
              </div>
            ) : (
              <div className="bg-[#E8F4E8] rounded-xl p-4 mb-4">
                <p className="text-sm text-[#2C2C2C]">
                  <i className="ri-information-line mr-2 text-[#A8B89F]"></i>
                  You're on the Pro plan. You can still schedule meetings - additional hours will be billed at the overage rate.
                </p>
              </div>
            )}

            {/* Still allow scheduling with overage */}
            <button
              onClick={openCalendly}
              className="w-full px-8 py-4 bg-[#6B6B6B] text-white text-lg font-semibold rounded-full hover:bg-[#2C2C2C] transition-all duration-300 cursor-pointer mb-3"
            >
              <i className="ri-calendar-line mr-2"></i>
              Schedule Anyway (Overage Applies)
            </button>

            <button
              onClick={clearSession}
              className="mt-2 block w-full text-sm text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
            >
              Not {customerData.customerName || email}? Click here
            </button>
          </div>
        ) : null}

{/* Only show subscription prompt for non-verified users */}
        {status !== 'verified' && status !== 'no-hours' && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-[#6B6B6B] mb-2">
              Don't have a subscription yet?
            </p>
            <Link to="/#pricing" className="text-[#A8B89F] hover:underline font-medium">
              View Plans & Subscribe
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
