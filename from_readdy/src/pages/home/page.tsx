import { useState, useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import { API_URL } from '../../config/api';
import Hero from './components/Hero';
import StickyBanner from './components/StickyBanner';
import WhatIsMyCare from './components/WhatIsMyCare';
import HowItWorks from './components/HowItWorks';
import Services from './components/Services';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function HomePage() {
  const [showBanner, setShowBanner] = useState(false);

  // SEO Configuration
  useSEO({
    title: 'My Care Personal Assistant™ - Your Personal Assistant When You Need Help Most',
    description: 'My Care Personal Assistant™ connects you with a real, trained human who helps you work through challenges, stay organized, and move forward. No scripts. No bots. Get matched with a person who listens and cares. Start your free trial today.',
    keywords: 'personal assistant, life support, human support, personal help, organization assistance, emotional support',
    canonical: '/',
    ogTitle: 'My Care Personal Assistant™ - Your Personal Assistant When You Need Help Most',
    ogDescription: 'Real human support when you need help most. Connect with a trained personal assistant who helps you navigate life\'s challenges.',
    ogType: 'website',
    schema: {
      '@type': 'Organization',
      name: 'My Care Personal Assistant™',
      url: import.meta.env.VITE_SITE_URL || 'https://example.com',
      logo: `${import.meta.env.VITE_SITE_URL || 'https://example.com'}/logo.png`,
      description: 'Professional personal assistant services providing real human support for life management, organization, and emotional support.',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '255 N. Sierra Street, #2312',
        addressLocality: 'Reno',
        addressRegion: 'NV',
        postalCode: '89501',
        addressCountry: 'US',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-800-692-2731',
        contactType: 'Customer Service',
        areaServed: 'US',
        availableLanguage: 'English',
      },
      sameAs: [],
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    },
  });

  // Warm up Railway backend on page load (prevents cold start delay on button click)
  useEffect(() => {
    fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowBanner(true);
      } else {
        setShowBanner(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header>
        <h1 className="sr-only">My Care Personal Assistant™</h1>
      </header>
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
  );
}
