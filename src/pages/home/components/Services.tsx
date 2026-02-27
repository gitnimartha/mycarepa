export default function Services() {
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
      ],
      large: true
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
  ];

  return (
    <section className="py-20 bg-[#FFF8F0]">
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
              className={`${category.color} rounded-2xl p-8 ${
                category.large ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
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
  );
}
