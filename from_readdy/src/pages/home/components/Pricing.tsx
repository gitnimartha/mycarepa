export default function Pricing() {
  const plans = [
    {
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

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
            {plans.map((plan, index) => (
              <div
                key={index}
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
                  onClick={scrollToContact}
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
  );
}
