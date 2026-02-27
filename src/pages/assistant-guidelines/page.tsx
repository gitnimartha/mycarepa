import { useEffect } from 'react';
import { useSEO } from '../../utils/seo';
import Footer from '../home/components/Footer';

export default function AssistantGuidelinesPage() {
  // SEO Configuration
  useSEO({
    title: 'Assistant Guidelines - My Care Personal Assistant™',
    description: 'Learn about our professional standards, service scope, and quality assurance guidelines. Discover how My Care Personal Assistant™ maintains excellence in personal assistant services.',
    keywords: 'assistant guidelines, professional standards, service quality, personal assistant standards, service guidelines',
    canonical: '/assistant-guidelines',
    ogTitle: 'Assistant Guidelines - My Care Personal Assistant™',
    ogDescription: 'Professional standards and guidelines for My Care Personal Assistant™ services.',
    ogType: 'article',
    schema: {
      '@type': 'WebPage',
      name: 'Assistant Guidelines',
      description: 'Professional guidelines and standards for My Care Personal Assistant™ services',
      url: `${import.meta.env.VITE_SITE_URL || 'https://example.com'}/assistant-guidelines`,
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
          Assistant Guidelines
        </h1>
        
        <p className="text-base text-[#6B6B6B] mb-8">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-[#2C2C2C]">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Our Commitment to Excellence</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              At My Care Personal Assistant™, we maintain the highest standards of professionalism, confidentiality, and care. Our assistant guidelines ensure that every interaction meets our commitment to providing exceptional personal assistance while respecting boundaries and maintaining trust.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Professional Standards</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              All My Care Personal Assistants adhere to the following professional standards:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li><strong>Confidentiality:</strong> All client information, conversations, and tasks are kept strictly confidential</li>
              <li><strong>Reliability:</strong> Assistants respond promptly and complete tasks within agreed timeframes</li>
              <li><strong>Professionalism:</strong> Maintain courteous, respectful communication at all times</li>
              <li><strong>Competence:</strong> Only accept tasks within their skill set and expertise</li>
              <li><strong>Transparency:</strong> Communicate clearly about capabilities, limitations, and progress</li>
              <li><strong>Accountability:</strong> Take responsibility for work quality and meet commitments</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Scope of Services</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              Our assistants are trained to help with a wide range of tasks, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li>Administrative tasks and scheduling</li>
              <li>Research and information gathering</li>
              <li>Travel planning and booking</li>
              <li>Personal errands and shopping assistance</li>
              <li>Event planning and coordination</li>
              <li>Communication management</li>
              <li>Document preparation and organization</li>
              <li>General life management support</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Service Boundaries</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              To maintain professional relationships and ensure quality service, our assistants do not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li>Provide medical, legal, or financial advice</li>
              <li>Handle tasks requiring professional licenses or certifications</li>
              <li>Engage in activities that violate laws or regulations</li>
              <li>Share personal contact information or meet clients outside the platform</li>
              <li>Accept gifts, tips, or payments outside the official platform</li>
              <li>Discuss other clients or share confidential information</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Communication Guidelines</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              Effective communication is key to successful assistance:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li><strong>Response Time:</strong> Assistants aim to respond within 2 hours during business hours</li>
              <li><strong>Availability:</strong> Standard availability is Monday-Friday, 9 AM - 6 PM local time</li>
              <li><strong>Emergency Requests:</strong> For urgent matters, use the priority request feature</li>
              <li><strong>Clear Instructions:</strong> Provide detailed information for best results</li>
              <li><strong>Feedback:</strong> Regular check-ins ensure tasks meet your expectations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Verifying Subscription Status Before Meetings</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              Before proceeding with any scheduled meeting, assistants must verify the client's subscription status:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li><strong>Check the Dashboard:</strong> Log into the Assistant Dashboard at <code className="bg-gray-100 px-2 py-1 rounded">/assistant</code></li>
              <li><strong>Look Up Customer:</strong> Search for the customer's email address</li>
              <li><strong>Verify Hours:</strong> Check if the customer has remaining hours in their plan</li>
              <li><strong>Proceed or Decline:</strong>
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Has hours remaining:</strong> Proceed with the call and log hours used after</li>
                  <li><strong>No hours remaining:</strong> Do not proceed with the call. Send a polite email explaining they need to upgrade their plan to continue service</li>
                </ul>
              </li>
            </ol>
            <div className="bg-[#FFF8F0] p-4 rounded-lg mt-4">
              <p className="text-base text-[#2C2C2C]">
                <i className="ri-information-line text-[#A8B89F] mr-2"></i>
                <strong>Note:</strong> The scheduling link may be accessible to anyone, but the actual service is controlled by the assistant. Always verify subscription status before providing service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Quality Assurance</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              We continuously monitor and improve our service quality through regular training, performance reviews, and client feedback. All assistants undergo background checks and complete comprehensive training before serving clients. We maintain a quality assurance team that reviews interactions and ensures compliance with our guidelines.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Client Responsibilities</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              To ensure the best experience, we ask clients to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li>Provide clear, detailed instructions for tasks</li>
              <li>Communicate respectfully with assistants</li>
              <li>Provide necessary access, credentials, or information securely</li>
              <li>Give reasonable timeframes for task completion</li>
              <li>Provide feedback to help improve service</li>
              <li>Report any concerns or issues promptly</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              All assistants are trained in data security best practices. They use secure communication channels, protect sensitive information, and follow strict protocols for handling passwords, financial information, and personal data. We never store sensitive information longer than necessary and use encryption for all data transmission.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Conflict Resolution</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              If you experience any issues with your assistant:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-base text-[#6B6B6B] ml-4">
              <li>First, communicate directly with your assistant to resolve the matter</li>
              <li>If unresolved, contact our support team for mediation</li>
              <li>We will investigate and take appropriate action within 24-48 hours</li>
              <li>You may request a different assistant at any time</li>
            </ol>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Continuous Improvement</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B]">
              We regularly update these guidelines based on client feedback, industry best practices, and evolving needs. All assistants receive ongoing training to maintain and improve their skills. We welcome your suggestions for how we can better serve you.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-base leading-relaxed text-[#6B6B6B] mb-4">
              If you have questions about our assistant guidelines or need to report a concern:
            </p>
            <div className="bg-[#FFF8F0] p-6 rounded-lg space-y-2">
              <p className="text-base text-[#2C2C2C]">
                <strong>Email:</strong> support@mycarepa.com
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
