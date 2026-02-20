import { useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import Footer from '../home/components/Footer';

export default function TermsOfServicePage() {
  // SEO Configuration
  useSEO({
    title: 'Terms of Service - My Care Personal Assistant™',
    description: 'Read the terms and conditions for using My Care Personal Assistant™ services. Learn about service agreements, user responsibilities, payment terms, and our commitment to quality service.',
    keywords: 'terms of service, service agreement, user terms, conditions, service policy',
    canonical: '/terms-of-service',
    ogTitle: 'Terms of Service - My Care Personal Assistant™',
    ogDescription: 'Terms and conditions for using My Care Personal Assistant™ services.',
    ogType: 'article',
    schema: {
      '@type': 'WebPage',
      name: 'Terms of Service',
      description: 'Terms of service for My Care Personal Assistant™',
      url: `${import.meta.env.VITE_SITE_URL || 'https://example.com'}/terms-of-service`,
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#2C2C2C] mb-8">
          Terms of Service
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-[#6B6B6B] mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              By accessing and using MyCarePA's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              2. Service Description
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              MyCarePA provides personal assistant services to help with daily tasks, errands, appointments, and various life management activities. Our services are designed to support individuals who need assistance managing their daily responsibilities.
            </p>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              Services include but are not limited to:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2 mb-4">
              <li>Appointment scheduling and management</li>
              <li>Errand running and shopping assistance</li>
              <li>Bill payment and financial organization</li>
              <li>Travel planning and coordination</li>
              <li>Home organization and decluttering</li>
              <li>Event planning and coordination</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              3. User Responsibilities
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              As a user of MyCarePA services, you agree to:
            </p>
            <ul className="list-disc pl-6 text-[#6B6B6B] space-y-2 mb-4">
              <li>Provide accurate and complete information when requesting services</li>
              <li>Treat our personal assistants with respect and professionalism</li>
              <li>Pay for services in accordance with the agreed-upon pricing plan</li>
              <li>Provide reasonable notice for cancellations or changes to scheduled services</li>
              <li>Not request services that are illegal, dangerous, or outside our scope of work</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              4. Payment Terms
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              Payment for services is due according to your selected plan (hourly, monthly, or premium). All fees are non-refundable except as required by law or as explicitly stated in these terms.
            </p>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              We reserve the right to change our pricing with 30 days' notice to existing customers. New pricing will apply to renewals after the notice period.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              5. Cancellation Policy
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              For scheduled services, we require at least 24 hours' notice for cancellations. Cancellations made with less than 24 hours' notice may be subject to a cancellation fee equal to 50% of the scheduled service cost.
            </p>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              Monthly and premium plan subscribers may cancel their subscription at any time, with cancellation taking effect at the end of the current billing period.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              MyCarePA and its personal assistants will exercise reasonable care in providing services. However, we are not liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of our services.
            </p>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              Our total liability for any claim arising from our services shall not exceed the amount paid by you for the specific service giving rise to the claim.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              7. Confidentiality
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              We understand that our personal assistants may have access to sensitive personal information. All staff members are required to maintain strict confidentiality regarding client information and activities.
            </p>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              For more information about how we handle your data, please review our Privacy Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              8. Service Modifications
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              We reserve the right to modify, suspend, or discontinue any aspect of our services at any time. We will provide reasonable notice of any significant changes that may affect your use of our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              9. Dispute Resolution
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              Any disputes arising from these terms or our services shall first be addressed through good-faith negotiation. If a resolution cannot be reached, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              10. Governing Law
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which MyCarePA operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              We may update these Terms of Service from time to time. We will notify users of any material changes by posting the new terms on our website and updating the "Last Updated" date. Your continued use of our services after such changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#2C2C2C] mb-4">
              12. Contact Information
            </h2>
            <p className="text-[#6B6B6B] leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us through the contact form on our website or reach out to our customer service team.
            </p>
          </section>

          <div className="mt-12 p-6 bg-[#FFF8F0] rounded-lg border-l-4 border-[#A8B89F]">
            <p className="text-[#2C2C2C] font-medium">
              By using MyCarePA's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
