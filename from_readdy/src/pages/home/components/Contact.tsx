import { useState } from 'react';
import { CALENDLY_URL_FREE_INTRO } from '../../../config/api';

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const formBody = new URLSearchParams({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      }).toString();

      const response = await fetch('https://readdy.ai/api/form/d5ot47d6ivkrft9v8mq0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });

        // Open Calendly popup for free intro call
        if (window.Calendly) {
          window.Calendly.initPopupWidget({ url: CALENDLY_URL_FREE_INTRO });
        }

        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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

            <form id="contact-form" onSubmit={handleSubmit} className="space-y-6" data-readdy-form>
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
                {status === 'submitting' ? 'Sending...' : 'Get Started'}
              </button>

              {status === 'success' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
                  Thank you! We'll be in touch soon to get you started.
                </div>
              )}

              {status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center">
                  Something went wrong. Please try again or email us directly.
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
  );
}
