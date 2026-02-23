import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useSearchParams } from 'react-router-dom'
import './index.css'

// Calendly type declaration
declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void
    }
  }
}

// API URL - empty string in production (same origin), localhost in development
const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

// Calendly URL
const CALENDLY_URL = 'https://calendly.com/mtkinz79/dfsd'

// Stripe checkout handler
const handleCheckout = async (planId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, billingCycle: 'monthly' }),
    })
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  } catch (error) {
    console.error('Checkout error:', error)
  }
}

// Scroll helper
const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// ============================================
// SUCCESS PAGE - After Stripe Payment
// ============================================
function SuccessPage() {
  const [searchParams] = useSearchParams()
  const [session, setSession] = useState<{ customer_email?: string; customer?: { name?: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      fetch(`${API_URL}/api/session/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setSession(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: `${CALENDLY_URL}?email=${encodeURIComponent(session?.customer_email || '')}&name=${encodeURIComponent(session?.customer?.name || '')}`
      })
    } else {
      window.open(CALENDLY_URL, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFD4C4] via-[#FFF8F0] to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
        <div className="w-20 h-20 bg-[#A8B89F] rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="ri-check-line text-4xl text-white"></i>
        </div>

        <h1 className="font-serif text-4xl font-bold text-[#2C2C2C] mb-4">
          Welcome to MyCarePA!
        </h1>

        <p className="text-lg text-[#6B6B6B] mb-8">
          {loading ? 'Loading...' : 'Your subscription is now active. Let\'s schedule your first meeting with your personal assistant.'}
        </p>

        <button
          onClick={openCalendly}
          className="w-full sm:w-auto px-10 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer mb-6"
        >
          <i className="ri-calendar-line mr-2"></i>
          Schedule Your First Meeting
        </button>

        <div className="bg-[#FFF8F0] rounded-2xl p-6 mt-8">
          <h3 className="font-semibold text-[#2C2C2C] mb-3">
            <i className="ri-bookmark-line mr-2 text-[#A8B89F]"></i>
            Bookmark This Link for Future Bookings
          </h3>
          <p className="text-[#6B6B6B] text-sm mb-4">
            Save this link to schedule meetings anytime:
          </p>
          <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/schedule`}
              className="flex-1 bg-transparent text-sm text-[#6B6B6B] outline-none"
            />
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/schedule`)}
              className="px-3 py-1 bg-[#A8B89F] text-white text-sm rounded-lg hover:bg-[#8FA080] transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-[#6B6B6B]">
            Questions? Contact us anytime. We're here to help!
          </p>
          <Link to="/" className="text-[#A8B89F] hover:underline text-sm mt-2 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SCHEDULE PAGE - Email Verification + Calendly
// ============================================
function SchedulePage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending-code' | 'code-sent' | 'verifying' | 'verified' | 'no-hours' | 'error'>('idle')
  const [customerData, setCustomerData] = useState<{
    canSchedule: boolean
    customerName: string
    plan: string
    remainingHours: number
    includedHours: number
    usedHours: number
    message: string
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const [tempCode, setTempCode] = useState<string | null>(null)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending-code')
    setErrorMessage('')
    setTempCode(null)

    try {
      const response = await fetch(`${API_URL}/api/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })
      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to send verification code.')
        setStatus('error')
        return
      }

      // Temporary: show code in popup if returned (for testing)
      if (data._tempCode) {
        setTempCode(data._tempCode)
      }

      setStatus('code-sent')
    } catch {
      setErrorMessage('Network error. Please try again.')
      setStatus('error')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('verifying')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_URL}/api/verify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), code }),
      })
      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to verify code.')
        setStatus('code-sent') // Stay on code entry screen
        return
      }

      setCustomerData(data)
      if (data.canSchedule) {
        setStatus('verified')
      } else {
        setStatus('no-hours')
      }
    } catch {
      setErrorMessage('Network error. Please try again.')
      setStatus('code-sent')
    }
  }

  const handleResendCode = async () => {
    setCode('')
    setErrorMessage('')
    setStatus('sending-code')

    try {
      const response = await fetch(`${API_URL}/api/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })
      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.message || 'Unable to send verification code.')
        setStatus('code-sent')
        return
      }

      setStatus('code-sent')
    } catch {
      setErrorMessage('Network error. Please try again.')
      setStatus('code-sent')
    }
  }

  const openCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: `${CALENDLY_URL}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(customerData?.customerName || '')}`
      })
    } else {
      window.open(`${CALENDLY_URL}?email=${encodeURIComponent(email)}`, '_blank')
    }
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
          <p className="text-[#6B6B6B]">
            {status === 'code-sent' || status === 'verifying'
              ? 'Enter the verification code sent to your email.'
              : 'Enter your email to verify your subscription.'}
          </p>
        </div>

        {/* Step 1: Email Entry */}
        {(status === 'idle' || status === 'sending-code' || (status === 'error' && !code)) ? (
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
              {status === 'sending-code' ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Sending Code...
                </>
              ) : (
                <>
                  <i className="ri-mail-send-line mr-2"></i>
                  Send Verification Code
                </>
              )}
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

            {/* Temporary: Show code popup for testing */}
            {tempCode && (
              <div className="bg-[#FFD4C4] border-2 border-[#A8B89F] rounded-lg p-4 mb-4 relative">
                <button
                  type="button"
                  onClick={() => setTempCode(null)}
                  className="absolute top-2 right-2 text-[#6B6B6B] hover:text-[#2C2C2C]"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
                <p className="text-xs text-[#6B6B6B] mb-1">
                  <i className="ri-bug-line mr-1"></i>
                  Demo Mode - Your code:
                </p>
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
                autoComplete="one-time-code"
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
              {status === 'verifying' ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => { setStatus('idle'); setCode(''); setErrorMessage(''); }}
                className="text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
              >
                <i className="ri-arrow-left-line mr-1"></i>
                Change email
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
              <p className="text-[#6B6B6B] text-sm mb-4">{customerData.message}</p>
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

            <button
              onClick={openCalendly}
              className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <i className="ri-calendar-line mr-2"></i>
              Schedule Meeting
            </button>
          </div>
        ) : status === 'no-hours' && customerData ? (
          <div className="text-center">
            <div className="bg-[#FFF8F0] rounded-2xl p-6 mb-6">
              <i className="ri-time-line text-4xl text-[#FFB347] mb-3"></i>
              <h3 className="font-semibold text-[#2C2C2C] mb-2">
                No Hours Remaining
              </h3>
              <p className="text-[#6B6B6B] text-sm mb-4">{customerData.message}</p>
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

            <button
              onClick={() => handleCheckout('plus')}
              className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer mb-3"
            >
              <i className="ri-arrow-up-circle-line mr-2"></i>
              Upgrade Your Plan
            </button>
            <Link to="/#pricing" className="text-[#A8B89F] hover:underline text-sm">
              View all plans
            </Link>
          </div>
        ) : null}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-[#6B6B6B] mb-2">
            Don't have a subscription yet?
          </p>
          <Link to="/#pricing" className="text-[#A8B89F] hover:underline font-medium">
            View Plans & Subscribe
          </Link>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SHARED COMPONENTS
// ============================================

// Sticky Banner Component
function StickyBanner({ show }: { show: boolean }) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0] shadow-md transition-transform duration-300 ${
        show ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2">
          <i className="ri-heart-fill text-[#A8B89F] text-xl"></i>
          <span className="font-serif text-lg font-semibold text-[#2C2C2C]">
            My Care Personal Assistant™
          </span>
        </Link>
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
          <button
            onClick={() => scrollToSection('contact')}
            className="w-full md:w-auto px-6 py-2.5 bg-[#A8B89F] text-white rounded-full font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap cursor-pointer"
          >
            Schedule Time
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="w-full md:w-auto px-6 py-2.5 border-2 border-[#A8B89F] text-[#A8B89F] rounded-full font-medium transition-all duration-300 whitespace-nowrap cursor-pointer hover:bg-[#A8B89F] hover:text-white"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  )
}

// Hero Section
function Hero() {
  return (
    <section className="min-h-screen flex items-center bg-gradient-to-br from-[#FFD4C4] via-[#FFF8F0] to-[#FFF8F0] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-transparent"></div>
      <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-5 gap-12 items-center relative z-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <i className="ri-heart-fill text-[#A8B89F] text-2xl"></i>
            <span className="text-sm font-medium text-[#6B6B6B] uppercase tracking-wider">
              Real Human Support
            </span>
          </div>
          <h1 className="font-serif text-5xl lg:text-6xl font-bold text-[#2C2C2C] leading-tight">
            My Care Personal Assistant™
          </h1>
          <h2 className="text-2xl text-[#2C2C2C] font-light">
            Your personal assistant when you need help most
          </h2>
          <p className="text-lg text-[#6B6B6B] leading-relaxed">
            Life doesn't come with instructions. You don't have to figure everything out alone.
            MyCarePA, My Care Personal Assistant™, connects you with a real, trained human who helps you work
            through challenges, stay organized, and move forward.
          </p>
          <p className="text-lg text-[#6B6B6B] leading-relaxed">
            No scripts. No bots. You'll be matched with a person who listens and cares.
          </p>
          <div className="pt-4 flex flex-col items-start gap-3">
            <button
              onClick={() => scrollToSection('pricing')}
              className="group relative w-full sm:w-auto px-10 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full overflow-hidden transition-all duration-300 whitespace-nowrap cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:scale-105"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Get Started
                <i className="ri-arrow-right-line text-xl transition-transform duration-300 group-hover:translate-x-1"></i>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#A8B89F] via-[#8FA085] to-[#A8B89F] bg-[length:200%_100%] animate-shimmer"></div>
            </button>
            <Link
              to="/schedule"
              className="text-[#6B6B6B] hover:text-[#A8B89F] transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              <i className="ri-calendar-check-line"></i>
              Already a member? Schedule a meeting
              <i className="ri-arrow-right-s-line"></i>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#A8B89F]/20 to-transparent rounded-3xl transform rotate-3"></div>
            <img
              src="https://readdy.ai/api/search-image?query=A%20warm%20and%20caring%20diverse%20personal%20assistant%20sitting%20in%20a%20bright%20plant%20filled%20home%20office%20with%20natural%20wood%20tones%20and%20soft%20lighting%20smiling%20warmly%20during%20a%20video%20call%20on%20laptop%20looking%20toward%20the%20left%20side%20of%20the%20screen%20with%20genuine%20caring%20expression%20professional%20yet%20approachable%20atmosphere%20soft%20focus%20background%20with%20green%20plants%20and%20cream%20colored%20walls&width=800&height=600&seq=hero001&orientation=landscape"
              alt="Caring personal assistant"
              className="relative rounded-3xl shadow-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// What Is My Care Section
function WhatIsMyCare() {
  const benefits = [
    'Understand what to do next',
    'Break down overwhelming tasks',
    'Stay on track with important follow-ups',
    'Get unstuck when technology, paperwork, or life gets complicated'
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-6 py-2 bg-[#A8B89F] text-white text-sm font-medium uppercase tracking-wider rounded-full">
            About the Service
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2C2C2C] mt-6">
            What is My Care Personal Assistant?
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FFD4C4]/30 to-transparent rounded-full transform -rotate-6"></div>
              <img
                src="https://readdy.ai/api/search-image?query=A%20caring%20personal%20assistant%20and%20client%20having%20an%20engaged%20comfortable%20conversation%20both%20smiling%20in%20a%20bright%20welcoming%20office%20space%20with%20soft%20natural%20lighting%20warm%20tones%20and%20plants%20in%20background%20showing%20trust%20and%20connection%20professional%20yet%20friendly%20atmosphere&width=500&height=500&seq=about001&orientation=squarish"
                alt="Personal assistant with client"
                className="relative rounded-full shadow-xl w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <p className="text-lg text-[#6B6B6B] leading-relaxed">
              MyCarePA is a personal assistant service designed for real people, not executives or celebrities.
              Most people think personal assistants are only for the wealthy. We believe everyone deserves access
              to reliable human support—especially during stressful or confusing moments.
            </p>

            <div className="space-y-4 pt-4">
              <h3 className="text-2xl font-serif font-semibold text-[#2C2C2C]">
                Your personal assistant can help you:
              </h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <i className="ri-heart-fill text-[#A8B89F] text-xl mt-1 flex-shrink-0"></i>
                    <span className="text-lg text-[#6B6B6B]">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorks() {
  const steps = [
    { number: 1, title: 'Get matched with a personal assistant', description: "You'll be paired with a trained assistant who becomes your primary point of contact.", icon: 'ri-user-heart-line' },
    { number: 2, title: 'Have a real conversation', description: 'Your first call is about understanding you—your situation, your goals, and what you need help with.', icon: 'ri-chat-smile-3-line' },
    { number: 3, title: 'Get ongoing support', description: 'Your assistant checks in, helps you prioritize, and supports you through calls, messages, and follow-ups.', icon: 'ri-calendar-check-line' },
    { number: 4, title: 'Adjust as you go', description: 'What you need today may change tomorrow. Your assistant adapts with you.', icon: 'ri-refresh-line' }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-[#A8B89F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white">How It Works</h2>
          <div className="w-24 h-1 bg-[#2C2C2C] mx-auto mt-6"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#FFD4C4] rounded-full flex items-center justify-center text-white text-2xl font-bold">{step.number}</div>
                <div className="w-16 h-16 flex items-center justify-center"><i className={`${step.icon} text-5xl text-[#A8B89F]`}></i></div>
                <h3 className="font-serif text-xl font-semibold text-[#2C2C2C] leading-tight">{step.title}</h3>
                <p className="text-[#6B6B6B] leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <img src="https://readdy.ai/api/search-image?query=A%20satisfied%20client%20smiling%20with%20relief%20and%20happiness%20looking%20toward%20the%20right%20side%20of%20screen%20in%20a%20comfortable%20home%20setting%20with%20warm%20natural%20lighting%20soft%20focus%20background%20showing%20peace%20of%20mind%20and%20contentment%20after%20receiving%20support%20professional%20photography&width=600&height=400&seq=satisfied001&orientation=landscape" alt="Satisfied client" className="rounded-3xl shadow-2xl max-w-2xl w-full h-auto object-cover" />
        </div>
      </div>
    </section>
  )
}

// Services Section
function Services() {
  const categories = [
    { title: 'Life & Organization', icon: 'ri-calendar-todo-line', color: 'bg-[#FFD4C4]', items: ['Breaking down overwhelming to-do lists', 'Staying on top of important deadlines', 'Following up on calls, emails, or applications', 'Keeping track of next steps when life feels chaotic'] },
    { title: 'Technology & Online Tasks', icon: 'ri-computer-line', color: 'bg-[#E8F4E8]', items: ['Navigating websites, portals, and dashboards', 'Understanding emails, forms, or instructions', 'Troubleshooting basic tech or account issues', 'Walking through online processes step by step'] },
    { title: 'Preparation & Guidance', icon: 'ri-lightbulb-line', color: 'bg-[#FFF8F0]', items: ['Preparing for important calls or meetings', 'Understanding what questions to ask', 'Organizing documents or information', 'Talking through options before making decisions'] },
    { title: 'Emotional Support (Non-Therapy)', icon: 'ri-heart-pulse-line', color: 'bg-[#E8E0F4]', items: ['Having someone listen without judgment', 'Feeling supported during stressful situations', 'Talking things through when you feel stuck or overwhelmed'] }
  ]

  return (
    <section id="services" className="py-20 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2C2C2C] mb-6">What Can My Care Personal Assistant Help With?</h2>
          <p className="text-lg text-[#6B6B6B] leading-relaxed max-w-4xl">MyCarePA assistants are trained to support real-life challenges, not just one narrow task. Here are common ways people use MyCarePA:</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {categories.map((category, index) => (
            <div key={index} className={`${category.color} rounded-2xl p-8`}>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center"><i className={`${category.icon} text-4xl text-[#2C2C2C]`}></i></div>
                <h3 className="font-serif text-2xl font-semibold text-[#2C2C2C] flex-1">{category.title}</h3>
              </div>
              <ul className="space-y-3">
                {category.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <i className="ri-heart-fill text-[#A8B89F] text-lg mt-1 flex-shrink-0"></i>
                    <span className="text-[#2C2C2C]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="bg-gray-100 rounded-2xl p-8 border-l-4 border-[#6B6B6B]">
          <h3 className="font-serif text-2xl font-semibold text-[#2C2C2C] mb-4">What MyCarePA Is Not</h3>
          <p className="text-[#6B6B6B] leading-relaxed mb-4">To set expectations clearly:</p>
          <ul className="space-y-2 text-[#6B6B6B]">
            <li>• We do not provide legal, medical, or financial advice</li>
            <li>• We do not replace licensed professionals</li>
            <li>• We are not a call center or chatbot</li>
            <li>• We are not therapy</li>
          </ul>
          <p className="text-[#2C2C2C] font-medium mt-4 italic">MyCarePA is about support, clarity, and momentum—not diagnosis or representation.</p>
        </div>
      </div>
    </section>
  )
}

// Pricing Section
function Pricing() {
  const plans = [
    { id: 'starter', name: 'MyCarePA Starter', bestFor: 'Light, occasional support', hours: '4', price: '$99/month', features: ['Up to 4 hours per month', 'Phone calls and messages', 'Email follow-ups', 'Flexible scheduling'], popular: false },
    { id: 'plus', name: 'MyCarePA Plus', bestFor: 'Regular guidance & follow-ups', hours: '10', price: '$249/month', features: ['Up to 10 hours per month', 'Priority response times', 'Phone calls and messages', 'Document organization support', 'Weekly check-ins'], popular: true },
    { id: 'pro', name: 'MyCarePA Pro', bestFor: 'High-touch, ongoing support', hours: '20', price: '$499/month', features: ['20+ hours per month', 'Dedicated assistant', 'Same-day response', 'Comprehensive support', 'Daily availability', 'Custom scheduling'], popular: false }
  ]

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-6 py-2 bg-[#A8B89F] text-white text-sm font-medium uppercase tracking-wider rounded-full">Simple, Transparent Pricing</span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2C2C2C] mt-6">Pricing & Plans</h2>
        </div>
        <div className="mb-12">
          <h3 className="font-serif text-3xl font-bold text-[#2C2C2C] text-center mb-8">Ongoing Support Plans</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className={`${plan.popular ? 'bg-[#FFD4C4]' : 'bg-white'} border-2 ${plan.popular ? 'border-[#A8B89F]' : 'border-gray-200'} rounded-2xl p-8 hover:border-[#A8B89F] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative ${plan.popular ? 'pt-16' : ''}`}>
                {plan.popular && <div className="absolute top-4 right-4 bg-[#A8B89F] text-white px-4 py-2 rounded-full text-sm font-semibold">Most Popular</div>}
                <h4 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-2">{plan.name}</h4>
                <p className="text-[#6B6B6B] italic mb-6">{plan.bestFor}</p>
                <div className="mb-6">
                  <div className="text-5xl font-bold text-[#A8B89F] mb-2">{plan.hours}</div>
                  <div className="text-[#6B6B6B]">hours/month</div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <i className="ri-checkbox-circle-fill text-[#A8B89F] text-lg mt-0.5 flex-shrink-0"></i>
                      <span className="text-[#2C2C2C] text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleCheckout(plan.id)} className="w-full px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  Buy Now - {plan.price}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const faqs = [
    { question: 'How does My Care Personal Assistant work?', answer: "After signing up, you'll be matched with a dedicated personal assistant based on your needs. You can communicate via phone, email, or our secure messaging platform." },
    { question: 'What tasks can my personal assistant help with?', answer: "Your assistant can help with appointment scheduling, bill payments, travel planning, errands, home organization, event coordination, research, and general life management tasks." },
    { question: 'Is my information kept confidential?', answer: 'Absolutely. All our assistants sign strict confidentiality agreements. Your personal information, conversations, and tasks are kept completely private and secure.' },
    { question: 'Can I change my plan or cancel anytime?', answer: 'Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the end of your current billing period.' },
    { question: 'What if I need help outside business hours?', answer: 'Our Plus and Premium plans include extended hours and priority support. For urgent matters, you can leave a message and your assistant will respond as soon as possible.' },
    { question: 'How quickly will my assistant respond?', answer: 'Standard response time is within 2 hours during business hours (9 AM - 6 PM). Plus members get 1-hour response times.' }
  ]

  return (
    <section id="faq" className="py-20 bg-[#2C2C2C]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white italic">Frequently Asked Questions</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-md">
                <button onClick={() => setOpenIndex(openIndex === index ? null : index)} className="w-full px-8 py-6 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50">
                  <span className="font-semibold text-lg text-[#2C2C2C] pr-4">{faq.question}</span>
                  <i className={`${openIndex === index ? 'ri-subtract-line' : 'ri-add-line'} text-2xl text-[#A8B89F]`}></i>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-8 pb-6 text-[#6B6B6B]">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <img src="https://readdy.ai/api/search-image?query=A%20friendly%20caring%20personal%20assistant%20smiling%20warmly%20looking%20toward%20the%20left%20side%20of%20screen%20in%20a%20bright%20welcoming%20office%20with%20plants%20and%20natural%20light%20professional%20yet%20approachable%20atmosphere%20showing%20trust%20and%20reliability%20soft%20focus%20background&width=500&height=700&seq=faq001&orientation=portrait" alt="Friendly assistant" className="rounded-3xl shadow-2xl w-full h-auto object-cover sticky top-24" />
          </div>
        </div>
      </div>
    </section>
  )
}

// Contact Form Section
function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: `${CALENDLY_URL}?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}` })
      setStatus('success')
      setTimeout(() => { setFormData({ name: '', email: '', phone: '', message: '' }); setStatus('idle') }, 1000)
    } else {
      window.open(`${CALENDLY_URL}?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`, '_blank')
      setStatus('success')
    }
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-[#FFD4C4] to-[#FFF8F0] p-8 sm:p-12 flex items-center">
            <img src="https://readdy.ai/api/search-image?query=A%20diverse%20caring%20team%20of%20personal%20assistants%20in%20a%20bright%20welcoming%20modern%20office%20space%20with%20plants%20and%20natural%20light%20all%20smiling%20warmly%20and%20looking%20toward%20the%20right%20side%20showing%20professionalism%20trust%20and%20approachability%20warm%20tones%20and%20soft%20lighting&width=600&height=800&seq=team001&orientation=portrait" alt="My Care team" className="rounded-2xl shadow-xl w-full h-auto object-cover" />
          </div>
          <div className="bg-white p-6 sm:p-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-4">Ready to Get Started?</h2>
            <p className="text-base sm:text-lg text-[#6B6B6B] mb-8">You don't need a perfect plan. You just need a starting point.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#2C2C2C] mb-2">Full Name *</label>
                <input type="text" id="name" name="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none" placeholder="Your name" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2C] mb-2">Email Address *</label>
                <input type="email" id="email" name="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none" placeholder="your@email.com" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#2C2C2C] mb-2">Phone Number</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#2C2C2C] mb-2">Tell us a bit about what you need help with</label>
                <textarea id="message" name="message" rows={4} maxLength={500} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none resize-none" placeholder="Optional - share what's on your mind..."></textarea>
                <p className="text-sm text-[#6B6B6B] mt-1">{formData.message.length}/500 characters</p>
              </div>
              <button type="submit" disabled={status === 'submitting'} className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 cursor-pointer">
                {status === 'submitting' ? 'Processing...' : 'Get Started'}
              </button>
              {status === 'success' && <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">Opening scheduler...</div>}
            </form>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-[#6B6B6B]">
              <div className="flex items-center gap-2"><i className="ri-shield-check-line text-[#A8B89F] text-xl"></i><span>Trained Professionals</span></div>
              <div className="flex items-center gap-2"><i className="ri-lock-line text-[#A8B89F] text-xl"></i><span>Confidential</span></div>
              <div className="flex items-center gap-2"><i className="ri-checkbox-circle-line text-[#A8B89F] text-xl"></i><span>No Obligation</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-[#2C2C2C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <i className="ri-heart-fill text-[#A8B89F] text-2xl"></i>
              <span className="font-serif text-xl font-semibold">My Care Personal Assistant™</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">Real human support when you need help most. Personal assistance for everyone.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white hover:text-[#A8B89F] transition-colors">Home</Link></li>
              <li><Link to="/schedule" className="text-white hover:text-[#A8B89F] transition-colors">Schedule Meeting</Link></li>
              <li><a href="/#pricing" className="text-white hover:text-[#A8B89F] transition-colors">Pricing</a></li>
              <li><a href="/#contact" className="text-white hover:text-[#A8B89F] transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-white hover:text-[#A8B89F] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white hover:text-[#A8B89F] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white hover:text-[#A8B89F] transition-colors">Assistant Guidelines</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Stay Connected</h3>
            <p className="text-gray-400 text-sm mb-4">Get updates and tips for making the most of your MyCarePA personal assistant.</p>
            <form className="flex gap-2">
              <input type="email" placeholder="Your email" className="flex-1 px-4 py-2 bg-transparent border border-gray-600 rounded-lg focus:border-[#A8B89F] focus:outline-none text-white placeholder-gray-500 text-sm" />
              <button type="submit" className="px-4 py-2 bg-[#A8B89F] rounded-lg hover:bg-[#8FA080] transition-colors cursor-pointer"><i className="ri-arrow-right-line text-white"></i></button>
            </form>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400">
          <p>© 2025 My Care Personal Assistant™. All rights reserved.</p>
          <div className="flex items-center gap-6 text-center">
            <p>All assistants are trained professionals</p>
            <span className="hidden sm:inline">•</span>
            <p>Conversations are confidential</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================
// ASSISTANT DASHBOARD - Usage Management
// ============================================
function AssistantPage() {
  const [password, setPassword] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [hours, setHours] = useState('')
  const [customer, setCustomer] = useState<{
    customerId: string
    customerName: string
    email: string
    hasSubscription: boolean
    plan?: string
    includedHours?: number
    usedHours?: number
    remainingHours?: number
    periodStartDate?: string
    periodEndDate?: string
  } | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // Check for saved session
  useEffect(() => {
    const saved = localStorage.getItem('assistant_session')
    if (saved) {
      const session = JSON.parse(saved)
      if (session.expiry > Date.now()) {
        setPassword(session.password)
        setIsLoggedIn(true)
      } else {
        localStorage.removeItem('assistant_session')
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const response = await fetch(`${API_URL}/api/assistant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (response.ok) {
        setIsLoggedIn(true)
        // Save session for 8 hours
        localStorage.setItem('assistant_session', JSON.stringify({
          password,
          expiry: Date.now() + 8 * 60 * 60 * 1000
        }))
        setStatus('idle')
      } else {
        setMessage('Invalid password')
        setStatus('error')
      }
    } catch {
      setMessage('Network error')
      setStatus('error')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setPassword('')
    setCustomer(null)
    localStorage.removeItem('assistant_session')
  }

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    setCustomer(null)
    try {
      const response = await fetch(`${API_URL}/api/assistant/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (response.ok) {
        setCustomer(data)
        setStatus('idle')
      } else {
        setMessage(data.error || 'Customer not found')
        setStatus('error')
      }
    } catch {
      setMessage('Network error')
      setStatus('error')
    }
  }

  const handleReportUsage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return
    setStatus('loading')
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/api/assistant/report-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.customerId,
          hours: parseFloat(hours),
          password,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(`Successfully logged ${hours} hours!`)
        setStatus('success')
        setHours('')
        // Refresh customer data
        const refreshResponse = await fetch(`${API_URL}/api/assistant/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: customer.email, password }),
        })
        if (refreshResponse.ok) {
          setCustomer(await refreshResponse.json())
        }
      } else {
        setMessage(data.error || 'Failed to log usage')
        setStatus('error')
      }
    } catch {
      setMessage('Network error')
      setStatus('error')
    }
  }

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
                    <p className="text-xs text-[#999] font-mono">{customer.customerId}</p>
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
                    <form onSubmit={handleReportUsage} className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-[#2C2C2C] mb-2">
                        Log Hours Used
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.25"
                          min="0.25"
                          value={hours}
                          onChange={(e) => setHours(e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none"
                          placeholder="e.g. 1.5"
                          required
                        />
                        <button
                          type="submit"
                          disabled={status === 'loading' || !hours}
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
  )
}

// Home Page
function HomePage() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowBanner(window.scrollY > 100)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <StickyBanner show={showBanner} />
      <Hero />
      <WhatIsMyCare />
      <HowItWorks />
      <Services />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  )
}

// Main App with Router
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/assistant" element={<AssistantPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
