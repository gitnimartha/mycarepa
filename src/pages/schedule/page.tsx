import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, CALENDLY_URL_MEMBERS } from '../../config/api';

// ─── MAINTENANCE MODE ───────────────────────────────────────────────
// Set to true to show the maintenance screen, false to allow scheduling
const MAINTENANCE_MODE = false;
// ────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

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
    subscriptions?: Array<{
      subscriptionId: string;
      customerId: string;
      customerName: string;
      plan: string;
      remainingHours: number;
      includedHours: number;
      usedHours: number;
      canSchedule: boolean;
    }>;
  } | null>(null);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [tempCode, setTempCode] = useState<string | null>(null);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showOverageTooltip, setShowOverageTooltip] = useState(false);

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
      setSelectedSubIndex(0);
      setIsAutoVerifying(false);
      // Show 'no-hours' view when remaining hours <= 0 (for overage warning)
      if (data.remainingHours > 0) {
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
    setSelectedSubIndex(0);
    setStatus('idle');
  };

  // Update status when switching between subscriptions with different hour balances
  useEffect(() => {
    if (customerData && (status === 'verified' || status === 'no-hours')) {
      const subs = customerData.subscriptions || [];
      const selectedSub = subs[selectedSubIndex] || customerData;
      const remainingHours = selectedSub.remainingHours ?? customerData.remainingHours;
      setStatus(remainingHours > 0 ? 'verified' : 'no-hours');
    }
  }, [selectedSubIndex, customerData]);

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
      setSelectedSubIndex(0);
      // Show 'no-hours' view when remaining hours <= 0 (for overage warning)
      if (data.remainingHours > 0) {
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
    const subs = customerData?.subscriptions || [];
    const selectedSub = subs[selectedSubIndex];
    const customerName = selectedSub?.customerName || customerData?.customerName || '';
    const customerId = selectedSub?.customerId || customerData?.customerId || '';
    const calendlyUrl = `${CALENDLY_URL_MEMBERS}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(customerName)}&utm_content=${encodeURIComponent(customerId)}`;
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: calendlyUrl });
    } else {
      window.open(calendlyUrl, '_blank');
    }
  };

  if (MAINTENANCE_MODE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFD4C4] via-[#FFF8F0] to-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 flex items-center justify-center bg-[#FFF0E8] rounded-full">
              <i className="ri-tools-line text-3xl text-[#A8B89F]"></i>
            </div>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-3">
            Scheduling Temporarily Unavailable
          </h1>
          <p className="text-[#6B6B6B] text-sm leading-relaxed mb-6">
            We're performing a quick update to improve your experience. Scheduling will be back shortly — thank you for your patience!
          </p>
          <p className="text-xs text-[#BBBBBB] mb-8">
            Need immediate help?{' '}
            <a href="mailto:support@mycarepa.com" className="underline hover:text-[#9B9B9B] transition-colors">
              Contact us
            </a>
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-3 bg-[#A8B89F] text-white text-sm font-semibold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-home-line mr-2"></i>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

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
            {/* Subscription Tabs */}
            {customerData.subscriptions && customerData.subscriptions.length > 1 && (
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {customerData.subscriptions.map((sub, idx) => {
                  const samePlanBefore = customerData.subscriptions!.slice(0, idx).filter(s => s.plan.toUpperCase() === sub.plan.toUpperCase()).length;
                  const samePlanTotal = customerData.subscriptions!.filter(s => s.plan.toUpperCase() === sub.plan.toUpperCase()).length;
                  const tabLabel = samePlanTotal > 1
                    ? `${sub.plan.toUpperCase()} (${samePlanBefore + 1})`
                    : sub.plan.toUpperCase();
                  return (
                    <button
                      key={sub.subscriptionId}
                      type="button"
                      onClick={() => setSelectedSubIndex(idx)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer ${
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
            )}
            {(() => {
              const subs = customerData.subscriptions || [];
              const sub = subs[selectedSubIndex] || customerData;
              return (
                <>
                  <div className="bg-[#E8F4E8] rounded-2xl p-6 mb-6">
                    <i className="ri-checkbox-circle-fill text-4xl text-[#A8B89F] mb-3"></i>
                    <h3 className="font-semibold text-[#2C2C2C] mb-2">
                      Welcome back, {sub.customerName || 'Member'}!
                    </h3>
                    <p className="text-[#6B6B6B] text-sm mb-2">You have {sub.remainingHours} hours remaining this period.</p>
                    <p className="text-xs text-[#A8B89F] font-medium mb-4">
                      Current Plan: {sub.plan.toUpperCase()}
                    </p>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <span className="text-2xl font-bold text-[#A8B89F]">{sub.remainingHours}</span>
                        <p className="text-[#6B6B6B]">Hours Left</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-[#6B6B6B]">{sub.usedHours}</span>
                        <p className="text-[#6B6B6B]">Hours Used</p>
                      </div>
                      <div>
                        <span className="text-2xl font-bold text-[#6B6B6B]">{sub.includedHours}</span>
                        <p className="text-[#6B6B6B]">Total Hours</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={openCalendly}
                    className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  >
                    <i className="ri-calendar-line mr-2"></i>
                    Schedule Meeting
                  </button>

                  <button
                    onClick={clearSession}
                    className="mt-4 text-sm text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
                  >
                    Not {sub.customerName || email}? Click here
                  </button>
                </>
              );
            })()}
          </div>
        ) : status === 'no-hours' && customerData ? (
          <div className="text-center">
            {/* Subscription Tabs */}
            {customerData.subscriptions && customerData.subscriptions.length > 1 && (
              <div className="flex justify-center gap-2 flex-wrap mb-4">
                {customerData.subscriptions.map((sub, idx) => {
                  const samePlanBefore = customerData.subscriptions!.slice(0, idx).filter(s => s.plan.toUpperCase() === sub.plan.toUpperCase()).length;
                  const samePlanTotal = customerData.subscriptions!.filter(s => s.plan.toUpperCase() === sub.plan.toUpperCase()).length;
                  const tabLabel = samePlanTotal > 1
                    ? `${sub.plan.toUpperCase()} (${samePlanBefore + 1})`
                    : sub.plan.toUpperCase();
                  return (
                    <button
                      key={sub.subscriptionId}
                      type="button"
                      onClick={() => setSelectedSubIndex(idx)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer ${
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
            )}
            {(() => {
              const subs = customerData.subscriptions || [];
              const sub = subs[selectedSubIndex] || customerData;
              const isTrial = sub.plan?.toLowerCase() === 'trial';
              return (
                <>
                  <p className="text-[#6B6B6B] text-sm mb-6">
                    Welcome back, {sub.customerName || 'Member'}. You've used all your included hours this period.
                  </p>

                  {/* Trial users: Show upgrade prompt instead of scheduling */}
                  {isTrial ? (
                    <>
                      <div className="bg-[#FFF8F0] rounded-2xl p-6 mb-6">
                        <i className="ri-gift-line text-4xl text-[#FFB347] mb-3"></i>
                        <h3 className="font-semibold text-[#2C2C2C] mb-2">
                          Trial Hours Used
                        </h3>
                        <p className="text-[#6B6B6B] text-sm">
                          You've used all {sub.includedHours} trial hours. Upgrade to a paid plan to continue scheduling meetings.
                        </p>
                      </div>

                      <Link
                        to="/#pricing"
                        className="inline-block w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      >
                        <i className="ri-arrow-up-circle-line mr-2"></i>
                        Upgrade Your Plan
                      </Link>

                      <p className="mt-3 text-xs text-[#BBBBBB]">
                        <a href="mailto:support@mycarepa.com" className="underline hover:text-[#9B9B9B] transition-colors">
                          Questions? Contact us.
                        </a>
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={openCalendly}
                        className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                      >
                        <i className="ri-calendar-line mr-2"></i>
                        Schedule Meeting
                      </button>

                      <p className="mt-3 text-xs text-[#BBBBBB] flex items-center justify-center gap-1">
                        <span>Overage rates may apply.</span>
                        <span className="relative inline-flex items-center justify-center w-4 h-4">
                          <button
                            type="button"
                            onMouseEnter={() => setShowOverageTooltip(true)}
                            onMouseLeave={() => setShowOverageTooltip(false)}
                            onFocus={() => setShowOverageTooltip(true)}
                            onBlur={() => setShowOverageTooltip(false)}
                            className="w-4 h-4 flex items-center justify-center text-[#BBBBBB] hover:text-[#9B9B9B] transition-colors cursor-pointer"
                            aria-label="Overage rate info"
                          >
                            <i className="ri-information-line text-sm"></i>
                          </button>
                          {showOverageTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#2C2C2C] text-white text-xs rounded-xl px-3 py-2.5 shadow-lg z-10 pointer-events-none">
                              <p className="leading-relaxed">
                                Additional hours beyond your plan are billed at{' '}
                                <strong>
                                  {sub.plan?.toLowerCase() === 'pro'
                                    ? '$28/hour'
                                    : sub.plan?.toLowerCase() === 'plus'
                                    ? '$32/hour'
                                    : '$35/hour'}
                                </strong>. You'll be notified before any charges apply.
                              </p>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2C2C2C]"></div>
                            </div>
                          )}
                        </span>
                        <a href="mailto:support@mycarepa.com" className="underline hover:text-[#9B9B9B] transition-colors ml-1">
                          Questions? Contact us.
                        </a>
                      </p>
                    </>
                  )}

                  <button
                    onClick={clearSession}
                    className="mt-5 text-sm text-[#BBBBBB] hover:text-[#6B6B6B] transition-colors"
                  >
                    Not {sub.customerName || email}? Click here
                  </button>
                </>
              );
            })()}
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
