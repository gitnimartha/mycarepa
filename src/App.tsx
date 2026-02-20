import { useState, useEffect } from 'react'
import './index.css'

// Calendly type declaration
declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void
    }
  }
}

// API URL - empty string in production (same origin), localhost in development
const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

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

// Sticky Banner Component
function StickyBanner({ show }: { show: boolean }) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0] shadow-md transition-transform duration-300 ${
        show ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="ri-heart-fill text-[#A8B89F] text-xl"></i>
          <span className="font-serif text-lg font-semibold text-[#2C2C2C]">
            My Care Personal Assistant™
          </span>
        </div>
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
              onClick={() => scrollToSection('contact')}
              className="group relative w-full sm:w-auto px-10 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full overflow-hidden transition-all duration-300 whitespace-nowrap cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:scale-105"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                Buy Now!
                <i className="ri-arrow-right-line text-xl transition-transform duration-300 group-hover:translate-x-1"></i>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#A8B89F] via-[#8FA085] to-[#A8B89F] bg-[length:200%_100%] animate-shimmer"></div>
            </button>
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
    {
      number: 1,
      title: 'Get matched with a personal assistant',
      description: "You'll be paired with a trained assistant who becomes your primary point of contact.",
      icon: 'ri-user-heart-line'
    },
    {
      number: 2,
      title: 'Have a real conversation',
      description: 'Your first call is about understanding you—your situation, your goals, and what you need help with.',
      icon: 'ri-chat-smile-3-line'
    },
    {
      number: 3,
      title: 'Get ongoing support',
      description: 'Your assistant checks in, helps you prioritize, and supports you through calls, messages, and follow-ups.',
      icon: 'ri-calendar-check-line'
    },
    {
      number: 4,
      title: 'Adjust as you go',
      description: 'What you need today may change tomorrow. Your assistant adapts with you.',
      icon: 'ri-refresh-line'
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-[#A8B89F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white">
            How It Works
          </h2>
          <div className="w-24 h-1 bg-[#2C2C2C] mx-auto mt-6"></div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-[#FFD4C4] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {step.number}
                </div>
                <div className="w-16 h-16 flex items-center justify-center">
                  <i className={`${step.icon} text-5xl text-[#A8B89F]`}></i>
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#2C2C2C] leading-tight">
                  {step.title}
                </h3>
                <p className="text-[#6B6B6B] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <img
            src="https://readdy.ai/api/search-image?query=A%20satisfied%20client%20smiling%20with%20relief%20and%20happiness%20looking%20toward%20the%20right%20side%20of%20screen%20in%20a%20comfortable%20home%20setting%20with%20warm%20natural%20lighting%20soft%20focus%20background%20showing%20peace%20of%20mind%20and%20contentment%20after%20receiving%20support%20professional%20photography&width=600&height=400&seq=satisfied001&orientation=landscape"
            alt="Satisfied client"
            className="rounded-3xl shadow-2xl max-w-2xl w-full h-auto object-cover"
          />
        </div>
      </div>
    </section>
  )
}

// Services Section
function Services() {
  const categories = [
    {
      title: 'Life & Organization',
      icon: 'ri-calendar-todo-line',
      color: 'bg-[#FFD4C4]',
      items: [
        'Breaking down overwhelming to-do lists',
        'Staying on top of important deadlines',
        'Following up on calls, emails, or applications',
        'Keeping track of next steps when life feels chaotic'
      ]
    },
    {
      title: 'Technology & Online Tasks',
      icon: 'ri-computer-line',
      color: 'bg-[#E8F4E8]',
      items: [
        'Navigating websites, portals, and dashboards',
        'Understanding emails, forms, or instructions',
        'Troubleshooting basic tech or account issues',
        'Walking through online processes step by step'
      ]
    },
    {
      title: 'Preparation & Guidance',
      icon: 'ri-lightbulb-line',
      color: 'bg-[#FFF8F0]',
      items: [
        'Preparing for important calls or meetings',
        'Understanding what questions to ask',
        'Organizing documents or information',
        'Talking through options before making decisions'
      ]
    },
    {
      title: 'Emotional Support (Non-Therapy)',
      icon: 'ri-heart-pulse-line',
      color: 'bg-[#E8E0F4]',
      items: [
        'Having someone listen without judgment',
        'Feeling supported during stressful situations',
        'Talking things through when you feel stuck or overwhelmed'
      ]
    }
  ]

  return (
    <section id="services" className="py-20 bg-[#FFF8F0]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[#2C2C2C] mb-6">
            What Can My Care Personal Assistant Help With?
          </h2>
          <p className="text-lg text-[#6B6B6B] leading-relaxed max-w-4xl">
            MyCarePA assistants are trained to support real-life challenges, not just one narrow task.
            Here are common ways people use MyCarePA:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`${category.color} rounded-2xl p-8`}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center">
                  <i className={`${category.icon} text-4xl text-[#2C2C2C]`}></i>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#2C2C2C] flex-1">
                  {category.title}
                </h3>
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
          <h3 className="font-serif text-2xl font-semibold text-[#2C2C2C] mb-4">
            What MyCarePA Is Not
          </h3>
          <p className="text-[#6B6B6B] leading-relaxed mb-4">
            To set expectations clearly:
          </p>
          <ul className="space-y-2 text-[#6B6B6B]">
            <li className="flex items-start gap-3">
              <span>•</span>
              <span>We do not provide legal, medical, or financial advice</span>
            </li>
            <li className="flex items-start gap-3">
              <span>•</span>
              <span>We do not replace licensed professionals</span>
            </li>
            <li className="flex items-start gap-3">
              <span>•</span>
              <span>We are not a call center or chatbot</span>
            </li>
            <li className="flex items-start gap-3">
              <span>•</span>
              <span>We are not therapy</span>
            </li>
          </ul>
          <p className="text-[#2C2C2C] font-medium mt-4 italic">
            MyCarePA is about support, clarity, and momentum—not diagnosis or representation.
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-[#6B6B6B] italic">
            If you're unsure whether we can help with something, that's okay. We'll figure it out together during your first call.
          </p>
        </div>
      </div>
    </section>
  )
}

// Pricing Section with Stripe Integration
function Pricing() {
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
  ]

  return (
    <section id="pricing" className="py-20 bg-white">
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
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <i className="ri-checkbox-circle-fill text-[#A8B89F] text-lg mt-0.5 flex-shrink-0"></i>
                      <span className="text-[#2C2C2C] text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleCheckout(plan.id)}
                  className={`${
                    plan.popular ? 'group relative overflow-hidden' : ''
                  } w-full px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 whitespace-nowrap cursor-pointer ${
                    plan.popular ? 'hover:scale-105' : ''
                  }`}
                >
                  {plan.popular ? (
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
  )
}

// FAQ Section
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'How does My Care Personal Assistant work?',
      answer: "After signing up, you'll be matched with a dedicated personal assistant based on your needs. You can communicate via phone, email, or our secure messaging platform. Your assistant will help you with tasks, provide support, and keep you organized."
    },
    {
      question: 'What tasks can my personal assistant help with?',
      answer: "Your assistant can help with appointment scheduling, bill payments, travel planning, errands, home organization, event coordination, research, and general life management tasks. If you're unsure about a specific task, just ask!"
    },
    {
      question: 'Is my information kept confidential?',
      answer: 'Absolutely. All our assistants sign strict confidentiality agreements. Your personal information, conversations, and tasks are kept completely private and secure. We take data protection very seriously.'
    },
    {
      question: 'Can I change my plan or cancel anytime?',
      answer: 'Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the end of your current billing period. There are no long-term contracts or cancellation fees.'
    },
    {
      question: 'What if I need help outside business hours?',
      answer: 'Our Plus and Premium plans include extended hours and priority support. For urgent matters, you can leave a message and your assistant will respond as soon as possible. Premium members get 24/7 emergency support.'
    },
    {
      question: 'How quickly will my assistant respond?',
      answer: 'Standard response time is within 2 hours during business hours (9 AM - 6 PM). Plus members get 1-hour response times, and Premium members receive priority responses within 30 minutes.'
    }
  ]

  return (
    <section id="faq" className="py-20 bg-[#2C2C2C]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white italic">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="font-semibold text-lg text-[#2C2C2C] pr-4">
                    {faq.question}
                  </span>
                  <i
                    className={`${
                      openIndex === index ? 'ri-subtract-line' : 'ri-add-line'
                    } text-2xl text-[#A8B89F] flex-shrink-0 transition-transform duration-300`}
                  ></i>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-8 pb-6 text-[#6B6B6B] leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <img
                src="https://readdy.ai/api/search-image?query=A%20friendly%20caring%20personal%20assistant%20smiling%20warmly%20looking%20toward%20the%20left%20side%20of%20screen%20in%20a%20bright%20welcoming%20office%20with%20plants%20and%20natural%20light%20professional%20yet%20approachable%20atmosphere%20showing%20trust%20and%20reliability%20soft%20focus%20background&width=500&height=700&seq=faq001&orientation=portrait"
                alt="Friendly assistant"
                className="rounded-3xl shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Calendly URL
const CALENDLY_URL = 'https://calendly.com/mtkinz79/dfsd'

// Contact Form Section
function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    // Open Calendly popup with pre-filled user info
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: `${CALENDLY_URL}?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`
      })
      setStatus('success')
      // Reset form after short delay
      setTimeout(() => {
        setFormData({ name: '', email: '', phone: '', message: '' })
        setStatus('idle')
      }, 1000)
    } else {
      // Fallback: redirect to Calendly
      window.open(`${CALENDLY_URL}?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`, '_blank')
      setStatus('success')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-[#FFD4C4] to-[#FFF8F0] p-8 sm:p-12 flex items-center">
            <img
              src="https://readdy.ai/api/search-image?query=A%20diverse%20caring%20team%20of%20personal%20assistants%20in%20a%20bright%20welcoming%20modern%20office%20space%20with%20plants%20and%20natural%20light%20all%20smiling%20warmly%20and%20looking%20toward%20the%20right%20side%20showing%20professionalism%20trust%20and%20approachability%20warm%20tones%20and%20soft%20lighting&width=600&height=800&seq=team001&orientation=portrait"
              alt="My Care team"
              className="rounded-2xl shadow-xl w-full h-auto object-cover"
            />
          </div>

          <div className="bg-white p-6 sm:p-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2C2C2C] mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg text-[#6B6B6B] mb-8">
              You don't need a perfect plan. You just need a starting point.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none transition-colors duration-200"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none transition-colors duration-200"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none transition-colors duration-200"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-[#2C2C2C] mb-2">
                  Tell us a bit about what you need help with
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  maxLength={500}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#A8B89F] focus:outline-none transition-colors duration-200 resize-none"
                  placeholder="Optional - share what's on your mind..."
                ></textarea>
                <p className="text-sm text-[#6B6B6B] mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full px-8 py-4 bg-[#A8B89F] text-white text-lg font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
              >
                {status === 'submitting' ? 'Processing...' : 'Get Started'}
              </button>

              {status === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
                  Opening scheduler...
                </div>
              )}

              {status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center">
                  Something went wrong. Please try again.
                </div>
              )}
            </form>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-[#6B6B6B]">
              <div className="flex items-center gap-2">
                <i className="ri-shield-check-line text-[#A8B89F] text-xl"></i>
                <span>Trained Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-lock-line text-[#A8B89F] text-xl"></i>
                <span>Confidential</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-checkbox-circle-line text-[#A8B89F] text-xl"></i>
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
    <footer className="bg-[#2C2C2C] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-heart-fill text-[#A8B89F] text-2xl"></i>
              <span className="font-serif text-xl font-semibold">My Care Personal Assistant™</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Real human support when you need help most. Personal assistance for everyone.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('services')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Services
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('contact')} className="text-white hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-white hover:text-[#A8B89F] transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#A8B89F] transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-[#A8B89F] transition-colors duration-200">
                  Assistant Guidelines
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Stay Connected
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Get updates and tips for making the most of your MyCarePA personal assistant.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-transparent border border-gray-600 rounded-lg focus:border-[#A8B89F] focus:outline-none text-white placeholder-gray-500 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#A8B89F] rounded-lg hover:bg-[#8FA080] transition-colors duration-200 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-arrow-right-line text-white"></i>
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400">
          <p className="text-center md:text-left">© 2025 My Care Personal Assistant™. All rights reserved.</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center">
            <p>All assistants are trained professionals</p>
            <span className="hidden sm:inline">•</span>
            <p>Conversations are confidential</p>
            <span className="hidden sm:inline">•</span>
            <p>Clear boundaries respected</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Main App
function App() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowBanner(true)
      } else {
        setShowBanner(false)
      }
    }

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

export default App
