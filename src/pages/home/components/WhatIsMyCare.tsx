export default function WhatIsMyCare() {
  const benefits = [
    'Understand what to do next',
    'Break down overwhelming tasks',
    'Stay on track with important follow-ups',
    'Get unstuck when technology, paperwork, or life gets complicated'
  ];

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
  );
}
