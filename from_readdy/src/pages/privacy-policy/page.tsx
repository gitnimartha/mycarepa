import { useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import Footer from '../home/components/Footer';

export default function PrivacyPolicyPage() {
  // SEO Configuration
  useSEO({
    title: 'Privacy Policy - My Care Personal Assistant™',
    description: 'Learn how My Care Personal Assistant™ collects, uses, and protects your personal information. Our privacy policy explains our commitment to data security and your privacy rights.',
    keywords: 'privacy policy, data protection, personal information, data security, privacy rights',
    canonical: '/privacy-policy',
    ogTitle: 'Privacy Policy - My Care Personal Assistant™',
    ogDescription: 'Learn how we protect your personal information and respect your privacy.',
    ogType: 'article',
    schema: {
      '@type': 'WebPage',
      name: 'Privacy Policy',
      description: 'Privacy policy for My Care Personal Assistant™ services',
      url: `${import.meta.env.VITE_SITE_URL || 'https://example.com'}/privacy-policy`,
      publisher: {
        '@type': 'Organization',
        name: 'My Care Personal Assistant™',
      },
      dateModified: new Date().toISOString(),
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-serif font-bold text-[#2C2C2C] hover:text-[#A8B89F] transition-colors duration-200 cursor-pointer">
            <i className="ri-heart-pulse-line text-[#A8B89F]"></i>
            MY CARE PERSONAL ASSISTANT™
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#2C2C2C] mb-6">
          Privacy Policy
        </h1>
        
        <p className="text-base text-[#6B6B6B] mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-[#2C2C2C]">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              At My Care Personal Assistant™, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our personal assistant services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use our services.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Information We Collect</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              We may collect information about you in a variety of ways. The information we may collect includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li><strong>Personal Data:</strong> Name, email address, phone number, and other contact information you provide when signing up for our services.</li>
              <li><strong>Service Information:</strong> Details about the tasks and services you request from your personal assistant.</li>
              <li><strong>Payment Information:</strong> Billing address and payment method details processed securely through our payment processors.</li>
              <li><strong>Communication Data:</strong> Records of your communications with us and your assigned personal assistant.</li>
              <li><strong>Usage Data:</strong> Information about how you use our website and services, including access times, pages viewed, and navigation patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">How We Use Your Information</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li>Provide, operate, and maintain our personal assistant services</li>
              <li>Match you with qualified personal assistants based on your needs</li>
              <li>Process your transactions and manage your subscription</li>
              <li>Communicate with you about services, updates, and promotional offers</li>
              <li>Improve and personalize your experience with our services</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Monitor and analyze usage patterns to enhance our services</li>
              <li>Detect, prevent, and address technical issues or fraudulent activity</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Information Sharing and Disclosure</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li><strong>With Your Personal Assistant:</strong> We share necessary information with your assigned personal assistant to fulfill your service requests.</li>
              <li><strong>Service Providers:</strong> We may share information with third-party vendors who perform services on our behalf, such as payment processing, data analysis, and customer service.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid requests by public authorities.</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, or acquisition, your information may be transferred.</li>
              <li><strong>With Your Consent:</strong> We may share your information for any other purpose with your explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Data Retention</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Your Privacy Rights</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Objection:</strong> Object to our processing of your personal information</li>
              <li><strong>Portability:</strong> Request transfer of your information to another service</li>
              <li><strong>Withdraw Consent:</strong> Withdraw your consent at any time where we rely on consent to process your information</li>
            </ul>
            <p className="text-base leading-relaxed text-[#6B6B6B] mt-4">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our services.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Third-Party Links</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Changes to This Privacy Policy</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-[#FFF8F0] p-6 rounded-lg space-y-2">
              <p className="text-base text-[#2C2C2C]">
                <strong>Email:</strong> privacy@mycarepa.com
              </p>
              <p className="text-base text-[#2C2C2C]">
                <strong>Phone:</strong> 1-800-MY-CARE-1
              </p>
              <p className="text-base text-[#2C2C2C]">
                <strong>Address:</strong> 255 N. Sierra Street, #2312, Reno NV 89501
              </p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#A8B89F] text-white font-semibold rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-arrow-left-line"></i>
            Back to Home
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
