import { useState, useEffect } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How does My Care Personal Assistant work?',
      answer: 'After signing up, you\'ll be matched with a dedicated personal assistant based on your needs. You can communicate via phone, email, or our secure messaging platform. Your assistant will help you with tasks, provide support, and keep you organized.',
    },
    {
      question: 'What tasks can my personal assistant help with?',
      answer: 'Your assistant can help with appointment scheduling, bill payments, travel planning, errands, home organization, event coordination, research, and general life management tasks. If you\'re unsure about a specific task, just ask!',
    },
    {
      question: 'Is my information kept confidential?',
      answer: 'Absolutely. All our assistants sign strict confidentiality agreements. Your personal information, conversations, and tasks are kept completely private and secure. We take data protection very seriously.',
    },
    {
      question: 'Can I change my plan or cancel anytime?',
      answer: 'Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the end of your current billing period. There are no long-term contracts or cancellation fees.',
    },
    {
      question: 'What if I need help outside business hours?',
      answer: 'Our Plus and Premium plans include extended hours and priority support. For urgent matters, you can leave a message and your assistant will respond as soon as possible. Premium members get 24/7 emergency support.',
    },
    {
      question: 'How quickly will my assistant respond?',
      answer: 'Standard response time is within 2 hours during business hours (9 AM - 6 PM). Plus members get 1-hour response times, and Premium members receive priority responses within 30 minutes.',
    },
  ];

  // Add FAQ Schema to page
  useEffect(() => {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    let scriptTag = document.querySelector('script[data-faq-schema="true"]');
    
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      scriptTag.setAttribute('data-faq-schema', 'true');
      document.head.appendChild(scriptTag);
    }

    scriptTag.textContent = JSON.stringify(faqSchema);

    return () => {
      const tag = document.querySelector('script[data-faq-schema="true"]');
      if (tag) {
        tag.remove();
      }
    };
  }, []);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-white">
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
  );
}
