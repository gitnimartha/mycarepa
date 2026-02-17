import { useState } from 'react'
import './index.css'

// Icons
const HeartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
)

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const MonitorIcon = () => (
  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const LightbulbIcon = () => (
  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const HeartHandIcon = () => (
  <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const MinusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
)

const ShieldCheckIcon = () => (
  <svg className="w-5 h-5 text-[#7c8b7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5 text-[#7c8b7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

// API URL - use environment variable in production, localhost in development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

// Header Component
function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartIcon className="w-6 h-6 text-[#8fbc8f]" />
          <span className="font-semibold text-gray-900">My Care Personal Assistant™</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCheckout('starter')}
            className="bg-[#7c8b7c] hover:bg-[#6b7a6b] text-white px-5 py-2.5 rounded-full font-medium transition-colors"
          >
            Schedule Time
          </button>
          <a href="#pricing" className="border border-gray-300 hover:border-[#7c8b7c] text-gray-700 px-5 py-2.5 rounded-full font-medium transition-colors">
            View Plans
          </a>
        </div>
      </div>
    </header>
  )
}

// Hero Section
function Hero() {
  return (
    <section className="bg-gradient-to-b from-[#fdf2f4] to-white py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <HeartIcon className="w-5 h-5 text-[#8fbc8f]" />
              <span className="text-sm font-medium text-gray-600 tracking-wide">REAL HUMAN SUPPORT</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-6 leading-tight">
              My Care<br />Personal<br />Assistant™
            </h1>

            <p className="text-xl text-gray-700 mb-4 font-medium">
              Your personal assistant when you need help most
            </p>

            <p className="text-gray-600 mb-4 leading-relaxed">
              Life doesn't come with instructions. You don't have to figure everything out alone. My Care Personal Assistant™ connects you with a real, trained human who helps you work through challenges, stay organized, and move forward.
            </p>

            <p className="text-gray-600 mb-8 leading-relaxed">
              No scripts. No bots. You'll be matched with a person who listens and cares.
            </p>

            <button
              onClick={() => handleCheckout('starter')}
              className="bg-[#7c8b7c] hover:bg-[#6b7a6b] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors mb-3"
            >
              Start Your Free Trial
            </button>
            <p className="text-sm text-gray-500">No credit card required</p>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=700&fit=crop"
              alt="Woman working on laptop"
              className="rounded-3xl shadow-lg w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// About Section
function About() {
  const benefits = [
    "Understand what to do next",
    "Break down overwhelming tasks",
    "Stay on track with important follow-ups",
    "Get unstuck when technology, paperwork, or life gets complicated"
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#7c8b7c] text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
            ABOUT THE SERVICE
          </span>
          <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900">
            What is My Care Personal Assistant?
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face"
              alt="Personal assistant"
              className="rounded-full w-80 h-80 object-cover shadow-lg"
            />
          </div>

          <div>
            <p className="text-gray-600 mb-6 leading-relaxed text-lg">
              My Care is a personal assistant service designed for real people, not executives or celebrities. Most people think personal assistants are only for the wealthy. We believe everyone deserves access to reliable human support—especially during stressful or confusing moments.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Your personal assistant can help you:
            </h3>

            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <HeartIcon className="w-5 h-5 text-[#8fbc8f] mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// How It Works Icons
const PersonIcon = () => (
  <svg className="w-10 h-10 text-[#7c8b7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-10 h-10 text-[#7c8b7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const ChecklistIcon = () => (
  <svg className="w-10 h-10 text-[#7c8b7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-10 h-10 text-[#7c8b7c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// How It Works Section
function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: <PersonIcon />,
      title: "Get matched with a personal assistant",
      description: "You'll be paired with a trained assistant who becomes your primary point of contact."
    },
    {
      number: "2",
      icon: <ChatIcon />,
      title: "Have a real conversation",
      description: "Your first call is about understanding you—your situation, your goals, and what you need help with."
    },
    {
      number: "3",
      icon: <ChecklistIcon />,
      title: "Get ongoing support",
      description: "Your assistant checks in, helps you prioritize, and supports you through calls, messages, and follow-ups."
    },
    {
      number: "4",
      icon: <RefreshIcon />,
      title: "Adjust as you go",
      description: "What you need today may change tomorrow. Your assistant adapts with you."
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-[#fdf2f4]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-serif font-bold text-[#4a5548] mb-4">
            How It Works
          </h2>
          <div className="w-16 h-1 bg-[#4a5548] mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              {/* Number Circle */}
              <div className="w-14 h-14 bg-[#f8d7da] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-xl font-semibold text-[#4a5548]">{step.number}</span>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-6">
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{step.title}</h3>

              {/* Description */}
              <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=500&fit=crop"
            alt="Woman smiling at laptop"
            className="rounded-2xl shadow-xl max-w-3xl w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}

// Services Section
function Services() {
  const services = [
    {
      title: "Life & Organization",
      icon: <CalendarIcon />,
      bgColor: "bg-[#fde4db]",
      items: [
        "Breaking down overwhelming to-do lists",
        "Staying on top of important deadlines",
        "Following up on calls, emails, or applications",
        "Keeping track of next steps when life feels chaotic"
      ]
    },
    {
      title: "Technology & Online Tasks",
      icon: <MonitorIcon />,
      bgColor: "bg-[#e8f0e8]",
      items: [
        "Navigating websites, portals, and dashboards",
        "Understanding emails, forms, or instructions",
        "Troubleshooting basic tech or account issues",
        "Walking through online processes step by step"
      ]
    },
    {
      title: "Preparation & Guidance",
      icon: <LightbulbIcon />,
      bgColor: "bg-white",
      items: [
        "Preparing for important calls or meetings",
        "Understanding what questions to ask",
        "Organizing documents or information",
        "Talking through options before making decisions"
      ]
    },
    {
      title: "Emotional Support (Non-Therapy)",
      icon: <HeartHandIcon />,
      bgColor: "bg-[#f0e8f0]",
      items: [
        "Having someone listen without judgment",
        "Feeling supported during stressful situations",
        "Talking things through when you feel stuck or overwhelmed"
      ]
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-4">
          What Can My Care Personal Assistant Help With?
        </h2>
        <p className="text-gray-600 mb-12 max-w-3xl">
          Care assistants are trained to support real-life challenges, not just one narrow task. Here are common ways people use My Care:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <div key={index} className={`${service.bgColor} rounded-2xl p-8`}>
              <div className="flex items-center gap-3 mb-6">
                {service.icon}
                <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
              </div>
              <ul className="space-y-3">
                {service.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <HeartIcon className="w-4 h-4 text-[#8fbc8f] mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* What We're Not */}
        <div className="mt-12 border-l-4 border-gray-300 bg-gray-50 rounded-r-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">What My Care Is Not</h3>
          <p className="text-gray-600 mb-4">To set expectations clearly:</p>
          <ul className="space-y-2 text-gray-600 mb-4">
            <li>• We do not provide legal, medical, or financial advice</li>
            <li>• We do not replace licensed professionals</li>
            <li>• We are not a call center or chatbot</li>
            <li>• We are not therapy</li>
          </ul>
          <p className="italic text-gray-600">
            My Care is about support, clarity, and momentum—not diagnosis or representation.
          </p>
        </div>
      </div>
    </section>
  )
}

// Pricing Section
function Pricing() {
  const plans = [
    {
      id: 'starter',
      name: "My Care Starter",
      subtitle: "Light, occasional support",
      hours: "5",
      features: [
        "Up to 5 hours per month",
        "Phone calls and messages",
        "Email follow-ups",
        "Flexible scheduling"
      ]
    },
    {
      id: 'professional',
      name: "My Care Plus",
      subtitle: "Regular guidance & follow-ups",
      hours: "10",
      features: [
        "Up to 10 hours per month",
        "Priority response times",
        "Phone calls and messages",
        "Document organization support",
        "Weekly check-ins"
      ]
    },
    {
      id: 'enterprise',
      name: "My Care Pro",
      subtitle: "High-touch, ongoing support",
      hours: "20+",
      features: [
        "20+ hours per month",
        "Dedicated assistant",
        "Same-day response",
        "Comprehensive support",
        "Daily availability",
        "Custom scheduling"
      ]
    }
  ]

  return (
    <section id="pricing" className="py-20 bg-[#fdf8f6]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#7c8b7c] text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
            SIMPLE, TRANSPARENT PRICING
          </span>
          <h2 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900">
            Pricing & Plans
          </h2>
        </div>

        {/* Free Trial Card */}
        <div className="bg-[#fde4db] rounded-2xl p-8 mb-12 relative max-w-4xl mx-auto">
          <span className="absolute top-4 right-4 bg-[#7c8b7c] text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
          <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">Free Trial</h3>
          <p className="text-gray-700 mb-6">Try My Care for 1 month at no cost!</p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <CheckIcon className="w-5 h-5 text-[#7c8b7c]" />
              <span className="text-gray-700">3 hours of personal assistant support</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon className="w-5 h-5 text-[#7c8b7c]" />
              <span className="text-gray-700">Phone calls, messages, and follow-ups</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckIcon className="w-5 h-5 text-[#7c8b7c]" />
              <span className="text-gray-700">No obligation to continue</span>
            </li>
          </ul>
          <button
            onClick={() => handleCheckout('starter')}
            className="w-full bg-[#7c8b7c] hover:bg-[#6b7a6b] text-white py-4 rounded-full font-semibold text-lg transition-colors"
          >
            Start Your Free Trial
          </button>
        </div>

        {/* Ongoing Plans */}
        <h3 className="text-2xl font-serif font-bold text-gray-900 text-center mb-8">
          Ongoing Support Plans
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl p-8 border border-gray-200">
              <h4 className="text-xl font-semibold text-gray-900 mb-1">{plan.name}</h4>
              <p className="text-gray-500 italic mb-6">{plan.subtitle}</p>

              <div className="mb-6">
                <span className="text-5xl font-light text-[#7c8b7c]">{plan.hours}</span>
                <span className="text-gray-500 ml-2">hours/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-[#7c8b7c]" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                className="w-full border-2 border-[#7c8b7c] text-[#7c8b7c] hover:bg-[#7c8b7c] hover:text-white py-3 rounded-full font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 mt-8 italic">
          Exact pricing and plan details are discussed after your trial, based on how you actually use the service. We believe pricing should match real value, not rigid packages.
        </p>

        {/* After Trial */}
        <div className="bg-[#fdf8f6] border border-gray-200 rounded-2xl p-8 mt-12 max-w-2xl mx-auto">
          <h4 className="text-xl font-semibold text-gray-900 text-center mb-4">
            What Happens After the Trial?
          </h4>
          <p className="text-gray-600 text-center mb-4">Near the end of your trial:</p>
          <ul className="space-y-2 text-gray-600 mb-4">
            <li>• You'll review how you used your time</li>
            <li>• We'll talk about what helped most</li>
            <li>• You decide if you want to continue—and at what level</li>
          </ul>
          <p className="text-center font-semibold text-gray-900">No pressure. No surprises.</p>
        </div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "Who is My Care for?",
      answer: "My Care is for people who feel overwhelmed or stuck, want help but don't know where to start, are tired of automated systems and endless menus, or just want someone to help them think clearly. If that sounds like you, My Care was built for you."
    },
    {
      question: "How is this different from therapy?",
      answer: "My Care provides practical support and guidance, not mental health treatment. We help with tasks, organization, and decision-making. For mental health concerns, we recommend working with a licensed therapist."
    },
    {
      question: "What if I don't know what I need help with?",
      answer: "That's completely okay! Many people start without a clear list. Your assistant will help you identify what's weighing on you and break it down into manageable steps."
    },
    {
      question: "Are my conversations confidential?",
      answer: "Yes. Your conversations and personal information are kept strictly confidential. We take your privacy seriously."
    },
    {
      question: "Can I change my plan or cancel anytime?",
      answer: "Absolutely. You can upgrade, downgrade, or cancel your plan at any time. No long-term commitments required."
    },
    {
      question: "What happens during the free trial?",
      answer: "During your free trial, you'll get 3 hours of support to experience how My Care works. Use it for whatever you need—organizing tasks, getting unstuck, or just having someone to think through problems with."
    },
    {
      question: "How quickly can I get started?",
      answer: "Most people are matched with an assistant within 24-48 hours of signing up. We'll reach out to schedule your first session at a time that works for you."
    },
    {
      question: "What if I need help outside of business hours?",
      answer: "We offer flexible scheduling including evenings and weekends for Pro members. Starter and Plus members have standard business hours availability with some flexibility."
    }
  ]

  return (
    <section className="py-20 bg-[#4a5548]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl lg:text-4xl font-serif italic text-white text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openIndex === index ? <MinusIcon /> : <PlusIcon />}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=600&fit=crop"
              alt="Smiling professional"
              className="rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Contact Form Section
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleCheckout('starter')
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl">
          <div className="bg-[#fde4db] p-8 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&h=600&fit=crop"
              alt="Team collaboration"
              className="rounded-2xl shadow-lg max-w-md w-full"
            />
          </div>

          <div className="bg-white p-8 lg:p-12">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-8">
              You don't need a perfect plan. You just need a starting point.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c8b7c] focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c8b7c] focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c8b7c] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us a bit about what you need help with
                </label>
                <textarea
                  placeholder="Optional - share what's on your mind..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c8b7c] focus:border-transparent outline-none resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">{formData.message.length}/500 characters</p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#7c8b7c] hover:bg-[#6b7a6b] text-white py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Start Your Free Trial
              </button>
            </form>

            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon />
                <span>Trained Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <LockIcon />
                <span>Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-[#7c8b7c]" />
                <span>No Obligation</span>
              </div>
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
    <footer className="bg-[#3d4a3d] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HeartIcon className="w-6 h-6 text-[#8fbc8f]" />
              <span className="font-semibold">My Care Personal Assistant™</span>
            </div>
            <p className="text-gray-400 text-sm">
              Real human support when you need help most. Personal assistance for everyone.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-300 mb-4">QUICK LINKS</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-300 mb-4">SUPPORT</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Assistant Guidelines</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-300 mb-4">STAY CONNECTED</h4>
            <p className="text-gray-400 text-sm mb-4">
              Get updates and tips for making the most of your personal assistant.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-[#4a5548] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#8fbc8f]"
              />
              <button className="bg-[#7c8b7c] hover:bg-[#6b7a6b] px-4 py-2 rounded-lg transition-colors">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="text-center py-8 border-t border-gray-600">
          <h2 className="text-6xl lg:text-8xl font-serif text-gray-600/30 tracking-wider">
            MY CARE PERSONAL ASSISTANT™
          </h2>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-gray-600 text-sm text-gray-400">
          <p>© 2025 My Care Personal Assistant™. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>All assistants are trained professionals</span>
            <span>•</span>
            <span>Conversations are confidential</span>
            <span>•</span>
            <span>Clear boundaries respected</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Main App
function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <HowItWorks />
      <Services />
      <Pricing />
      <FAQ />
      <ContactForm />
      <Footer />
    </div>
  )
}

export default App
