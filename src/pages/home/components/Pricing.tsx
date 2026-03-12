import { useState } from 'react';
import { API_URL } from '../../../config/api';

// ─── FEATURE TOGGLE ────────────────────────────────────────────────────
// Set to true to require email and block users with existing subscriptions
// Set to false to allow multiple subscriptions (original behavior)
const BLOCK_DUPLICATE_SUBSCRIPTIONS = true;
// ───────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Connecting...');
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [emailError, setEmailError] = useState<{ planId: string; message: string } | null>(null);
  const [errorModal, setErrorModal] = useState<{
    show: boolean;
    currentPlan: string;
    message: string;
    suggestUpgrade?: string;
  } | null>(null);
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    message: string;
    previousPlan: string;
    newPlan: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    currentPlan: string;
    newPlan: string;
    newPlanPrice: string;
    email: string;
    isUpgrade?: boolean;
    isDowngrade?: boolean;
    periodEnd?: string;
  } | null>(null);

  const handleCheckout = async (planId: string) => {
    setEmailError(null);
    const email = emails[planId] || '';

    // If duplicate blocking is enabled, validate email format
    if (BLOCK_DUPLICATE_SUBSCRIPTIONS) {
      if (!email || !email.includes('@')) {
        setEmailError({ planId, message: 'Please enter a valid email address' });
        return;
      }
      // Note: Subscription check and upgrade logic is handled by create-checkout-session endpoint
    }

    setLoading(planId);
    setLoadingMessage('Connecting...');

    // Update message after 2 seconds if still loading
    const messageTimer = setTimeout(() => {
      setLoadingMessage('Setting up checkout...');
    }, 2000);

    try {
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          billingCycle: 'monthly',
          ...(BLOCK_DUPLICATE_SUBSCRIPTIONS && email ? { customerEmail: email.toLowerCase().trim() } : {})
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Handle "already on this plan" error
        if (data.error === 'Already on this plan') {
          setErrorModal({
            show: true,
            currentPlan: data.currentPlan,
            message: data.message,
            suggestUpgrade: data.suggestUpgrade,
          });
          setLoading(null);
          clearTimeout(messageTimer);
          return;
        }
        // Handle other subscription errors
        if (data.error === 'Active subscription exists') {
          setErrorModal({
            show: true,
            currentPlan: data.currentPlan,
            message: data.message,
          });
          setLoading(null);
          clearTimeout(messageTimer);
          return;
        }
        // Handle downgrade blocked - contact support
        if (data.contactSupport) {
          setErrorModal({
            show: true,
            currentPlan: data.currentPlan,
            message: data.message,
          });
          setLoading(null);
          clearTimeout(messageTimer);
          return;
        }
        throw new Error(data.message || 'Checkout failed');
      }

      // Handle upgrade/downgrade confirmation needed
      if (data.needsConfirmation) {
        setConfirmModal({
          show: true,
          currentPlan: data.currentPlan,
          newPlan: data.newPlan,
          newPlanPrice: data.newPlanPrice,
          email: email,
          isUpgrade: data.isUpgrade,
          isDowngrade: data.isDowngrade,
          periodEnd: data.periodEnd,
        });
        setLoading(null);
        clearTimeout(messageTimer);
        return;
      }

      // Handle successful upgrade or scheduled downgrade
      if (data.upgraded || data.downgraded) {
        setSuccessModal({
          show: true,
          message: data.message,
          previousPlan: data.previousPlan,
          newPlan: data.newPlan,
        });
        setLoading(null);
        clearTimeout(messageTimer);
        return;
      }

      if (data.url) {
        setLoadingMessage('Redirecting to payment...');
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Unable to start checkout. Please try again.');
      setLoading(null);
    } finally {
      clearTimeout(messageTimer);
    }
  };

  const handleConfirmUpgrade = async () => {
    if (!confirmModal) return;

    setConfirmModal(null);
    setLoading(confirmModal.newPlan);
    setLoadingMessage('Upgrading your plan...');

    try {
      const response = await fetch(`${API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: confirmModal.newPlan,
          customerEmail: confirmModal.email,
          confirmed: true,
        }),
      });
      const data = await response.json();

      if (data.upgraded) {
        setSuccessModal({
          show: true,
          message: data.message,
          previousPlan: data.previousPlan,
          newPlan: data.newPlan,
        });
      } else {
        alert(data.message || 'Upgrade failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Unable to upgrade. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'MyCarePA Starter',
      bestFor: 'Light, occasional support',
      hours: '4',
      price: '$99/month',
      features: [
        'Up to 4 hours per month',
        'Phone calls and messages',
        'Email follow-ups',
        'Flexible scheduling'
      ],
      popular: false
    },
    {
      id: 'plus',
      name: 'MyCarePA Plus',
      bestFor: 'Regular guidance & follow-ups',
      hours: '10',
      price: '$249/month',
      features: [
        'Up to 10 hours per month',
        'Priority response times',
        'Phone calls and messages',
        'Document organization support',
        'Weekly check-ins'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'MyCarePA Pro',
      bestFor: 'High-touch, ongoing support',
      hours: '20',
      price: '$499/month',
      features: [
        '20+ hours per month',
        'Dedicated assistant',
        'Same-day response',
        'Comprehensive support',
        'Daily availability',
        'Custom scheduling'
      ],
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      {/* Full-screen loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 border-4 border-[#A8B89F] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-[#2C2C2C]">{loadingMessage}</p>
            <p className="text-sm text-[#6B6B6B]">Please wait...</p>
          </div>
        </div>
      )}

      {/* Active subscription error modal */}
      {errorModal?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Top accent banner */}
            <div className="bg-gradient-to-r from-[#A8B89F] to-[#8FA085] px-8 pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-shield-check-line text-3xl text-white"></i>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">
                You're Already a Member!
              </h3>
              <p className="text-white/80 text-sm mt-1">Your subscription is active and running</p>

              {/* Plan badge inside the header */}
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 border border-white/40 text-white font-bold text-sm px-5 py-2 rounded-full uppercase tracking-wide">
                <i className="ri-vip-crown-2-line text-[#FFD4C4]"></i>
                {errorModal.currentPlan} Plan Active
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              <p className="text-[#6B6B6B] text-center text-sm leading-relaxed mb-5">
                {errorModal.message}
              </p>

              {errorModal.suggestUpgrade ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setErrorModal(null)}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 text-[#6B6B6B] font-semibold rounded-full hover:bg-gray-50 transition-colors cursor-pointer text-sm whitespace-nowrap"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setErrorModal(null);
                      // Scroll to the suggested plan
                      const planElement = document.getElementById(`plan-${errorModal.suggestUpgrade?.toLowerCase()}`);
                      planElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="flex-1 px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all text-center text-sm whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-arrow-up-circle-line mr-2"></i>
                    View {errorModal.suggestUpgrade} Plan
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-[#F7F9F6] border border-[#D6E4CF] rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <i className="ri-customer-service-2-line text-xl text-[#A8B89F]"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2C2C2C] mb-0.5">Need to change your plan?</p>
                      <p className="text-xs text-[#6B6B6B]">Reach out and we'll upgrade, downgrade, or pause your plan — no hassle.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setErrorModal(null)}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 text-[#6B6B6B] font-semibold rounded-full hover:bg-gray-50 transition-colors cursor-pointer text-sm whitespace-nowrap"
                    >
                      Close
                    </button>
                    <a
                      href="mailto:support@mycarepa.com?subject=Plan%20Change%20Request"
                      className="flex-1 px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all text-center text-sm whitespace-nowrap"
                    >
                      <i className="ri-mail-send-line mr-2"></i>
                      Contact Support
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade success modal */}
      {successModal?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#A8B89F] to-[#8FA085] px-8 pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-checkbox-circle-line text-3xl text-white"></i>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">
                Upgrade Successful!
              </h3>
              <p className="text-white/80 text-sm mt-1">Your plan has been updated</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 border border-white/40 text-white font-bold text-sm px-5 py-2 rounded-full uppercase tracking-wide">
                <i className="ri-arrow-up-line text-[#FFD4C4]"></i>
                {successModal.previousPlan} → {successModal.newPlan}
              </div>
            </div>
            <div className="px-8 py-6">
              <p className="text-[#6B6B6B] text-center text-sm leading-relaxed mb-5">
                {successModal.message} Your new plan is now active and any billing adjustments will be prorated.
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="/schedule"
                  className="w-full px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all text-center text-sm whitespace-nowrap"
                >
                  <i className="ri-calendar-line mr-2"></i>
                  Schedule a Meeting
                </a>
                <button
                  onClick={() => setSuccessModal(null)}
                  className="w-full px-6 py-3 border-2 border-gray-200 text-[#6B6B6B] font-semibold rounded-full hover:bg-gray-50 transition-colors cursor-pointer text-sm whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan change confirmation modal */}
      {confirmModal?.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className={`${
              confirmModal.isUpgrade
                ? 'bg-gradient-to-r from-[#FFB347] to-[#FF8C42]'
                : 'bg-gradient-to-r from-[#6B8E9F] to-[#5A7A8A]'
            } px-8 pt-8 pb-8 text-center`}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className={`${
                  confirmModal.isUpgrade ? 'ri-arrow-up-circle-line' : 'ri-arrow-down-circle-line'
                } text-3xl text-white`}></i>
              </div>
              <h3 className="font-serif text-2xl font-bold text-white">
                Confirm {confirmModal.isUpgrade ? 'Upgrade' : 'Downgrade'}
              </h3>
              <p className="text-white/80 text-sm mt-1">Review your plan change</p>
            </div>
            <div className="px-8 py-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                  <p className="text-xs text-[#6B6B6B] mb-1">Current</p>
                  <p className="font-bold text-lg text-[#2C2C2C] uppercase">{confirmModal.currentPlan}</p>
                </div>
                <i className={`${
                  confirmModal.isUpgrade ? 'ri-arrow-right-line' : 'ri-arrow-right-line'
                } text-2xl text-[#A8B89F]`}></i>
                <div className="text-center">
                  <p className="text-xs text-[#6B6B6B] mb-1">New Plan</p>
                  <p className={`font-bold text-lg uppercase ${
                    confirmModal.isUpgrade ? 'text-[#A8B89F]' : 'text-[#6B8E9F]'
                  }`}>{confirmModal.newPlan}</p>
                  <p className="text-sm text-[#6B6B6B]">{confirmModal.newPlanPrice}</p>
                </div>
              </div>
              {confirmModal.isUpgrade ? (
                <p className="text-[#6B6B6B] text-center text-sm leading-relaxed mb-5">
                  Your billing will be prorated. You'll be charged the difference for the remainder of your billing cycle.
                </p>
              ) : (
                <div className="bg-[#FFF8F0] rounded-xl p-4 mb-5">
                  <p className="text-[#6B6B6B] text-center text-sm leading-relaxed">
                    <i className="ri-calendar-line mr-1 text-[#FFB347]"></i>
                    Your plan will change on <strong>{confirmModal.periodEnd}</strong>. You'll keep your current plan until then.
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmUpgrade}
                  className={`w-full px-6 py-3 ${
                    confirmModal.isUpgrade ? 'bg-[#A8B89F]' : 'bg-[#6B8E9F]'
                  } text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer text-sm whitespace-nowrap`}
                >
                  <i className="ri-checkbox-circle-line mr-2"></i>
                  Confirm {confirmModal.isUpgrade ? 'Upgrade' : 'Downgrade'}
                </button>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="w-full px-6 py-3 border-2 border-gray-200 text-[#6B6B6B] font-semibold rounded-full hover:bg-gray-50 transition-colors cursor-pointer text-sm whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-6 py-2 bg-[#A8B89F] text-white text-sm font-medium uppercase tracking-wider rounded-full">
            Simple, Transparent Pricing
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2C2C2C] mt-6">
            Pricing & Plans
          </h2>
        </div>

        <div className="mb-12">
          <h3 className="font-serif text-3xl font-bold text-[#2C2C2C] text-center mb-8">
            Ongoing Support Plans
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                id={`plan-${plan.id}`}
                className={`${
                  plan.popular ? 'bg-[#FFD4C4]' : 'bg-white'
                } border-2 ${
                  plan.popular ? 'border-[#A8B89F]' : 'border-gray-200'
                } rounded-2xl p-8 hover:border-[#A8B89F] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative ${
                  plan.popular ? 'pt-16' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-[#A8B89F] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h4 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-2">
                  {plan.name}
                </h4>
                <p className="text-[#6B6B6B] italic mb-6">{plan.bestFor}</p>
                <div className="mb-6">
                  <div className="text-5xl font-bold text-[#A8B89F] mb-2">
                    {plan.hours}
                  </div>
                  <div className="text-[#6B6B6B]">hours/month</div>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <i className="ri-checkbox-circle-fill text-[#A8B89F] text-lg mt-0.5 flex-shrink-0"></i>
                      <span className="text-[#2C2C2C] text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {/* Email input - only shown when duplicate blocking is enabled */}
                {BLOCK_DUPLICATE_SUBSCRIPTIONS && (
                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={emails[plan.id] || ''}
                      onChange={(e) => {
                        setEmails(prev => ({ ...prev, [plan.id]: e.target.value }));
                        if (emailError?.planId === plan.id) setEmailError(null);
                      }}
                      className={`w-full px-4 py-3 border-2 ${
                        emailError?.planId === plan.id ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl focus:border-[#A8B89F] focus:outline-none transition-colors text-sm`}
                    />
                    {emailError?.planId === plan.id && (
                      <p className="text-red-500 text-xs mt-1">{emailError.message}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading !== null}
                  className={`${
                    plan.popular ? 'group relative overflow-hidden' : ''
                  } w-full px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 whitespace-nowrap cursor-pointer disabled:opacity-50 ${
                    plan.popular ? 'hover:scale-105' : ''
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <i className="ri-loader-4-line animate-spin"></i>
                      {loadingMessage}
                    </span>
                  ) : plan.popular ? (
                    <>
                      <span className="relative z-10">Buy Now - {plan.price}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#A8B89F] via-[#8FA085] to-[#A8B89F] bg-[length:200%_100%] animate-shimmer"></div>
                    </>
                  ) : (
                    `Buy Now - ${plan.price}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="bg-[#FFF8F0] rounded-2xl p-8">
            <h4 className="font-serif text-2xl font-semibold text-[#2C2C2C] mb-4">
              What Happens When You Start to Run Out of Time?
            </h4>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              Near the end of your term:
            </p>
            <ul className="space-y-2 text-[#6B6B6B] text-left max-w-xl mx-auto">
              <li className="flex items-start gap-3">
                <span>•</span>
                <span>You'll review how you used your time</span>
              </li>
              <li className="flex items-start gap-3">
                <span>•</span>
                <span>We'll talk about what helped most</span>
              </li>
              <li className="flex items-start gap-3">
                <span>•</span>
                <span>You decide if you want to continue—and at what level</span>
              </li>
            </ul>
            <p className="text-[#2C2C2C] font-medium mt-4">
              No pressure. No surprises.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
